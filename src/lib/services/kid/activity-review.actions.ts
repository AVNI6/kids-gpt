"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  SaveActivityReviewPayload,
  ActivityReviewRow,
} from "@/types/activity-review.types";

/**
 * Save a detailed activity review snapshot immediately after the kid claims XP.
 * Called from VictoryModal after processActivityCompletion / submitAssignmentActivityCompletion
 * returns a successful reward_id.
 *
 * Security: kid must be authenticated; user_id is derived from the session, never trusted from client.
 */
export async function saveActivityReview(
  payload: SaveActivityReviewPayload
): Promise<{ success: boolean; error?: string; reviewId?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    const { data, error } = await supabase
      .from("activity_reviews")
      .insert({
        user_id: user.id,
        activity_type: payload.activityType,
        reward_id: payload.rewardId ?? null,
        submission_id: payload.submissionId ?? null,
        generated_activity_id: payload.generatedActivityId ?? null,
        score_percentage: Math.min(100, Math.max(0, payload.scorePercentage)),
        xp_earned: Math.max(0, payload.xpEarned),
        duration_seconds: payload.durationSeconds ?? null,
        review_data: payload.reviewData,
      })
      .select("id")
      .single();

    if (error) {
      console.error("saveActivityReview DB error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, reviewId: data.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error saving review.";
    console.error("saveActivityReview exception:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Fetch a single activity review row by its UUID.
 * Used by the parent dashboard to populate the ActivityReviewModal.
 *
 * Security:
 *   - The row-level RLS policy "activity_reviews_select_by_parent" ensures that
 *     only a parent linked to the child can read the row.
 *   - No extra application-level check is needed beyond using the authenticated client.
 */
export async function getActivityReviewForParent(
  reviewId: string
): Promise<{ success: boolean; data?: ActivityReviewRow; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    const { data, error } = await supabase
      .from("activity_reviews")
      .select("*")
      .eq("id", reviewId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ActivityReviewRow };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error fetching review.";
    return { success: false, error: msg };
  }
}

/**
 * Fetch a single activity review row by its reward_id or submission_id.
 * Used by the parent dashboard when clicking an activity card.
 */
export async function getActivityReviewByRewardIdForParent(
  rewardId: string
): Promise<{ success: boolean; data?: ActivityReviewRow; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    const { data, error } = await supabase
      .from("activity_reviews")
      .select("*")
      .or(`reward_id.eq.${rewardId},submission_id.eq.${rewardId}`)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "No review found for this activity." };
    }

    return { success: true, data: data as ActivityReviewRow };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error fetching review.";
    return { success: false, error: msg };
  }
}

