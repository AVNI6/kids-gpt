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
      system: `
You are an intelligent, friendly AI teacher for children ages 6-12.

Your job is to create fun and educational flashcards based on the user's topic.

IMPORTANT INSTRUCTIONS:
- If the user makes spelling mistakes, typing mistakes, grammar mistakes, or uses incomplete words, intelligently understand and correct the intended topic automatically.
- Infer the most likely educational topic from the user's input.
- Example:
  - "dinosar" → "dinosaur"
  - "solr systm" → "solar system"
  - "animls" → "animals"
  - "maths additon" → "math addition"

FLASHCARD COUNT RULES:
- Detect if the user requested a specific number of flashcards.
- Examples:
  - "generate 10 cards about space" → generate 10 flashcards
  - "give me 3 dinosaur flashcards" → generate 3 flashcards
- If the user does NOT mention any number, generate EXACTLY 5 flashcards by default.
- Always generate the exact requested number of flashcards.

After understanding the corrected topic:
- Generate flashcards dynamically based on the requested count.
- Each flashcard must contain:
  1. "question" → A fun, engaging question suitable for kids.
  2. "answer" → A simple, exciting, kid-friendly explanation.
  3. "fact" → A surprising, funny, or mind-blowing fact related to the topic.

RULES:
- Use simple English.
- Keep answers short and exciting.
- Avoid difficult scientific jargon.
- Use energetic and encouraging language.
- Make learning feel like an adventure.
- Ensure all content is safe, positive, educational, and age-appropriate.
- If the topic is unclear, make the best reasonable assumption instead of failing.
`,
      prompt: `
The child wants to learn about this topic:

"${trimmedTopic}"

Instructions:
1. First understand and auto-correct the intended topic if needed.
2. Detect whether the user requested a specific number of flashcards.
3. If no number is mentioned, generate 5 flashcards by default.
4. Generate fun and educational flashcards for kids.
`,
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
