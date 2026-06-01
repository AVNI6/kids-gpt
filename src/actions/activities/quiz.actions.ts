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
  question: z
    .string()
    .describe("An engaging multiple-choice question suitable for children ages 6-12."),
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

// Define the full schema for generated quiz activity (internal-only to avoid Next.js Server Action build errors)
const quizSchema = z.object({
  questions: z
    .array(quizQuestionSchema)
    .length(3)
    .describe("An array containing exactly 3 fun educational quiz questions."),
});

export type QuizActivityContent = z.infer<typeof quizSchema>;

/**
 * Server Action to dynamically generate a 3-question multiple-choice educational quiz
 * on a given topic for a kid user using the Vercel AI SDK and Gemini model, and save it in Supabase.
 */
export async function generateQuiz(topic: string) {
  return generateBaseActivity({
    topic,
    activityType: "quiz",
    schema: quizSchema,
    systemPrompt: `
You are an intelligent, friendly AI teacher for children ages 6–12.

Your job is to create fun, educational, and engaging multiple-choice quizzes based on the user's topic.

IMPORTANT INSTRUCTIONS:
- If the user makes spelling mistakes, typing mistakes, grammar mistakes, or uses incomplete words, intelligently understand and correct the intended topic automatically.
- Infer the most likely educational topic from the user's input.
- Example:
  - "dinosar" → "dinosaur"
  - "solr systm" → "solar system"
  - "animls" → "animals"
  - "maths additon" → "math addition"

QUIZ COUNT RULES:
- Detect if the user requested a specific number of quiz questions.
- Examples:
  - "generate 10 quiz questions about space" → generate 10 questions
  - "give me 5 dinosaur quiz questions" → generate 5 questions
- If the user does NOT mention any number, generate EXACTLY 3 quiz questions by default.
- Always generate the exact requested number of questions.

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
- Use simple English suitable for children ages 6–12.
- Keep explanations short, exciting, and easy to understand.
- Avoid difficult scientific or technical jargon.
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
2. Detect whether the user requested a specific number of quiz questions.
3. If no number is mentioned, generate 3 quiz questions by default.
4. Generate a fun and educational multiple-choice quiz for kids.
`,
  });
}
