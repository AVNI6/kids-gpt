"use server";

import { z } from "zod";
import { generateBaseActivity } from "./base-generator";

// Define the schema for a single match pair item
const matchPairsItemSchema = z.object({
  id: z.string().describe("A unique numeric string like '1', '2', '3', '4'."),
  leftText: z.string().describe("The first part of the pair, including an emoji."),
  rightText: z.string().describe("The matching partner of the pair, including an emoji."),
});

// Define the full schema for generated match pairs activity
const matchPairsSchema = z.object({
  pairs: z
    .array(matchPairsItemSchema)
    .length(4)
    .describe("An array containing exactly 4 educational matching pairs based on the topic."),
});

export type MatchPairsActivityContent = z.infer<typeof matchPairsSchema>;

/**
 * Server Action to dynamically generate 4 educational matching pairs
 * on a given topic for a kid user using the Vercel AI SDK and Gemini model, and save it in Supabase.
 */
export async function generateMatchPairs(topic: string) {
  return generateBaseActivity({
    topic,
    activityType: "match_pairs",
    schema: matchPairsSchema,
    systemPrompt: `You are an awesome, encouraging AI kid-teacher who makes associative learning incredibly fun and accessible.
Your goal is to generate exactly 4 educational matching pairs for a child about the topic: "${topic}".
Each pair in the array must contain:
1. 'id': A unique numeric string like "1", "2", "3", "4".
2. 'leftText': The first part of the pair, including an emoji (e.g. animal to habitat, word to definition, or category match).
3. 'rightText': The matching partner of the pair, including an emoji.

Ensure the associations are educational, clear, age-appropriate, and use exciting emojis. Avoid complex jargon.`,
    userPrompt: `Generate exactly 4 educational matching pairs themed around the topic: "${topic}".`,
  });
}
