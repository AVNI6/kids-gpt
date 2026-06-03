"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasAnyGeminiApiKey, generateStructuredObject } from "@/lib/ai/structured-generator";

interface GenerateBaseActivityOptions<TSchema extends z.ZodTypeAny, TResult = z.infer<TSchema>> {
  topic: string;
  activityType: string;
  schema: TSchema;
  systemPrompt: string;
  userPrompt: string;
  validate?: (data: z.output<TSchema>) => void;
  transform?: (data: z.output<TSchema>) => TResult | Promise<TResult>;
  maxAttempts?: number;
}

/**
 * Highly generic, strongly-typed server action to securely generate structured educational activities
 * using Google Gemini LLM and persist the generated object to Supabase.
 */
export async function generateBaseActivity<
  TSchema extends z.ZodTypeAny,
  TResult = z.output<TSchema>,
>({
  topic,
  activityType,
  schema,
  systemPrompt,
  userPrompt,
  validate,
  transform,
  maxAttempts = 1,
}: GenerateBaseActivityOptions<TSchema, TResult>) {
  try {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      return { error: `Please provide a topic for your ${activityType.replace("_", " ")}!` };
    }

    // 1. Authenticate user & retrieve session/user_id
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Unauthorized. Please sign in to continue." };
    }

    // 2. Double-check profile role is 'kid' to comply with RLS and user flows
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("role")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (profileError || !profile || profile.role !== "kid") {
      return { error: "Only kid accounts are authorized to generate new activities!" };
    }

    if (!hasAnyGeminiApiKey) {
      return {
        error: "AI generation is currently unavailable. Please contact support or try again later.",
      };
    }

    // 3. Generate structured activity object (with retry & validation)
    let finalObject: z.output<TSchema> | null = null;
    let attempts = 0;
    let lastValidationError = "";

    while (attempts < maxAttempts) {
      try {
        const { object } = await generateStructuredObject({
          schema,
          system: systemPrompt,
          prompt: userPrompt,
        });

        // Run custom validator if provided
        if (validate) {
          validate(object);
        }

        finalObject = object;
        break;
      } catch (err) {
        lastValidationError = err instanceof Error ? err.message : "Validation failed.";
        console.warn(
          `[generateBaseActivity] Attempt ${attempts + 1} validation failed for ${activityType}: ${lastValidationError}`
        );
        attempts++;
      }
    }

    if (!finalObject) {
      return {
        error: `Failed to generate a valid activity after ${maxAttempts} attempts. Last error: ${lastValidationError}`,
      };
    }

    // Apply custom post-processing transform if provided
    let processedContent: TResult | z.output<TSchema> = finalObject;
    if (transform) {
      processedContent = await transform(finalObject);
    }

    // 4. Save the generated activity structure to 'generated_activities' table in Supabase
    const { data: insertedRow, error: insertError } = await supabase
      .from("generated_activities")
      .insert({
        kid_user_id: user.id,
        activity_type: activityType,
        content: processedContent,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error(`Database error saving generated ${activityType} activity:`, insertError);
      return { error: `Failed to save activity: ${insertError.message}` };
    }

    return {
      success: true,
      activityId: insertedRow.id,
      data: processedContent as TResult,
    };
  } catch (err) {
    console.error(`Error in generateBaseActivity server action for ${activityType}:`, err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during activity generation.",
    };
  }
}
