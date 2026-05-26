"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasAnyGeminiApiKey, generateStructuredObject } from "@/lib/ai/structured-generator";

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

    if (!hasAnyGeminiApiKey) {
      return {
        error: "AI generation is currently unavailable. Please contact support or try again later.",
      };
    }

    // 3. Generate structured match pairs object using our robust fallback orchestrator
    const { object } = await generateStructuredObject({
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
