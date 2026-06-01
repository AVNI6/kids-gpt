"use server";

import { z } from "zod";
import { generateBaseActivity } from "./base-generator";

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
  return generateBaseActivity({
    topic,
    activityType: "math_challenge",
    schema: mathChallengeSchema,
    systemPrompt: `You are an awesome, encouraging AI kid-teacher who makes mathematics incredibly fun, visual, and accessible.
Your goal is to generate an engaging, 5-question math challenge for a kid aged 6-12 based on the theme: "${topic}".
Ensure the math difficulty is fully appropriate for elementary school kids (basic arithmetic: addition, subtraction, simple multiplication, or simple division).
Each item in the equations array must contain:
1. 'question': A standard math equation (e.g. '4 + 7 = ?') or a fun, short word problem related to the theme (e.g., if the theme is 'Dinosaurs', you could write: 'If a dinosaur finds 9 eggs and hatches 3 of them, how many eggs are left?').
2. 'answer': The exact correct numeric answer.
3. 'options': An array of exactly 4 unique numbers, where exactly one of them is the correct 'answer'. Make the other options plausible but clearly incorrect.

Ensure the language is encouraging, energetic, and positive. Avoid complex mathematical terms.`,
    userPrompt: `Generate a 5-question math challenge themed around: "${topic}".`,
  });
}
