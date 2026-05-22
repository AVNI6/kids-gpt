"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasAnyGeminiApiKey, generateStructuredObject } from "@/lib/ai/structured-generator";

// Define the schema for a single science experiment multiple-choice option
const scienceLabOptionSchema = z.object({
  label: z
    .string()
    .describe(
      "A clear, simple, and kid-friendly option text (exactly 2 options will be generated)."
    ),
  correct: z
    .boolean()
    .describe(
      "Whether this option is the correct scientific outcome. Exactly one option must be true per experiment."
    ),
});

// Define the schema for a single experiment item
const scienceLabItemSchema = z.object({
  title: z
    .string()
    .describe(
      "A catchy, fun title for the science experiment (e.g. 'The Magic Floating Egg' or 'Baking Soda Volcano')."
    ),
  setup: z
    .string()
    .describe(
      "The experiment question, setup, or hypothesis/scenario to ask the child (e.g. 'What happens when you add salt to egg water?')."
    ),
  options: z
    .array(scienceLabOptionSchema)
    .length(2)
    .describe("Exactly 2 options, where only one option is marked as correct."),
  explanation: z
    .string()
    .describe(
      "The scientific reason, concept, or explanation behind why the correct answer is right in kid-friendly terms."
    ),
});

// Define the full schema for generated science lab activity
const scienceLabSchema = z.object({
  experiments: z
    .array(scienceLabItemSchema)
    .length(3)
    .describe("An array containing exactly 3 fun, safe, and exciting kid-friendly experiments."),
});

export type ScienceLabActivityContent = z.infer<typeof scienceLabSchema>;

/**
 * Server Action to dynamically generate 3 safe, fun, kid-friendly science experiments
 * on a given topic for a kid user using the Vercel AI SDK and Gemini model, and save it in Supabase.
 */
export async function generateScienceLab(topic: string) {
  try {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      return { error: "Please provide a topic for your science experiments!" };
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

    // 3. Generate structured science lab object using our robust fallback orchestrator
    const { object } = await generateStructuredObject({
      schema: scienceLabSchema,
      system: `You are an awesome, encouraging AI kid-teacher who makes science experiments incredibly fun, safe, and accessible.
Your goal is to generate exactly 3 highly engaging and safe kid-friendly experiments or scenarios about the topic: "${trimmedTopic}".
Each experiment must contain:
1. 'title': A catchy, fun title for the experiment.
2. 'setup': The setup question, hypothesis, or scenario suited for children ages 6-12.
3. 'options': Exactly 2 choices (each with 'label' and 'correct' boolean). CRITICAL: Ensure exactly ONE has 'correct: true', and the other has 'correct: false'.
4. 'explanation': A simple, encouraging, and clear explanation of the science behind the correct outcome.

Ensure the language is safe, encouraging, energetic, and uses colorful verbs. Avoid complex jargon.`,
      prompt: `Generate 3 safe and fun science experiments themed around: "${trimmedTopic}".`,
    });

    // 4. Save the generated activity structure to 'generated_activities' table in Supabase
    const { data: insertedRow, error: insertError } = await supabase
      .from("generated_activities")
      .insert({
        kid_user_id: user.id,
        activity_type: "science_lab",
        content: object,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Database error saving generated science lab activity:", insertError);
      return { error: `Failed to save science lab activity: ${insertError.message}` };
    }

    return {
      success: true,
      activityId: insertedRow.id,
      data: object,
    };
  } catch (err) {
    console.error("Error in generateScienceLab server action:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during science lab generation.",
    };
  }
}
