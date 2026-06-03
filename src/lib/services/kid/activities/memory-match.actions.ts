"use server";

import { createClient } from "@/lib/supabase/server";
import { processActivityCompletion } from "@/lib/services/kid/rewards.actions";

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
      .eq("user_id", user.id);

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
 * Delegates progression calculations, streaks, XP, parent notifications, and cache revalidation
 * to the centralized `processActivityCompletion` action.
 */
export async function saveMemoryCampaignProgress(
  worldId: number,
  stepNumber: number,
  xpEarned: number,
  scoreStr: string,
  timezone: string = "Asia/Kolkata"
): Promise<{ success: boolean; error?: string; message?: string }> {
  return processActivityCompletion({
    activitySlug: "memory-match",
    activityTitle: "Memory Match",
    score: scoreStr,
    timezone,
    memoryMatchWorldId: worldId,
    memoryMatchStepNumber: stepNumber,
  });
}
