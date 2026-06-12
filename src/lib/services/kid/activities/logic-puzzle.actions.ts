"use server";

import { z } from "zod";
import { generateBaseActivity } from "./base-generator";

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

/**
 * Server Action to dynamically generate 3 logic pattern puzzles
 * on a given topic for a kid user using the Vercel AI SDK and Gemini model, and save it in Supabase.
 */
export async function generateLogicPuzzle(topic: string) {
  return generateBaseActivity({
    topic,
    activityType: "logic_puzzle",
    schema: logicPuzzleSchema,
    systemPrompt: `You are an awesome, encouraging AI kid-teacher who makes logic, patterns, and sequences incredibly fun and accessible.
Your goal is to generate exactly 3 pattern-matching logic puzzles (using emojis, shapes, or numbers) based on the topic: "${topic}".
Each puzzle must contain:
1. 'sequence': An array of exactly 6 strings. The first 5 strings must build a clear, kid-friendly logical sequence (using shapes, numbers, or colorful emojis). The 6th string MUST be exactly "?".
2. 'options': Array of exactly 3 choices (each with 'label' and 'correct' boolean). CRITICAL: Ensure exactly ONE of the choices is the correct answer that logically completes the sequence, and the other two are incorrect.
3. 'hint': A fun, exciting, and kid-friendly clue to help the child notice the pattern.

Ensure the language is encouraging, energetic, and uses active, fun words. Keep patterns simple and age-appropriate.`,
    userPrompt: `Generate 3 pattern-matching logic puzzles themed around: "${topic}".`,
  });
}
