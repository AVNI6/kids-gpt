"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getLocalDateString } from "@/lib/utils";
import { JIGSAW_THEMES } from "@/constant/JigsawThemes";
import { createParentNotification } from "@/actions/dashboard.actions";

/**
 * Server Action to securely claim XP for completing a Jigsaw Puzzle.
 * Implements strict anti-cheat rules:
 * 1. Authenticate the user and verify the 'kid' role.
 * 2. Query 'activity_settings' for the 'jigsaw-puzzle' 'xp_reward' (fallback to 120).
 * 3. Query the 'rewards' table to ensure this specific puzzle instance hasn't already been claimed today (prevent duplicate XP).
 * 4. Update the 'profile' table (increment total_experience_points, update current_streak and longest_streak using timezone-aware logic).
 * 5. Insert a record into the 'rewards' table and call revalidatePath('/dashboard/kid').
 */
export async function claimJigsawXp(
  activityId?: string,
  gridSize?: number,
  timezone: string = "Asia/Kolkata"
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(
      `[claimJigsawXp] Starting claim process. activityId: "${activityId}", gridSize: ${gridSize}, timezone: "${timezone}"`
    );
    const supabase = await createClient();

    console.log("[claimJigsawXp] Authenticating user...");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[claimJigsawXp] Authentication error or missing user session:", authError);
      return { success: false, error: "Unauthorized. Please sign in to continue." };
    }

    const userId = user.id;
    console.log(`[claimJigsawXp] User authenticated successfully. userId: "${userId}"`);

    // 1. Double-check profile role is 'kid'
    console.log(`[claimJigsawXp] Fetching profile for user: ${userId}`);
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("role, total_experience_points, current_streak, longest_streak")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (profileError || !profile) {
      console.error(`[claimJigsawXp] Profile fetch error for user ${userId}:`, profileError);
      return { success: false, error: "Only kid accounts are authorized to save progress!" };
    }

    if (profile.role !== "kid") {
      console.warn(
        `[claimJigsawXp] Security warning: User ${userId} has role "${profile.role}" (not "kid")`
      );
      return { success: false, error: "Only kid accounts are authorized to save progress!" };
    }

    console.log(
      `[claimJigsawXp] Profile role validated as kid. Current XP: ${profile.total_experience_points}, Current Streak: ${profile.current_streak}`
    );

    // 2. Fetch dynamic XP settings for jigsaw-puzzle
    let actualXp = 120; // default jigsaw puzzle XP fallback
    console.log("[claimJigsawXp] Fetching activity setting for slug 'jigsaw-puzzle'");
    const { data: activitySetting, error: settingError } = await supabase
      .from("activity_settings")
      .select("id, slug, title, xp_reward")
      .eq("slug", "jigsaw-puzzle")
      .maybeSingle();

    if (settingError) {
      console.error("[claimJigsawXp] Error fetching activity settings:", settingError);
    } else if (activitySetting?.xp_reward) {
      actualXp = activitySetting.xp_reward;
      console.log(`[claimJigsawXp] Base dynamic XP reward fetched: ${actualXp}`);
    } else {
      console.log(
        `[claimJigsawXp] No custom setting found for 'jigsaw-puzzle'. Using default baseline: ${actualXp}`
      );
    }

    // Scale XP slightly based on difficulty/grid size
    if (gridSize) {
      if (gridSize === 2) {
        actualXp = Math.round(actualXp * 0.6); // Easy (2x2) = 72 XP
      } else if (gridSize === 4) {
        actualXp = Math.round(actualXp * 1.2); // Harder (4x4) = 144 XP
      } else if (gridSize === 5) {
        actualXp = Math.round(actualXp * 1.5); // Expert (5x5) = 180 XP
      }
      console.log(
        `[claimJigsawXp] Scaled XP based on grid size ${gridSize}x${gridSize}: ${actualXp} XP`
      );
    }

    const themeName =
      JIGSAW_THEMES.find((t) => t.id === activityId || t.url === activityId)?.name ||
      "Custom Photo";
    const difficultyName =
      {
        2: "Easy",
        3: "Medium",
        4: "Hard",
        5: "Expert",
      }[gridSize || 3] || "Medium";

    // Standardized payload description format
    const description = `Completed Jigsaw Puzzle - ${difficultyName} (Theme: ${themeName})`;
    const todayStr = getLocalDateString(new Date(), timezone);
    console.log(`[claimJigsawXp] Structured puzzle description: "${description}"`);

    // 3. ANTI-CHEAT: Check for exact previous completion today
    console.log(`[claimJigsawXp] Querying rewards table for duplicates of "${description}"`);
    const { data: todayRewards, error: checkError } = await supabase
      .from("rewards")
      .select("created_at")
      .eq("user_id", userId)
      .eq("description", description)
      .order("created_at", { ascending: false });

    if (checkError) {
      console.error("[claimJigsawXp] Anti-cheat check query failed:", checkError);
      return { success: false, error: "Failed to verify completion reward log." };
    }

    if (todayRewards && todayRewards.length > 0) {
      const lastDateStr = getLocalDateString(new Date(todayRewards[0].created_at), timezone);
      console.log(
        `[claimJigsawXp] Found matching completions. Last date: "${lastDateStr}", Today: "${todayStr}"`
      );
      if (lastDateStr === todayStr) {
        console.warn(
          `[claimJigsawXp] Anti-cheat triggered: Duplicate claim blocked for description: "${description}"`
        );
        return {
          success: false,
          error: "You've already earned XP for this puzzle today! Keep playing for fun!",
        };
      }
    }

    // 4. Calculate learning streak
    console.log("[claimJigsawXp] Fetching last activity reward to calculate streak...");
    const { data: lastRewards, error: lastRewardsError } = await supabase
      .from("rewards")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (lastRewardsError) {
      console.error("[claimJigsawXp] Error fetching last rewards row:", lastRewardsError);
      return { success: false, error: lastRewardsError.message };
    }

    let currentStreak = profile.current_streak ?? 0;
    let longestStreak = profile.longest_streak ?? 0;

    if (lastRewards && lastRewards.length > 0) {
      const lastDateStr = getLocalDateString(new Date(lastRewards[0].created_at), timezone);
      console.log(`[claimJigsawXp] Last activity claimed on: "${lastDateStr}"`);

      if (lastDateStr === todayStr) {
        if (currentStreak === 0) currentStreak = 1;
      } else {
        const lastDate = new Date(lastDateStr + "T12:00:00");
        const todayDate = new Date(todayStr + "T12:00:00");

        const diffTime = todayDate.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        console.log(`[claimJigsawXp] Diff days since last activity: ${diffDays}`);

        if (diffDays === 1) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
      }
    } else {
      console.log("[claimJigsawXp] First activity reward ever. Initializing streak to 1.");
      currentStreak = 1;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    console.log(
      `[claimJigsawXp] Calculated streak - Current: ${currentStreak}, Longest: ${longestStreak}`
    );

    // 5. Insert reward record matching the schema exactly
    console.log(
      `[claimJigsawXp] Inserting new row into public.rewards. Payload: user_id=${userId}, rewards_amount=${actualXp}, description="${description}"`
    );
    const { data: insertedRewards, error: insertError } = await supabase
      .from("rewards")
      .insert({
        user_id: userId,
        rewards_amount: actualXp,
        source_id: activitySetting?.id || null,
        source_type: activitySetting?.slug || "jigsaw-puzzle",
        description,
        score: 100,
      })
      .select("id");

    if (insertError) {
      console.error(
        "[claimJigsawXp] CRITICAL ERROR: public.rewards insert query failed:",
        insertError
      );
      return { success: false, error: `Database insertion failed: ${insertError.message}` };
    }
    console.log("[claimJigsawXp] Rewards insertion successful!");

    const insertedReward =
      insertedRewards && insertedRewards.length > 0 ? insertedRewards[0] : null;

    // 6. Update kid profile
    const newXp = (profile.total_experience_points ?? 0) + actualXp;
    console.log(`[claimJigsawXp] Updating public.profile XP and Streaks. New XP: ${newXp}`);
    const { error: updateError } = await supabase
      .from("profile")
      .update({
        total_experience_points: newXp,
        current_streak: currentStreak,
        longest_streak: longestStreak,
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error(
        "[claimJigsawXp] CRITICAL ERROR: public.profile update query failed:",
        updateError
      );
      return { success: false, error: `Profile update failed: ${updateError.message}` };
    }
    console.log("[claimJigsawXp] Profile update successful!");

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
        `${kidName} completed Jigsaw Puzzle - ${difficultyName} (Theme: ${themeName})`,
        insertedReward ? { reward_id: insertedReward.id } : {}
      );
    } catch (e) {
      console.warn("Failed to trigger parent notification for Jigsaw Puzzle:", e);
    }

    console.log("[claimJigsawXp] Revalidating path caches...");
    revalidatePath("/dashboard/kid");
    revalidatePath("/dashboard/parent");

    console.log("[claimJigsawXp] Process complete! Reward claimed successfully!");
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[claimJigsawXp] Unhandled exception in claimJigsawXp action:", err);
    return { success: false, error: errorMsg };
  }
}
