"use server";

import { revalidatePath } from "next/cache";
import { getLocalDateString } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { createParentNotification } from "@/actions/dashboard.actions";

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
  scoreStr: string,
  timezone: string = "Asia/Kolkata"
): Promise<{ success: boolean; error?: string; message?: string }> {
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

    // Fetch Current Progress to enforce High Water Mark check (prevent progression regression & replay XP farming)
    const { data: existingRewards, error: queryError } = await supabase
      .from("rewards")
      .select("description")
      .eq("user_id", userId)
      .like("description", `%memory-match-w${worldId}-s%`);

    if (queryError) {
      console.error("[saveMemoryCampaignProgress] Query progress error:", queryError.message);
      return { success: false, error: queryError.message };
    }

    let maxDbStep = 0;
    if (existingRewards && existingRewards.length > 0) {
      for (const row of existingRewards) {
        if (!row.description) continue;
        const match = row.description.match(/memory-match-w(\d+)-s(\d+)/);
        if (match) {
          const wId = parseInt(match[1], 10);
          const sNum = parseInt(match[2], 10);
          if (wId === worldId && sNum > maxDbStep) {
            maxDbStep = sNum;
          }
        }
      }
    }

    if (maxDbStep >= stepNumber) {
      // Condition A: Replay. Do not call RPC, do not update XP/streak, return success early.
      return { success: true, message: "Replay completed. Progress preserved." };
    }

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
      .order("created_at", { ascending: false })
      .limit(1);

    if (lastRewardsError) {
      console.error("[saveMemoryCampaignProgress] Streak query error:", lastRewardsError.message);
      return { success: false, error: lastRewardsError.message };
    }

    let currentStreak = profile.current_streak ?? 0;
    let longestStreak = profile.longest_streak ?? 0;

    const todayStr = getLocalDateString(new Date(), timezone);

    if (lastRewards && lastRewards.length > 0) {
      const lastDateStr = getLocalDateString(new Date(lastRewards[0].created_at), timezone);

      if (lastDateStr === todayStr) {
        // Activity completed today, maintain streak
        if (currentStreak === 0) currentStreak = 1;
      } else {
        const lastDate = new Date(lastDateStr + "T12:00:00");
        const todayDate = new Date(todayStr + "T12:00:00");

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

    // Fetch the newly upserted reward to get its ID for metadata
    const { data: latestReward } = await supabase
      .from("rewards")
      .select("id")
      .eq("user_id", userId)
      .like("description", `%memory-match-w${worldId}-s%`)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    try {
      const { data: prof } = await supabase
        .from("profile")
        .select("first_name")
        .eq("user_id", userId)
        .maybeSingle();
      const kidName = prof?.first_name || "Your child";

      await createParentNotification(
        userId,
        "quiz_completed",
        "Activity Completed",
        `${kidName} completed Memory Match - World ${worldId}, Step ${stepNumber} (Score: ${scoreStr})`,
        latestReward ? { reward_id: latestReward.id } : {}
      );
    } catch (e) {
      console.warn("Failed to trigger parent notification for Memory Match:", e);
    }

    // Revalidate dashboard caches
    console.log("[saveMemoryCampaignProgress] Revalidating path caches...");
    revalidatePath("/dashboard/kid");
    revalidatePath("/dashboard/parent");

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[saveMemoryCampaignProgress] Unexpected error:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
