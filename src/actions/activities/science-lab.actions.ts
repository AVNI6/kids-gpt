"use server";

import { z } from "zod";
import { generateBaseActivity } from "./base-generator";

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
  return generateBaseActivity({
    topic,
    activityType: "science_lab",
    schema: scienceLabSchema,
    systemPrompt: `You are an awesome, encouraging AI kid-teacher who makes science experiments incredibly fun, safe, and accessible.
Your goal is to generate exactly 3 highly engaging and safe kid-friendly experiments or scenarios about the topic: "${topic}".
Each experiment must contain:
1. 'title': A catchy, fun title for the experiment.
2. 'setup': The setup question, hypothesis, or scenario suited for children ages 6-12.
3. 'options': Exactly 2 choices (each with 'label' and 'correct' boolean). CRITICAL: Ensure exactly ONE has 'correct: true', and the other has 'correct: false'.
4. 'explanation': A simple, encouraging, and clear explanation of the science behind the correct outcome.

Ensure the language is safe, encouraging, energetic, and uses colorful verbs. Avoid complex jargon.`,
    userPrompt: `Generate 3 safe and fun science experiments themed around: "${topic}".`,
  });
}
