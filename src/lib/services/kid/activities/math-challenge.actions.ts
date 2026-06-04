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

// Define the full schema for generated math challenges activity (without hardcoded count)
const mathChallengeSchema = z.object({
  equations: z
    .array(mathChallengeItemSchema)
    .describe(
      "An array containing elementary-level math equations or simple word problems based on the topic."
    ),
});

export type MathChallengeContent = z.infer<typeof mathChallengeSchema>;

/**
 * Server Action to dynamically generate a parameterized math challenge
 * on a given topic/theme for a kid user using the Vercel SDK and Gemini model, and save it in Supabase.
 */
export async function generateMathChallenge(
  topic: string,
  count: number = 5,
  difficulty: string = "Grade 5"
) {
  const clampedCount = Math.max(1, Math.min(20, count));

  return generateBaseActivity({
    topic,
    activityType: "math_challenge",
    schema: mathChallengeSchema,
    systemPrompt: `You are an awesome, encouraging AI kid-teacher who makes mathematics incredibly fun, visual, and accessible.
Your goal is to generate an engaging math challenge for a kid user based on the theme: "${topic}".

MATH COUNT & DIFFICULTY RULES:
- Generate EXACTLY ${clampedCount} equations or simple word problems in the equations array.
- Scale mathematical difficulty and operators (e.g. basic addition/subtraction vs simple division/multiplication) appropriate for the level: "${difficulty}".

Each item in the equations array must contain:
1. 'question': A standard math equation (e.g. '4 + 7 = ?') or a fun, short word problem related to the theme (e.g., if the theme is 'Dinosaurs', you could write: 'If a dinosaur finds 9 eggs and hatches 3 of them, how many eggs are left?').
2. 'answer': The exact correct numeric answer.
3. 'options': An array of exactly 4 unique numbers, where exactly one of them is the correct 'answer'. Make the other options plausible but clearly incorrect.

Ensure the language is encouraging, energetic, and positive. Avoid complex mathematical jargon unless appropriate for "${difficulty}".`,
    userPrompt: `Generate a math challenge themed around: "${topic}" with exactly ${clampedCount} questions at the level: "${difficulty}".`,
  });
}
