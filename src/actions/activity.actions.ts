"use server";

import { revalidatePath } from "next/cache";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Get available Gemini API key
const geminiApiKey =
  process.env.GOOGLE_GEMINI_API_KEY ||
  process.env.GOOGLE_GEMINI_API_KEY2 ||
  process.env.GOOGLE_GEMINI_API_KEY3;

if (!geminiApiKey) {
  console.warn("WARNING: No Google Gemini API key configured in environment variables.");
}

// Initialize the Google Gemini provider
const googleProvider = createGoogleGenerativeAI({
  apiKey: geminiApiKey || "",
});

// =========================================================
// 1. FLASHCARDS SCHEMAS & ACTIONS
// =========================================================

// Define the schema for a single flashcard
const flashcardItemSchema = z.object({
  question: z.string().describe("A fun, engaging question about the topic suitable for children."),
  answer: z.string().describe("A clear, simple, and kid-friendly answer to the question."),
  fact: z
    .string()
    .describe("An interesting, mind-blowing fun fact related to the topic to spark curiosity."),
});

// Define the full schema for generated flashcards activity (internal-only to avoid Next.js Server Action build errors)
const flashcardSchema = z.object({
  flashcards: z
    .array(flashcardItemSchema)
    .describe("An array containing exactly 5 kid-friendly flashcards."),
});

export type FlashcardActivityContent = z.infer<typeof flashcardSchema>;

/**
 * Server Action to dynamically generate educational flashcards on a given topic
 * for a kid user using the Vercel AI SDK and Gemini model, and save it in Supabase.
 */
export async function generateFlashcards(topic: string) {
  try {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      return { error: "Please provide a topic for your flashcards!" };
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

    if (!geminiApiKey) {
      return {
        error: "AI generation is currently unavailable. Please contact support or try again later.",
      };
    }

    // 3. Generate structured flashcards object using Vercel AI SDK
    const { object } = await generateObject({
      model: googleProvider("gemini-2.5-flash"),
      schema: flashcardSchema,
      system: `You are an awesome, encouraging AI kid-teacher who makes learning incredibly fun and accessible.
Your goal is to generate exactly 5 educational flashcards for a child about the topic: "${trimmedTopic}".
Each flashcard must contain:
1. 'question': An engaging, clear question suited for children ages 6-12.
2. 'answer': A highly simplified, fun, and easy-to-understand explanation that satisfies their curiosity.
3. 'fact': A highly interesting, mind-blowing, or funny extra fact to keep them engaged.

Ensure all descriptions are encouraging, age-appropriate, and use colorful/active verbs. Avoid complex jargon.`,
      prompt: `Generate 5 awesome educational flashcards about the topic: "${trimmedTopic}".`,
    });

    // 4. Save the generated activity structure to 'generated_activities' table in Supabase
    const { data: insertedRow, error: insertError } = await supabase
      .from("generated_activities")
      .insert({
        kid_user_id: user.id,
        activity_type: "flashcards",
        content: object,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Database error saving generated activity:", insertError);
      return { error: `Failed to save activity: ${insertError.message}` };
    }

    return {
      success: true,
      activityId: insertedRow.id,
      data: object,
    };
  } catch (err) {
    console.error("Error in generateFlashcards server action:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred during generation.",
    };
  }
}

// =========================================================
// 2. QUIZ SCHEMAS & ACTIONS
// =========================================================

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

    if (!geminiApiKey) {
      return {
        error: "AI generation is currently unavailable. Please contact support or try again later.",
      };
    }

    // 3. Generate structured quiz object using Vercel AI SDK with Gemini model
    const { object } = await generateObject({
      model: googleProvider("gemini-2.5-flash"),
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

// =========================================================
// 3. WORD SCRAMBLE SCHEMAS & ACTIONS
// =========================================================

// Define the schema for a single scrambled word item
const wordScrambleItemSchema = z.object({
  answer: z
    .string()
    .min(3)
    .max(7)
    .describe("The actual word entirely in uppercase, between 3 to 7 letters long."),
  scrambled: z
    .string()
    .describe(
      "A genuinely mixed-up, scrambled version of the answer with a space between each uppercase letter (e.g., if answer is 'CAT', scrambled could be 'A T C')."
    ),
  hint: z
    .string()
    .describe("A fun, exciting, and kid-friendly clue to help the child guess the word."),
});

// Define the full schema for generated word scramble activity (internal-only to avoid Next.js Server Action build errors)
const wordScrambleSchema = z.object({
  words: z
    .array(wordScrambleItemSchema)
    .length(5)
    .describe("An array containing exactly 5 fun educational scrambled words."),
});

export type WordScrambleActivityContent = z.infer<typeof wordScrambleSchema>;

/**
 * Server Action to dynamically generate a 5-word scramble spelling game
 * on a given topic for a kid user using the Vercel AI SDK and Gemini model, and save it in Supabase.
 */
export async function generateWordScramble(topic: string) {
  try {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      return { error: "Please provide a topic for your word scramble!" };
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

    if (!geminiApiKey) {
      return {
        error: "AI generation is currently unavailable. Please contact support or try again later.",
      };
    }

    // 3. Generate structured word scramble object using Vercel AI SDK with Gemini model
    const { object } = await generateObject({
      model: googleProvider("gemini-2.5-flash"),
      schema: wordScrambleSchema,
      system: `You are an awesome, encouraging AI kid-teacher who makes spelling incredibly fun and accessible.
Your goal is to generate a highly engaging, 5-word spelling scramble game for a child about the topic: "${trimmedTopic}".
Each scrambled word in the game must contain:
1. 'answer': The target word entirely in uppercase, between 3 to 7 letters long. Must be directly related to the topic.
2. 'scrambled': A genuinely mixed-up, scrambled version of the answer with a space between each uppercase letter (e.g., if answer is 'CAT', scrambled could be 'A T C'). Do NOT leave the letters in their original order.
3. 'hint': A fun, exciting, and kid-friendly clue to help the child guess the word.

Ensure the language is encouraging, age-appropriate, energetic, and uses colorful verbs. Avoid complex jargon.`,
      prompt: `Generate a 5-word spelling scramble game about the topic: "${trimmedTopic}".`,
    });

    // 4. Save the generated activity structure to 'generated_activities' table in Supabase
    const { data: insertedRow, error: insertError } = await supabase
      .from("generated_activities")
      .insert({
        kid_user_id: user.id,
        activity_type: "word_scramble",
        content: object,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Database error saving generated word scramble activity:", insertError);
      return { error: `Failed to save scramble activity: ${insertError.message}` };
    }

    return {
      success: true,
      activityId: insertedRow.id,
      data: object,
    };
  } catch (err) {
    console.error("Error in generateWordScramble server action:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during scramble generation.",
    };
  }
}

// =========================================================
// 4. MATH CHALLENGE SCHEMAS & ACTIONS
// =========================================================

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
  try {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      return { error: "Please provide a topic/theme for your math challenge!" };
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

    if (!geminiApiKey) {
      return {
        error: "AI generation is currently unavailable. Please contact support or try again later.",
      };
    }

    // 3. Generate structured math challenge object using Vercel AI SDK with Gemini model
    const { object } = await generateObject({
      model: googleProvider("gemini-2.5-flash"),
      schema: mathChallengeSchema,
      system: `You are an awesome, encouraging AI kid-teacher who makes mathematics incredibly fun, visual, and accessible.
Your goal is to generate an engaging, 5-question math challenge for a kid aged 6-12 based on the theme: "${trimmedTopic}".
Ensure the math difficulty is fully appropriate for elementary school kids (basic arithmetic: addition, subtraction, simple multiplication, or simple division).
Each item in the equations array must contain:
1. 'question': A standard math equation (e.g. '4 + 7 = ?') or a fun, short word problem related to the theme (e.g., if the theme is 'Dinosaurs', you could write: 'If a dinosaur finds 9 eggs and hatches 3 of them, how many eggs are left?').
2. 'answer': The exact correct numeric answer.
3. 'options': An array of exactly 4 unique numbers, where exactly one of them is the correct 'answer'. Make the other options plausible but clearly incorrect.

Ensure the language is encouraging, energetic, and positive. Avoid complex mathematical terms.`,
      prompt: `Generate a 5-question math challenge themed around: "${trimmedTopic}".`,
    });

    // 4. Save the generated activity structure to 'generated_activities' table in Supabase
    const { data: insertedRow, error: insertError } = await supabase
      .from("generated_activities")
      .insert({
        kid_user_id: user.id,
        activity_type: "math_challenge",
        content: object,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Database error saving generated math challenge activity:", insertError);
      return { error: `Failed to save math challenge activity: ${insertError.message}` };
    }

    return {
      success: true,
      activityId: insertedRow.id,
      data: object,
    };
  } catch (err) {
    console.error("Error in generateMathChallenge server action:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during math challenge generation.",
    };
  }
}

// =========================================================
// 5. SCIENCE LAB SCHEMAS & ACTIONS
// =========================================================

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
  try {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      return { error: "Please provide a topic for your science experiments!" };
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

    if (!geminiApiKey) {
      return {
        error: "AI generation is currently unavailable. Please contact support or try again later.",
      };
    }

    // 3. Generate structured science lab object using Vercel AI SDK with Gemini model
    const { object } = await generateObject({
      model: googleProvider("gemini-2.5-flash"),
      schema: scienceLabSchema,
      system: `You are an awesome, encouraging AI kid-teacher who makes science experiments incredibly fun, safe, and accessible.
Your goal is to generate exactly 3 highly engaging and safe kid-friendly experiments or scenarios about the topic: "${trimmedTopic}".
Each experiment must contain:
1. 'title': A catchy, fun title for the experiment.
2. 'setup': The setup question, hypothesis, or scenario suited for children ages 6-12.
3. 'options': Exactly 2 choices (each with 'label' and 'correct' boolean). CRITICAL: Ensure exactly ONE has 'correct: true', and the other has 'correct: false'.
4. 'explanation': A simple, encouraging, and clear explanation of the science behind the correct outcome.

Ensure the language is safe, encouraging, energetic, and uses colorful verbs. Avoid complex jargon.`,
      prompt: `Generate 3 safe and fun science experiments themed around: "${trimmedTopic}".`,
    });

    // 4. Save the generated activity structure to 'generated_activities' table in Supabase
    const { data: insertedRow, error: insertError } = await supabase
      .from("generated_activities")
      .insert({
        kid_user_id: user.id,
        activity_type: "science_lab",
        content: object,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Database error saving generated science lab activity:", insertError);
      return { error: `Failed to save science lab activity: ${insertError.message}` };
    }

    return {
      success: true,
      activityId: insertedRow.id,
      data: object,
    };
  } catch (err) {
    console.error("Error in generateScienceLab server action:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during science lab generation.",
    };
  }
}

// =========================================================
// 6. LOGIC PUZZLES SCHEMAS & ACTIONS
// =========================================================

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

export type LogicPuzzleActivityContent = z.infer<typeof logicPuzzleSchema>;

/**
 * Server Action to dynamically generate 3 logic pattern puzzles
 * on a given topic for a kid user using the Vercel AI SDK and Gemini model, and save it in Supabase.
 */
export async function generateLogicPuzzle(topic: string) {
  try {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      return { error: "Please provide a topic for your logic puzzles!" };
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

    if (!geminiApiKey) {
      return {
        error: "AI generation is currently unavailable. Please contact support or try again later.",
      };
    }

    // 3. Generate structured logic puzzles object using Vercel AI SDK with Gemini model
    const { object } = await generateObject({
      model: googleProvider("gemini-2.5-flash"),
      schema: logicPuzzleSchema,
      system: `You are an awesome, encouraging AI kid-teacher who makes logic, patterns, and sequences incredibly fun and accessible.
Your goal is to generate exactly 3 pattern-matching logic puzzles (using emojis, shapes, or numbers) based on the topic: "${trimmedTopic}".
Each puzzle must contain:
1. 'sequence': An array of exactly 6 strings. The first 5 strings must build a clear, kid-friendly logical sequence (using shapes, numbers, or colorful emojis). The 6th string MUST be exactly "?".
2. 'options': Array of exactly 3 choices (each with 'label' and 'correct' boolean). CRITICAL: Ensure exactly ONE of the choices is the correct answer that logically completes the sequence, and the other two are incorrect.
3. 'hint': A fun, exciting, and kid-friendly clue to help the child notice the pattern.

Ensure the language is encouraging, energetic, and uses active, fun words. Keep patterns simple and age-appropriate.`,
      prompt: `Generate 3 pattern-matching logic puzzles themed around: "${trimmedTopic}".`,
    });

    // 4. Save the generated activity structure to 'generated_activities' table in Supabase
    const { data: insertedRow, error: insertError } = await supabase
      .from("generated_activities")
      .insert({
        kid_user_id: user.id,
        activity_type: "logic_puzzle",
        content: object,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Database error saving generated logic puzzle activity:", insertError);
      return { error: `Failed to save logic puzzle activity: ${insertError.message}` };
    }

    return {
      success: true,
      activityId: insertedRow.id,
      data: object,
    };
  } catch (err) {
    console.error("Error in generateLogicPuzzle server action:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during logic puzzle generation.",
    };
  }
}

// =========================================================
// 8. DYNAMIC XP SETTINGS ACTIONS
// =========================================================

/**
 * Fetch the dynamic XP reward configured in the database for a specific activity slug.
 * Returns a fallback default value if the query fails or settings do not exist.
 */
export async function getActivityXp(slug: string): Promise<number> {
  const fallbacks: Record<string, number> = {
    flashcards: 100,
    quizzes: 120,
    "logic-puzzles": 150,
    "word-scrambles": 140,
    "math-challenges": 130,
    "science-lab": 160,
    "memory-match": 80,
    "color-mixer": 110,
    "match-following": 90,
  };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("activity_settings")
      .select("xp_reward")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      return fallbacks[slug] || 150;
    }
    return data.xp_reward;
  } catch {
    return fallbacks[slug] || 150;
  }
}

/**
 * Fetch all dynamic XP settings for educational activity slug structures.
 */
export async function getActivityXpSettings(): Promise<Record<string, number>> {
  const fallbacks: Record<string, number> = {
    flashcards: 100,
    quizzes: 120,
    "logic-puzzles": 150,
    "word-scrambles": 140,
    "math-challenges": 130,
    "science-lab": 160,
    "memory-match": 80,
    "color-mixer": 110,
    "match-following": 90,
  };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("activity_settings").select("slug, xp_reward");

    if (error || !data) {
      return fallbacks;
    }
    const result: Record<string, number> = {};
    for (const item of data) {
      result[item.slug] = item.xp_reward;
    }
    return { ...fallbacks, ...result };
  } catch {
    return fallbacks;
  }
}

// =========================================================
// 9. COLOR MIXER SCHEMAS & ACTIONS
// =========================================================

// Define the schema for a single color mixing level
const colorMixerItemSchema = z.object({
  targetColorName: z
    .string()
    .describe(
      "A fun, creative target color name related to the topic, including a relevant emoji (e.g. 'Sunset Orange 🌅', 'Goblin Slime Green 🟢')."
    ),
  targetHex: z
    .string()
    .describe(
      "A valid tailwind background class representing the target color, e.g. bg-orange-500, bg-green-500, bg-purple-600, bg-amber-500, bg-rose-500."
    ),
  requiredColors: z
    .array(z.string())
    .describe(
      "The primary colors needed to mix this target color. MUST only contain combinations of 'Red', 'Yellow', and/or 'Blue'."
    ),
  hint: z.string().describe("A fun, kid-friendly hint relating the topic to the colors needed."),
});

// Define the full schema for generated color mixer activity
const colorMixerSchema = z.object({
  levels: z
    .array(colorMixerItemSchema)
    .length(3)
    .describe("An array containing exactly 3 color-mixing levels."),
});

export type ColorMixerActivityContent = z.infer<typeof colorMixerSchema>;

/**
 * Server Action to dynamically generate 3 color-mixing levels
 * on a given topic for a kid user using the Vercel AI SDK and Gemini model, and save it in Supabase.
 */
export async function generateColorMixer(topic: string) {
  try {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      return { error: "Please provide a topic for your color mixing!" };
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

    if (!geminiApiKey) {
      return {
        error: "AI generation is currently unavailable. Please contact support or try again later.",
      };
    }

    // 3. Generate structured color mixer object using Vercel AI SDK
    const { object } = await generateObject({
      model: googleProvider("gemini-2.5-flash"),
      schema: colorMixerSchema,
      system: `You are an awesome, encouraging AI kid-teacher who makes science and color mixing incredibly fun and accessible.
Your goal is to generate exactly 3 color-mixing levels for a child about the topic: "${trimmedTopic}".
Since they only have Red, Yellow, and Blue pipettes, you must make sure that "requiredColors" only contains a mix of "Red", "Yellow", and/or "Blue".
Create fun, creative target names tailored to the topic (e.g. if topic is 'Magic', Yellow + Blue could be 'Goblin Slime Green 🟢').

Each level must contain:
1. 'targetColorName': A creative target color name related to the topic, including an emoji.
2. 'targetHex': A valid tailwind background class representing the color (like "bg-orange-500", "bg-green-500", "bg-purple-600").
3. 'requiredColors': Array of strings containing only "Red", "Yellow", and/or "Blue".
4. 'hint': A fun, kid-friendly hint relating the topic to the colors needed.

Ensure the language is encouraging, age-appropriate, energetic, and uses colorful verbs. Avoid complex jargon.`,
      prompt: `Generate 3 creative color-mixing levels themed around the topic: "${trimmedTopic}".`,
    });

    // 4. Save the generated activity structure to 'generated_activities' table in Supabase
    const { data: insertedRow, error: insertError } = await supabase
      .from("generated_activities")
      .insert({
        kid_user_id: user.id,
        activity_type: "color_mixer",
        content: object,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Database error saving generated color mixer activity:", insertError);
      return { error: `Failed to save color mixer activity: ${insertError.message}` };
    }

    return {
      success: true,
      activityId: insertedRow.id,
      data: object,
    };
  } catch (err) {
    console.error("Error in generateColorMixer server action:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during color mixer generation.",
    };
  }
}

// =========================================================
// 10. MATCH FOLLOWING SCHEMAS & ACTIONS
// =========================================================

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
  try {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      return { error: "Please provide a topic for your match pairs!" };
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

    if (!geminiApiKey) {
      return {
        error: "AI generation is currently unavailable. Please contact support or try again later.",
      };
    }

    // 3. Generate structured match pairs object using Vercel AI SDK
    const { object } = await generateObject({
      model: googleProvider("gemini-2.5-flash"),
      schema: matchPairsSchema,
      system: `You are an awesome, encouraging AI kid-teacher who makes associative learning incredibly fun and accessible.
Your goal is to generate exactly 4 educational matching pairs for a child about the topic: "${trimmedTopic}".
Each pair in the array must contain:
1. 'id': A unique numeric string like "1", "2", "3", "4".
2. 'leftText': The first part of the pair, including an emoji (e.g. animal to habitat, word to definition, or category match).
3. 'rightText': The matching partner of the pair, including an emoji.

Ensure the associations are educational, clear, age-appropriate, and use exciting emojis. Avoid complex jargon.`,
      prompt: `Generate exactly 4 educational matching pairs themed around the topic: "${trimmedTopic}".`,
    });

    // 4. Save the generated activity structure to 'generated_activities' table in Supabase
    const { data: insertedRow, error: insertError } = await supabase
      .from("generated_activities")
      .insert({
        kid_user_id: user.id,
        activity_type: "match_pairs",
        content: object,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Database error saving generated match pairs activity:", insertError);
      return { error: `Failed to save match pairs activity: ${insertError.message}` };
    }

    return {
      success: true,
      activityId: insertedRow.id,
      data: object,
    };
  } catch (err) {
    console.error("Error in generateMatchPairs server action:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during match pairs generation.",
    };
  }
}

/**
 * Server Action to retrieve the highest unlocked World and Step for the Memory Match campaign
 * based on the completed activity rewards in the database.
 */
export async function getMemoryMatchProgress() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        error: "Unauthorized. Please sign in to continue.",
        unlockedWorld: 1,
        unlockedStep: 1,
        completedSlugs: [] as string[],
      };
    }

    // Query rewards logs
    const { data: rewards, error: rewardsError } = await supabase
      .from("rewards")
      .select("description")
      .eq("user_id", user.id)
      .eq("source_type", "activity");

    if (rewardsError) {
      console.error("Error fetching rewards for memory match progress:", rewardsError);
      return {
        error: rewardsError.message,
        unlockedWorld: 1,
        unlockedStep: 1,
        completedSlugs: [] as string[],
      };
    }

    const completedSlugs: string[] = [];
    let maxCompletedFlatIndex = 0;

    if (rewards) {
      for (const row of rewards) {
        if (!row.description) continue;
        // Search for the unique slug format in description
        const match = row.description.match(/memory-match-w(\d+)-s(\d+)/);
        if (match) {
          const world = parseInt(match[1], 10);
          const step = parseInt(match[2], 10);

          // Backfill ALL steps 1..step for this world as completed.
          // Because we store only 1 row per world (the latest step),
          // we must reconstruct the full set of completed slugs for
          // every prior step so unlock logic and checkmarks work correctly.
          for (let s = 1; s <= step; s++) {
            const slug = `memory-match-w${world}-s${s}`;
            if (!completedSlugs.includes(slug)) {
              completedSlugs.push(slug);
            }
          }

          const flatIndex = (world - 1) * 10 + step;
          if (flatIndex > maxCompletedFlatIndex) {
            maxCompletedFlatIndex = flatIndex;
          }
        }
      }
    }

    // Determine the highest unlocked stage (which is max completed index + 1)
    const unlockedFlatIndex = Math.min(200, maxCompletedFlatIndex + 1);
    const unlockedWorld = Math.floor((unlockedFlatIndex - 1) / 10) + 1;
    const unlockedStep = ((unlockedFlatIndex - 1) % 10) + 1;

    return {
      success: true,
      unlockedWorld,
      unlockedStep,
      completedSlugs,
    };
  } catch (err) {
    console.error("Error in getMemoryMatchProgress server action:", err);
    return {
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
      unlockedWorld: 1,
      unlockedStep: 1,
      completedSlugs: [] as string[],
    };
  }
}

/**
 * Server Action to save progress for the Memory Match campaign.
 * Restricts persistence to exactly 1 row per World in the rewards table.
 *
 * Uses the SECURITY DEFINER RPC `upsert_memory_reward` to bypass the
 * rewards table RLS UPDATE restriction (which only allows INSERT/SELECT
 * for authenticated users, not UPDATE).
 */
export async function saveMemoryCampaignProgress(
  worldId: number,
  stepNumber: number,
  xpEarned: number,
  scoreStr: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized. Please sign in to continue." };
    }

    // Double-check profile role is 'kid'
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("role, total_experience_points, current_streak, longest_streak")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (profileError || !profile || profile.role !== "kid") {
      return { success: false, error: "Only kid accounts are authorized to save progress!" };
    }

    const userId = user.id;

    // Securely query dynamic XP settings from DB, falling back to the client-provided parameter
    let actualXp = xpEarned;
    const { data: activitySetting } = await supabase
      .from("activity_settings")
      .select("xp_reward")
      .eq("slug", "memory-match")
      .maybeSingle();

    if (activitySetting?.xp_reward) {
      actualXp = activitySetting.xp_reward;
    }

    // 1. Query the latest activity reward for this kid to calculate streak
    const { data: lastRewards, error: lastRewardsError } = await supabase
      .from("rewards")
      .select("created_at")
      .eq("user_id", userId)
      .eq("source_type", "activity")
      .order("created_at", { ascending: false })
      .limit(1);

    if (lastRewardsError) {
      console.error("[saveMemoryCampaignProgress] Streak query error:", lastRewardsError.message);
      return { success: false, error: lastRewardsError.message };
    }

    let currentStreak = profile.current_streak ?? 0;
    let longestStreak = profile.longest_streak ?? 0;

    const getLocalDateString = (dateObj: Date) => {
      const offset = dateObj.getTimezoneOffset();
      const local = new Date(dateObj.getTime() - offset * 60 * 1000);
      return local.toISOString().split("T")[0];
    };

    const todayStr = getLocalDateString(new Date());

    if (lastRewards && lastRewards.length > 0) {
      const lastDateStr = getLocalDateString(new Date(lastRewards[0].created_at));

      if (lastDateStr === todayStr) {
        // Activity completed today, maintain streak
        if (currentStreak === 0) currentStreak = 1;
      } else {
        const lastDate = new Date(lastRewards[0].created_at);
        lastDate.setHours(12, 0, 0, 0); // avoid DST shift issues
        const todayDate = new Date();
        todayDate.setHours(12, 0, 0, 0);

        const diffTime = todayDate.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
      }
    } else {
      // First activity ever
      currentStreak = 1;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // 2. Upsert reward via SECURITY DEFINER RPC — bypasses RLS UPDATE restriction.
    //    INSERT on first stage for this world, UPDATE (accumulate XP) on subsequent stages.
    console.log(
      `[saveMemoryCampaignProgress] Calling RPC — World: ${worldId}, Step: ${stepNumber}, XP: ${actualXp}, Score: ${scoreStr}`
    );

    const { error: rpcError } = await supabase.rpc("upsert_memory_reward", {
      p_user_id: userId,
      p_world_id: worldId,
      p_step_number: stepNumber,
      p_xp_earned: actualXp,
      p_score_str: scoreStr,
    });

    if (rpcError) {
      console.error("[saveMemoryCampaignProgress] RPC ERROR:", rpcError);
      return { success: false, error: rpcError.message };
    }

    console.log(
      `[saveMemoryCampaignProgress] RPC SUCCESS — World ${worldId} Step ${stepNumber} upserted. +${actualXp} XP.`
    );

    // 3. Update profile with new XP and updated streak values
    const newXp = (profile.total_experience_points ?? 0) + actualXp;
    const { error: profileUpdateError } = await supabase
      .from("profile")
      .update({
        total_experience_points: newXp,
        current_streak: currentStreak,
        longest_streak: longestStreak,
      })
      .eq("user_id", userId);

    if (profileUpdateError) {
      console.error(
        "[saveMemoryCampaignProgress] Profile update error:",
        profileUpdateError.message
      );
      return { success: false, error: profileUpdateError.message };
    }

    console.log(
      `[saveMemoryCampaignProgress] Profile updated — Total XP: ${newXp}, Streak: ${currentStreak}, Longest: ${longestStreak}`
    );

    // Revalidate dashboard caches
    revalidatePath("/dashboard/kid");
    revalidatePath("/dashboard/parent");

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[saveMemoryCampaignProgress] Unexpected error:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
