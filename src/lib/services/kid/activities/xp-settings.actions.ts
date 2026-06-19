"use server";

import { createClient } from "@/lib/supabase/server";

export interface ActivityDbSettings {
  xp_reward: number;
  minutes: number;
}

export interface FullActivitySettings {
  id?: string;
  slug: string;
  title: string;
  xp_reward: number;
  minutes: number;
}

let cachedFullSettings: FullActivitySettings[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch the entire list of activity settings with global in-memory caching.
 */
export async function getFullActivitySettings(): Promise<FullActivitySettings[]> {
  const now = Date.now();
  if (cachedFullSettings && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedFullSettings;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("activity_settings")
      .select("id, slug, title, xp_reward, minutes");

    if (error || !data) {
      if (cachedFullSettings) return cachedFullSettings;
      return [];
    }

    cachedFullSettings = data as FullActivitySettings[];
    lastFetchTime = now;
    return cachedFullSettings;
  } catch {
    if (cachedFullSettings) return cachedFullSettings;
    return [];
  }
}

/**
 * Fetch the dynamic XP reward configured in the database for a specific activity slug.
 * Returns a fallback default value of 100 if the query fails or settings do not exist.
 */
export async function getActivityXp(slug: string): Promise<number> {
  const settingsList = await getFullActivitySettings();
  const found = settingsList.find((item) => item.slug === slug);
  return found ? found.xp_reward : 100;
}

/**
 * Fetch dynamic XP and minutes (durations) for educational activity structures from Supabase.
 */
export async function getActivitySettings(): Promise<Record<string, ActivityDbSettings>> {
  const settingsList = await getFullActivitySettings();
  const result: Record<string, ActivityDbSettings> = {};
  for (const item of settingsList) {
    result[item.slug] = {
      xp_reward: item.xp_reward,
      minutes: item.minutes,
    };
  }
  return result;
}
