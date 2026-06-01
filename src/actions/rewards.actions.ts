"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getLocalDateString } from "@/lib/utils";
import { createParentNotification } from "@/actions/dashboard.actions";

export interface CompletionOptions {
  activitySlug: string;
  activityTitle: string;
  score?: string;
  timezone?: string;
  // Jigsaw Puzzle specific
  jigsawGridSize?: number;
  jigsawThemeName?: string;
  // Memory Match campaign specific
  memoryMatchWorldId?: number;
  memoryMatchStepNumber?: number;
}

/**
 * A unified, highly-robust server action to process kid educational activity completion,
 * claim dynamic XP, compute timezone-aware learning streaks, create parent notifications,
 * and handle both Memory Match Campaign and Jigsaw Puzzle specifics alongside standard activities.
 */
export async function processActivityCompletion({
  activitySlug,
  activityTitle,
  score,
  timezone = "Asia/Kolkata",
  jigsawGridSize,
  jigsawThemeName,
  memoryMatchWorldId,
  memoryMatchStepNumber,
}: CompletionOptions): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const supabase = await createClient();

    function isSuccessfulRpcResult(data: unknown): data is { success: true } {
      return (
        typeof data === "object" &&
        data !== null &&
        "success" in data &&
        (data as { success?: unknown }).success === true
      );
    }
    // 1. Authenticate user & retrieve session/user_id
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized. Please sign in to continue." };
    }

    const userId = user.id;

    // 2. Fetch profile role & details for validation and streak
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("role, total_experience_points, current_streak, longest_streak")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (profileError || !profile || profile.role !== "kid") {
      return { success: false, error: "Only kid accounts are authorized to save progress!" };
    }

    const todayStr = getLocalDateString(new Date(), timezone);

    // =========================================================================
    // CASE A: Memory Match Campaign Progression
    // =========================================================================
    if (memoryMatchWorldId !== undefined && memoryMatchStepNumber !== undefined) {
      // Fetch Current Progress to enforce High Water Mark check (prevent progression regression)
      const { data: existingRewards, error: queryError } = await supabase
        .from("rewards")
        .select("description")
        .eq("user_id", userId)
        .like("description", `%memory-match-w${memoryMatchWorldId}-s%`);

      if (queryError) {
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
            if (wId === memoryMatchWorldId && sNum > maxDbStep) {
              maxDbStep = sNum;
            }
          }
        }
      }

      if (maxDbStep >= memoryMatchStepNumber) {
        return { success: true, message: "Replay completed. Progress preserved." };
      }

      // Securely query dynamic XP setting, default to 80 XP if missing
      let actualXp = 80;
      const { data: activitySetting } = await supabase
        .from("activity_settings")
        .select("xp_reward")
        .eq("slug", "memory-match")
        .maybeSingle();

      if (activitySetting?.xp_reward) {
        actualXp = activitySetting.xp_reward;
      }

      // Query latest rewards row to compute streak
      const { data: lastRewards, error: lastRewardsError } = await supabase
        .from("rewards")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (lastRewardsError) {
        return { success: false, error: lastRewardsError.message };
      }

      let currentStreak = profile.current_streak ?? 0;
      let longestStreak = profile.longest_streak ?? 0;

      if (lastRewards && lastRewards.length > 0) {
        const lastDateStr = getLocalDateString(new Date(lastRewards[0].created_at), timezone);

        if (lastDateStr === todayStr) {
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
        currentStreak = 1;
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      // Execute upsert via SECURITY DEFINER RPC
      const { error: rpcError } = await supabase.rpc("upsert_memory_reward", {
        p_user_id: userId,
        p_world_id: memoryMatchWorldId,
        p_step_number: memoryMatchStepNumber,
        p_xp_earned: actualXp,
        p_score_str: score || "N/A",
      });

      if (rpcError) {
        return { success: false, error: rpcError.message };
      }

      // Update kid profile
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
        return { success: false, error: profileUpdateError.message };
      }

      const { data: latestReward } = await supabase
        .from("rewards")
        .select("id")
        .eq("user_id", userId)
        .like("description", `%memory-match-w${memoryMatchWorldId}-s%`)
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
          `${kidName} completed Memory Match - World ${memoryMatchWorldId}, Step ${memoryMatchStepNumber} (Score: ${score || "N/A"})`,
          latestReward ? { reward_id: latestReward.id } : {}
        );
      } catch (e) {
        console.warn("Failed to trigger parent notification for Memory Match:", e);
      }

      revalidatePath("/dashboard/kid");
      revalidatePath("/dashboard/parent");
      return { success: true };
    }

    // =========================================================================
    // CASE B: Jigsaw Puzzle Completion
    // =========================================================================
    if (activitySlug === "jigsaw-puzzle") {
      let actualXp = 120; // Default fallback
      const { data: activitySetting } = await supabase
        .from("activity_settings")
        .select("id, slug, title, xp_reward")
        .eq("slug", "jigsaw-puzzle")
        .maybeSingle();

      if (activitySetting?.xp_reward) {
        actualXp = activitySetting.xp_reward;
      }

      // Scale XP based on grid difficulty multiplier
      if (jigsawGridSize) {
        const multipliers: Record<number, number> = {
          3: 1.0,
          4: 1.2,
          5: 1.5,
          6: 1.8,
          7: 2.1,
          8: 2.4,
          9: 2.7,
          10: 3.0,
          11: 3.3,
          12: 3.6,
        };
        const mult = multipliers[jigsawGridSize] || 1.0;
        actualXp = Math.round(actualXp * mult);
      }

      const diffName = `${jigsawGridSize || 3}x${jigsawGridSize || 3}`;
      const description = `Completed Jigsaw Puzzle - ${diffName} (Theme: ${jigsawThemeName || "Custom Photo"})`;

      // Anti-cheat check: Prevent duplicate XP for this puzzle config today
      const { data: todayRewards, error: checkError } = await supabase
        .from("rewards")
        .select("created_at")
        .eq("user_id", userId)
        .eq("description", description)
        .order("created_at", { ascending: false });

      if (checkError) {
        return { success: false, error: "Failed to verify completion reward log." };
      }

      if (todayRewards && todayRewards.length > 0) {
        const lastDateStr = getLocalDateString(new Date(todayRewards[0].created_at), timezone);
        if (lastDateStr === todayStr) {
          return {
            success: false,
            error: "You've already earned XP for this puzzle today! Keep playing for fun!",
          };
        }
      }

      // Query latest rewards row to compute streak
      const { data: lastRewards, error: lastRewardsError } = await supabase
        .from("rewards")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (lastRewardsError) {
        return { success: false, error: lastRewardsError.message };
      }

      let currentStreak = profile.current_streak ?? 0;
      let longestStreak = profile.longest_streak ?? 0;

      if (lastRewards && lastRewards.length > 0) {
        const lastDateStr = getLocalDateString(new Date(lastRewards[0].created_at), timezone);

        if (lastDateStr === todayStr) {
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
        currentStreak = 1;
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      // Insert reward record
      const { data: insertedRewards, error: insertError } = await supabase
        .from("rewards")
        .insert({
          user_id: userId,
          rewards_amount: actualXp,
          source_id: activitySetting?.id || null,
          source_type: "jigsaw-puzzle",
          description,
          score: 100,
        })
        .select("id");

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      const insertedReward =
        insertedRewards && insertedRewards.length > 0 ? insertedRewards[0] : null;

      // Update kid profile
      const newXp = (profile.total_experience_points ?? 0) + actualXp;
      const { error: updateError } = await supabase
        .from("profile")
        .update({
          total_experience_points: newXp,
          current_streak: currentStreak,
          longest_streak: longestStreak,
        })
        .eq("user_id", userId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

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
          `${kidName} completed Jigsaw Puzzle - ${diffName} (Theme: ${jigsawThemeName || "Custom Photo"})`,
          insertedReward ? { reward_id: insertedReward.id } : {}
        );
      } catch (e) {
        console.warn("Failed to trigger parent notification for Jigsaw Puzzle:", e);
      }

      revalidatePath("/dashboard/kid");
      revalidatePath("/dashboard/parent");
      return { success: true };
    }

    // =========================================================================
    // CASE C: Standard Activity Completion (Quizzes, Flashcards, Math, etc.)
    // =========================================================================
    // 1. Attempt to execute the atomic database RPC function first
    const { data: rpcData, error: rpcError } = await supabase.rpc("save_kid_activity_progress", {
      p_user_id: userId,
      p_activity_slug: activitySlug,
      p_activity_title: activityTitle,
      p_score_str: score || null,
      p_timezone: timezone,
    });

    if (!rpcError && rpcData && isSuccessfulRpcResult(rpcData)) {
      try {
        const { data: prof } = await supabase
          .from("profile")
          .select("first_name")
          .eq("user_id", userId)
          .maybeSingle();
        const kidName = prof?.first_name || "Your child";

        const { data: latestReward } = await supabase
          .from("rewards")
          .select("id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        await createParentNotification(
          userId,
          "quiz_completed",
          "Activity Completed",
          `${kidName} completed ${activityTitle}${score ? ` (Score: ${score})` : ""}`,
          latestReward ? { reward_id: latestReward.id } : {}
        );
      } catch (e) {
        console.warn("Failed to trigger parent notification in RPC path:", e);
      }

      revalidatePath("/dashboard/kid");
      revalidatePath("/dashboard/parent");
      return { success: true };
    }

    if (rpcError) {
      console.warn(
        "save_kid_activity_progress RPC failed, executing client-side fallback:",
        rpcError.message
      );
    }

    // 2. Client-side Fallback
    let actualXp = 100; // generic fallback default
    const { data: activitySetting } = await supabase
      .from("activity_settings")
      .select("id, slug, title, xp_reward")
      .eq("slug", activitySlug)
      .maybeSingle();

    if (activitySetting?.xp_reward) {
      actualXp = activitySetting.xp_reward;
    }

    // Parse score percentage
    let parsedScore: number | null = null;
    if (score) {
      const percentMatch = score.match(/([0-9]+)\s*%/);
      if (percentMatch) {
        parsedScore = parseInt(percentMatch[1], 10);
      } else {
        const ratioMatch = score.match(/([0-9]+)\s*\/\s*([0-9]+)/);
        if (ratioMatch) {
          const correct = parseInt(ratioMatch[1], 10);
          const total = parseInt(ratioMatch[2], 10);
          if (total > 0) {
            parsedScore = Math.round((correct / total) * 100);
          }
        } else {
          const match = score.match(/([0-9]+)/);
          if (match) {
            parsedScore = parseInt(match[1], 10);
          }
        }
      }
    }

    if (parsedScore !== null) {
      if (parsedScore !== 100) {
        actualXp = Math.round(actualXp * (parsedScore / 100));
      }
    }
    actualXp = Math.max(0, actualXp);

    const { data: lastRewards, error: lastRewardsError } = await supabase
      .from("rewards")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (lastRewardsError) {
      return { success: false, error: lastRewardsError.message };
    }

    let currentStreak = profile.current_streak ?? 0;
    let longestStreak = profile.longest_streak ?? 0;

    if (lastRewards && lastRewards.length > 0) {
      const lastDateStr = getLocalDateString(new Date(lastRewards[0].created_at), timezone);

      if (lastDateStr === todayStr) {
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
      currentStreak = 1;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // Insert reward record
    const { data: insertedRewards, error: insertError } = await supabase
      .from("rewards")
      .insert({
        user_id: userId,
        rewards_amount: actualXp,
        source_id: activitySetting?.id || null,
        source_type: activitySetting?.slug || activitySlug,
        description: `Completed ${activitySetting?.title || activityTitle}${score ? ` (Score: ${score})` : ""}`,
        score: parsedScore,
      })
      .select("id");

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    const insertedReward =
      insertedRewards && insertedRewards.length > 0 ? insertedRewards[0] : null;

    // Update profile
    const newXp = (profile.total_experience_points ?? 0) + actualXp;
    const { error: updateError } = await supabase
      .from("profile")
      .update({
        total_experience_points: newXp,
        current_streak: currentStreak,
        longest_streak: longestStreak,
      })
      .eq("user_id", userId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

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
        `${kidName} completed ${activityTitle}${score ? ` (Score: ${score})` : ""}`,
        insertedReward ? { reward_id: insertedReward.id } : {}
      );
    } catch (e) {
      console.warn("Failed to trigger parent notification in fallback path:", e);
    }

    revalidatePath("/dashboard/kid");
    revalidatePath("/dashboard/parent");

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: errorMsg };
  }
}
