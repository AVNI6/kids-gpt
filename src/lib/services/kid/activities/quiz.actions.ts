"use server";

import { z } from "zod";
import { generateBaseActivity } from "./base-generator";

// Define the schema for a single quiz multiple-choice option
const quizOptionSchema = z.object({
  label: z.string().describe("A fun, clear option text suitable for children."),
  correct: z
    .boolean()
    .describe(
      "Whether this option is the correct answer to the question. Exactly one option must be true per question."
    ),
});

// Define the schema for a single quiz question
const quizQuestionSchema = z.object({
  question: z.string().describe("An engaging multiple-choice question suitable for children."),
  options: z
    .array(quizOptionSchema)
    .length(4)
    .describe("Exactly 4 options, where only one is marked as correct."),
  feedback: z
    .string()
    .describe(
      "A clear, friendly, and easy-to-understand explanation of why the correct option is the right answer."
    ),
  tip: z
    .string()
    .describe("A fun, exciting, or mind-blowing extra trivia fact related to the question."),
});

// Define the full schema for generated quiz activity (without hardcoded length restriction)
const quizSchema = z.object({
  questions: z
    .array(quizQuestionSchema)
    .describe("An array containing fun educational quiz questions."),
});

/**
 * Server Action to dynamically generate a parameterized multiple-choice educational quiz
 * on a given topic for a kid user using the Vercel AI SDK and Gemini model, and save it in Supabase.
 */
export async function generateQuiz(
  topic: string,
  count: number = 3,
  difficulty: string = "Grade 5"
) {
  const clampedCount = Math.max(1, Math.min(20, count));

  return generateBaseActivity({
    topic,
    activityType: "quiz",
    schema: quizSchema,
    systemPrompt: `
You are an intelligent, friendly AI teacher for children.

Your job is to create fun, educational, and engaging multiple-choice quizzes based on the user's topic.

IMPORTANT INSTRUCTIONS:
- If the user makes spelling mistakes, typing mistakes, grammar mistakes, or uses incomplete words, intelligently understand and correct the intended topic automatically.
- Infer the most likely educational topic from the user's input.

QUIZ COUNT & DIFFICULTY RULES:
- Generate EXACTLY ${clampedCount} quiz questions.
- Target the cognitive difficulty level to: "${difficulty}".

Each quiz question must contain:
1. "question"
   - A fun, engaging, and kid-friendly multiple-choice question.

2. "options"
   - An array of EXACTLY 4 answer choices.
   - Each option must contain:
     - "label" → the answer text
     - "correct" → boolean
   - CRITICAL RULE:
     - EXACTLY ONE option must have "correct: true"
     - The other THREE options must have "correct: false"

3. "feedback"
   - A simple, encouraging explanation of why the correct answer is right.

4. "tip"
   - A fun, surprising, or mind-blowing trivia fact related to the question.

RULES:
- Use simple English suitable for children matching the targeted difficulty: "${difficulty}".
- Keep explanations short, exciting, and easy to understand.
- Avoid difficult technical jargon unless appropriate for "${difficulty}".
- Use energetic and encouraging language.
- Make learning feel like an adventure.
- Ensure all content is safe, positive, educational, and age-appropriate.
- If the topic is unclear, make the best reasonable assumption instead of failing.
- Ensure all questions are educational, factually correct, and engaging.
`,
    userPrompt: `
The child wants to learn about this topic:

"${topic}"

Instructions:
1. First understand and auto-correct the intended topic if needed.
2. Generate a fun and educational multiple-choice quiz with exactly ${clampedCount} questions at a "${difficulty}" difficulty level.
`,
  });
}
