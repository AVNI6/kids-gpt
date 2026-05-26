"use server";

import { createClient } from "@/lib/supabase/server";

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

export interface ActivityDbSettings {
  xp_reward: number;
  minutes: number;
}

/**
 * Fetch dynamic XP and minutes (durations) for educational activity structures from Supabase.
 */
export async function getActivitySettings(): Promise<Record<string, ActivityDbSettings>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("activity_settings")
      .select("slug, xp_reward, minutes");

    if (error || !data) {
      return {};
    }
    const result: Record<string, ActivityDbSettings> = {};
    for (const item of data) {
      result[item.slug] = {
        xp_reward: item.xp_reward,
        minutes: item.minutes,
      };
    }
    return result;
  } catch {
    return {};
  }
}
