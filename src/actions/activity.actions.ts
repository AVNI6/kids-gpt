"use server";

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
