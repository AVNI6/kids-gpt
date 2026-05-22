"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasAnyGeminiApiKey, generateStructuredObject } from "@/lib/ai/structured-generator";

// Define the schema for a single logic puzzle option
const logicPuzzleOptionSchema = z.object({
  label: z
    .string()
    .describe(
      "An option choice (e.g. emoji or number) representing the next item in the sequence."
    ),
  correct: z
    .boolean()
    .describe(
      "Whether this option correctly solves the sequence. Exactly one option must be true per puzzle."
    ),
});

// Define the schema for a single logic puzzle item
const logicPuzzleItemSchema = z.object({
  sequence: z
    .array(z.string())
    .length(6)
    .describe(
      "An array containing exactly 6 strings. The first 5 represent the pattern (emojis, shapes, or numbers) and the 6th MUST be exactly '?'. (e.g. ['🔴', '🔵', '🔴', '🔵', '🔴', '?'])."
    ),
  options: z
    .array(logicPuzzleOptionSchema)
    .length(3)
    .describe("Exactly 3 options, where only one option is marked as correct."),
  hint: z
    .string()
    .describe(
      "A fun, clear clue about the pattern to help the child think (e.g. 'Alternates between red and blue!')."
    ),
});

// Define the full schema for generated logic puzzles activity
const logicPuzzleSchema = z.object({
  puzzles: z
    .array(logicPuzzleItemSchema)
    .length(3)
    .describe(
      "An array containing exactly 3 pattern-matching logic puzzles suitable for children."
    ),
});

export type LogicPuzzleActivityContent = z.infer<typeof logicPuzzleSchema>;

/**
 * Server Action to dynamically generate 3 logic pattern puzzles
 * on a given topic for a kid user using the Vercel AI SDK and Gemini model, and save it in Supabase.
 */
export async function generateLogicPuzzle(topic: string) {
  try {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      return { error: "Please provide a topic for your logic puzzles!" };
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

    // 3. Generate structured logic puzzles object using our robust fallback orchestrator
    const { object } = await generateStructuredObject({
      schema: logicPuzzleSchema,
      system: `You are an awesome, encouraging AI kid-teacher who makes logic, patterns, and sequences incredibly fun and accessible.
Your goal is to generate exactly 3 pattern-matching logic puzzles (using emojis, shapes, or numbers) based on the topic: "${trimmedTopic}".
Each puzzle must contain:
1. 'sequence': An array of exactly 6 strings. The first 5 strings must build a clear, kid-friendly logical sequence (using shapes, numbers, or colorful emojis). The 6th string MUST be exactly "?".
2. 'options': Array of exactly 3 choices (each with 'label' and 'correct' boolean). CRITICAL: Ensure exactly ONE of the choices is the correct answer that logically completes the sequence, and the other two are incorrect.
3. 'hint': A fun, exciting, and kid-friendly clue to help the child notice the pattern.

Ensure the language is encouraging, energetic, and uses active, fun words. Keep patterns simple and age-appropriate.`,
      prompt: `Generate 3 pattern-matching logic puzzles themed around: "${trimmedTopic}".`,
    });

    // 4. Save the generated activity structure to 'generated_activities' table in Supabase
    const { data: insertedRow, error: insertError } = await supabase
      .from("generated_activities")
      .insert({
        kid_user_id: user.id,
        activity_type: "logic_puzzle",
        content: object,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Database error saving generated logic puzzle activity:", insertError);
      return { error: `Failed to save logic puzzle activity: ${insertError.message}` };
    }

    return {
      success: true,
      activityId: insertedRow.id,
      data: object,
    };
  } catch (err) {
    console.error("Error in generateLogicPuzzle server action:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during logic puzzle generation.",
    };
  }
}
