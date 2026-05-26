"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasAnyGeminiApiKey, generateStructuredObject } from "@/lib/ai/structured-generator";

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
  try {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      return { error: "Please provide a topic for your quiz!" };
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

    // 3. Generate structured quiz object using our robust fallback orchestrator
    const { object } = await generateStructuredObject({
      schema: quizSchema,
      system: `
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
      prompt: `
The child wants to learn about this topic:

"${trimmedTopic}"

Instructions:
1. First understand and auto-correct the intended topic if needed.
2. Detect whether the user requested a specific number of quiz questions.
3. If no number is mentioned, generate 3 quiz questions by default.
4. Generate a fun and educational multiple-choice quiz for kids.
`,
    });

    // 4. Save the generated activity structure to 'generated_activities' table in Supabase
    const { data: insertedRow, error: insertError } = await supabase
      .from("generated_activities")
      .insert({
        kid_user_id: user.id,
        activity_type: "quiz",
        content: object,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Database error saving generated quiz activity:", insertError);
      return { error: `Failed to save quiz activity: ${insertError.message}` };
    }

    return {
      success: true,
      activityId: insertedRow.id,
      data: object,
    };
  } catch (err) {
    console.error("Error in generateQuiz server action:", err);
    return {
      error:
        err instanceof Error ? err.message : "An unexpected error occurred during quiz generation.",
    };
  }
}
