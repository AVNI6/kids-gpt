"use server";

import { z } from "zod";
import { generateBaseActivity } from "./base-generator";

// Define the schema for a single flashcard
const flashcardItemSchema = z.object({
  question: z.string().describe("A fun, engaging question about the topic suitable for children."),
  answer: z.string().describe("A clear, simple, and kid-friendly answer to the question."),
  fact: z
    .string()
    .describe("An interesting, mind-blowing fun fact related to the topic to spark curiosity."),
});

// Define the full schema for generated flashcards activity (without static constraints)
const flashcardSchema = z.object({
  flashcards: z.array(flashcardItemSchema).describe("An array containing kid-friendly flashcards."),
});

export type FlashcardActivityContent = z.infer<typeof flashcardSchema>;

/**
 * Server Action to dynamically generate educational flashcards on a given topic
 * for a kid user using the Vercel AI SDK and Gemini model, and save it in Supabase.
 */
export async function generateFlashcards(
  topic: string,
  count: number = 5,
  difficulty: string = "Grade 5"
) {
  const clampedCount = Math.max(1, Math.min(20, count));

  return generateBaseActivity({
    topic,
    activityType: "flashcards",
    schema: flashcardSchema,
    systemPrompt: `
You are an intelligent, friendly AI teacher for children.

Your job is to create fun and educational flashcards based on the user's topic.

IMPORTANT INSTRUCTIONS:
- If the user makes spelling mistakes, typing mistakes, grammar mistakes, or uses incomplete words, intelligently understand and correct the intended topic automatically.
- Infer the most likely educational topic from the user's input.

FLASHCARD COUNT & DIFFICULTY RULES:
- Generate EXACTLY ${clampedCount} flashcards.
- Target the cognitive difficulty level to: "${difficulty}".

Each flashcard must contain:
1. "question" → A fun, engaging question suitable for kids matching the difficulty: "${difficulty}".
2. "answer" → A simple, exciting, kid-friendly explanation.
3. "fact" → A surprising, funny, or mind-blowing fact related to the topic.

RULES:
- Use simple English suitable for children.
- Keep answers short and exciting.
- Avoid difficult scientific jargon unless appropriate for "${difficulty}".
- Use energetic and encouraging language.
- Make learning feel like an adventure.
- Ensure all content is safe, positive, educational, and age-appropriate.
- If the topic is unclear, make the best reasonable assumption instead of failing.
`,
    userPrompt: `
The child wants to learn about this topic:

"${topic}"

Instructions:
1. First understand and auto-correct the intended topic if needed.
2. Generate exactly ${clampedCount} fun and educational flashcards at a "${difficulty}" difficulty level.
`,
  });
}
