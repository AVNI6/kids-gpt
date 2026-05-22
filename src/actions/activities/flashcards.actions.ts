"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasAnyGeminiApiKey, generateStructuredObject } from "@/lib/ai/structured-generator";

// Define the schema for a single flashcard
const flashcardItemSchema = z.object({
  question: z.string().describe("A fun, engaging question about the topic suitable for children."),
  answer: z.string().describe("A clear, simple, and kid-friendly answer to the question."),
  fact: z
    .string()
    .describe("An interesting, mind-blowing fun fact related to the topic to spark curiosity."),
});

// Define the full schema for generated flashcards activity (internal-only to avoid Next.js Server Action build errors)
const flashcardSchema = z.object({
  flashcards: z
    .array(flashcardItemSchema)
    .describe("An array containing exactly 5 kid-friendly flashcards."),
});

export type FlashcardActivityContent = z.infer<typeof flashcardSchema>;

/**
 * Server Action to dynamically generate educational flashcards on a given topic
 * for a kid user using the Vercel AI SDK and Gemini model, and save it in Supabase.
 */
export async function generateFlashcards(topic: string) {
  try {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      return { error: "Please provide a topic for your flashcards!" };
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

    // 3. Generate structured flashcards object using our robust fallback orchestrator
    const { object } = await generateStructuredObject({
      schema: flashcardSchema,
      system: `You are an awesome, encouraging AI kid-teacher who makes learning incredibly fun and accessible.
Your goal is to generate exactly 5 educational flashcards for a child about the topic: "${trimmedTopic}".
Each flashcard must contain:
1. 'question': An engaging, clear question suited for children ages 6-12.
2. 'answer': A highly simplified, fun, and easy-to-understand explanation that satisfies their curiosity.
3. 'fact': A highly interesting, mind-blowing, or funny extra fact to keep them engaged.

Ensure all descriptions are encouraging, age-appropriate, and use colorful/active verbs. Avoid complex jargon.`,
      prompt: `Generate 5 awesome educational flashcards about the topic: "${trimmedTopic}".`,
    });

    // 4. Save the generated activity structure to 'generated_activities' table in Supabase
    const { data: insertedRow, error: insertError } = await supabase
      .from("generated_activities")
      .insert({
        kid_user_id: user.id,
        activity_type: "flashcards",
        content: object,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Database error saving generated activity:", insertError);
      return { error: `Failed to save activity: ${insertError.message}` };
    }

    return {
      success: true,
      activityId: insertedRow.id,
      data: object,
    };
  } catch (err) {
    console.error("Error in generateFlashcards server action:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred during generation.",
    };
  }
}
