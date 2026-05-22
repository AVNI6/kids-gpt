"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasAnyGeminiApiKey, generateStructuredObject } from "@/lib/ai/structured-generator";

// Define the schema for a single scrambled word item
const wordScrambleItemSchema = z.object({
  answer: z
    .string()
    .min(3)
    .max(7)
    .describe("The actual word entirely in uppercase, between 3 to 7 letters long."),
  scrambled: z
    .string()
    .describe(
      "A genuinely mixed-up, scrambled version of the answer with a space between each uppercase letter (e.g., if answer is 'CAT', scrambled could be 'A T C')."
    ),
  hint: z
    .string()
    .describe("A fun, exciting, and kid-friendly clue to help the child guess the word."),
});

// Define the full schema for generated word scramble activity (internal-only to avoid Next.js Server Action build errors)
const wordScrambleSchema = z.object({
  words: z
    .array(wordScrambleItemSchema)
    .length(5)
    .describe("An array containing exactly 5 fun educational scrambled words."),
});

export type WordScrambleActivityContent = z.infer<typeof wordScrambleSchema>;

/**
 * Server Action to dynamically generate a 5-word scramble spelling game
 * on a given topic for a kid user using the Vercel AI SDK and Gemini model, and save it in Supabase.
 */
export async function generateWordScramble(topic: string) {
  try {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      return { error: "Please provide a topic for your word scramble!" };
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

    // 3. Generate structured word scramble object using our robust fallback orchestrator
    const { object } = await generateStructuredObject({
      schema: wordScrambleSchema,
      system: `You are an awesome, encouraging AI kid-teacher who makes spelling incredibly fun and accessible.
Your goal is to generate a highly engaging, 5-word spelling scramble game for a child about the topic: "${trimmedTopic}".
Each scrambled word in the game must contain:
1. 'answer': The target word entirely in uppercase, between 3 to 7 letters long. Must be directly related to the topic.
2. 'scrambled': A genuinely mixed-up, scrambled version of the answer with a space between each uppercase letter (e.g., if answer is 'CAT', scrambled could be 'A T C'). Do NOT leave the letters in their original order.
3. 'hint': A fun, exciting, and kid-friendly clue to help the child guess the word.

Ensure the language is encouraging, age-appropriate, energetic, and uses colorful verbs. Avoid complex jargon.`,
      prompt: `Generate a 5-word spelling scramble game about the topic: "${trimmedTopic}".`,
    });

    // 4. Save the generated activity structure to 'generated_activities' table in Supabase
    const { data: insertedRow, error: insertError } = await supabase
      .from("generated_activities")
      .insert({
        kid_user_id: user.id,
        activity_type: "word_scramble",
        content: object,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Database error saving generated word scramble activity:", insertError);
      return { error: `Failed to save scramble activity: ${insertError.message}` };
    }

    return {
      success: true,
      activityId: insertedRow.id,
      data: object,
    };
  } catch (err) {
    console.error("Error in generateWordScramble server action:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during scramble generation.",
    };
  }
}
