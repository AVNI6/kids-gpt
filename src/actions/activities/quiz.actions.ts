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
      system: `You are an awesome, encouraging AI kid-teacher who makes learning incredibly fun and accessible.
Your goal is to generate a highly engaging, 3-question multiple-choice educational quiz for a child about the topic: "${trimmedTopic}".
Each question in the quiz must contain:
1. 'question': An engaging, clear multiple-choice question suited for children ages 6-12.
2. 'options': Array of exactly 4 choices (each with 'label' and 'correct' boolean). CRITICAL: Ensure exactly ONE of the four choices has 'correct: true', and the other three have 'correct: false'.
3. 'feedback': A clear, friendly, and easy-to-understand explanation of why the correct option is the right answer.
4. 'tip': A fun, exciting, or mind-blowing extra trivia fact related to the question.

Ensure the language is encouraging, age-appropriate, energetic, and uses colorful verbs. Avoid complex jargon.`,
      prompt: `Generate a fun 3-question multiple-choice quiz about the topic: "${trimmedTopic}".`,
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
