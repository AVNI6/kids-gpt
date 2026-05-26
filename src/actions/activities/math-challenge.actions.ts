"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasAnyGeminiApiKey, generateStructuredObject } from "@/lib/ai/structured-generator";

// Define the schema for a single math equation / question
const mathChallengeItemSchema = z.object({
  question: z
    .string()
    .describe(
      "A fun, clear equation or a short, simple word problem suitable for children (e.g. '5 + 3 = ?' or 'If Lily has 8 balloons and pops 3, how many are left?')."
    ),
  answer: z.number().describe("The exact correct integer or decimal answer to the question."),
  options: z
    .array(z.number())
    .describe(
      "An array of exactly 4 unique numbers, where exactly one number matches the correct answer."
    ),
});

// Define the full schema for generated math challenges activity
const mathChallengeSchema = z.object({
  equations: z
    .array(mathChallengeItemSchema)
    .describe(
      "An array containing exactly 5 elementary-level math equations or simple word problems based on the topic."
    ),
});

export type MathChallengeContent = z.infer<typeof mathChallengeSchema>;

/**
 * Server Action to dynamically generate a 5-question math challenge
 * on a given topic/theme for a kid user using the Vercel AI SDK and Gemini model, and save it in Supabase.
 */
export async function generateMathChallenge(topic: string) {
  try {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      return { error: "Please provide a topic/theme for your math challenge!" };
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

    // 3. Generate structured math challenge object using our robust fallback orchestrator
    const { object } = await generateStructuredObject({
      schema: mathChallengeSchema,
      system: `You are an awesome, encouraging AI kid-teacher who makes mathematics incredibly fun, visual, and accessible.
Your goal is to generate an engaging, 5-question math challenge for a kid aged 6-12 based on the theme: "${trimmedTopic}".
Ensure the math difficulty is fully appropriate for elementary school kids (basic arithmetic: addition, subtraction, simple multiplication, or simple division).
Each item in the equations array must contain:
1. 'question': A standard math equation (e.g. '4 + 7 = ?') or a fun, short word problem related to the theme (e.g., if the theme is 'Dinosaurs', you could write: 'If a dinosaur finds 9 eggs and hatches 3 of them, how many eggs are left?').
2. 'answer': The exact correct numeric answer.
3. 'options': An array of exactly 4 unique numbers, where exactly one of them is the correct 'answer'. Make the other options plausible but clearly incorrect.

Ensure the language is encouraging, energetic, and positive. Avoid complex mathematical terms.`,
      prompt: `Generate a 5-question math challenge themed around: "${trimmedTopic}".`,
    });

    // 4. Save the generated activity structure to 'generated_activities' table in Supabase
    const { data: insertedRow, error: insertError } = await supabase
      .from("generated_activities")
      .insert({
        kid_user_id: user.id,
        activity_type: "math_challenge",
        content: object,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Database error saving generated math challenge activity:", insertError);
      return { error: `Failed to save math challenge activity: ${insertError.message}` };
    }

    return {
      success: true,
      activityId: insertedRow.id,
      data: object,
    };
  } catch (err) {
    console.error("Error in generateMathChallenge server action:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during math challenge generation.",
    };
  }
}
