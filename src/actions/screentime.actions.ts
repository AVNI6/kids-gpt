"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ScreenTimeData = {
  success: boolean;
  screenTimeSeconds: number;
  dailyLimitMinutes: number;
  error?: string | null;
};

/**
 * Helper: Verifies authenticated user role and returns user ID and role.
 */
async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized. Please sign in to continue.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select("role")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (profileError || !profile) {
    throw new Error("User profile not found.");
  }

  return { userId: user.id, role: profile.role };
}

/**
 * Adds tracked active seconds to the child's daily usage tracking log.
 * Executable by kids (for themselves) or parents (for their connected kids).
 */
export async function logScreenTimeSession(
  childId: string,
  activeSeconds: number
): Promise<{ success: boolean; error?: string | null }> {
  try {
    const { userId, role } = await getAuthenticatedUser();
    const supabase = await createClient();

    let targetChildId = childId;

    if (role === "kid") {
      // Kids can only log for themselves
      targetChildId = userId;
    } else if (role === "parent") {
      // Parents can only log for their active connected kids
      const { data: link, error: linkError } = await supabase
        .from("parent_child_link")
        .select("id")
        .eq("parent_user_id", userId)
        .eq("child_user_id", childId)
        .eq("is_active", true)
        .eq("is_approved", true)
        .is("deleted_at", null)
        .maybeSingle();

      if (linkError || !link) {
        return { success: false, error: "Access denied. Parent is not linked to this child." };
      }
    } else {
      return { success: false, error: "Only kids or parents can update screen time." };
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Fetch existing log for today
    const { data: existingLog, error: fetchError } = await supabase
      .from("daily_usage_tracking")
      .select("id, screen_time_seconds, messages_sent")
      .eq("user_id", targetChildId)
      .eq("usage_date", todayStr)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError) {
      console.error("[logScreenTimeSession] Fetch error:", fetchError);
      return { success: false, error: "Failed to query daily usage." };
    }

    if (existingLog) {
      // Update existing row
      const newSeconds = (existingLog.screen_time_seconds ?? 0) + activeSeconds;
      const { error: updateError } = await supabase
        .from("daily_usage_tracking")
        .update({
          screen_time_seconds: newSeconds,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingLog.id);

      if (updateError) {
        console.error("[logScreenTimeSession] Update error:", updateError);
        return { success: false, error: "Failed to update screen time." };
      }
    } else {
      // Insert new row
      const { error: insertError } = await supabase.from("daily_usage_tracking").insert({
        user_id: targetChildId,
        usage_date: todayStr,
        screen_time_seconds: activeSeconds,
        messages_sent: 0,
        token_used: 0,
        pdfs_generated: 0,
      });

      if (insertError) {
        console.error("[logScreenTimeSession] Insert error:", insertError);
        return { success: false, error: "Failed to create daily usage log." };
      }
    }

    revalidatePath("/dashboard/parent");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Fetches the daily screen time session duration today and the active limit.
 */
export async function getDailyScreenTime(childId: string): Promise<ScreenTimeData> {
  try {
    const { userId, role } = await getAuthenticatedUser();
    const supabase = await createClient();

    let targetChildId = childId;
    let parentId = "";

    if (role === "kid") {
      targetChildId = userId;
    } else if (role === "parent") {
      parentId = userId;
    } else {
      return {
        success: false,
        screenTimeSeconds: 0,
        dailyLimitMinutes: 60,
        error: "Unauthorized role.",
      };
    }

    // 1. Fetch the parent-child linkage to get the daily limit
    const query = supabase
      .from("parent_child_link")
      .select("daily_limit_minutes")
      .eq("child_user_id", targetChildId)
      .eq("is_active", true)
      .eq("is_approved", true)
      .is("deleted_at", null);

    if (role === "parent") {
      query.eq("parent_user_id", parentId);
    }

    const { data: link, error: linkError } = await query.maybeSingle();

    if (linkError) {
      console.error("[getDailyScreenTime] Link query error:", linkError);
      return {
        success: false,
        screenTimeSeconds: 0,
        dailyLimitMinutes: 60,
        error: "Failed to query link limit.",
      };
    }

    const dailyLimit = link?.daily_limit_minutes ?? 60; // Default to 60 minutes if not set

    // 2. Fetch screen time usage today
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: usageLog, error: usageError } = await supabase
      .from("daily_usage_tracking")
      .select("screen_time_seconds, messages_sent")
      .eq("user_id", targetChildId)
      .eq("usage_date", todayStr)
      .is("deleted_at", null)
      .maybeSingle();

    if (usageError) {
      console.error("[getDailyScreenTime] Usage log error:", usageError);
      return {
        success: false,
        screenTimeSeconds: 0,
        dailyLimitMinutes: dailyLimit,
        error: "Failed to query screen time logs.",
      };
    }

    // Fallback: If screen_time_seconds is 0, we check if messages_sent can provide a legacy fallback (messages_sent * 3 * 60)
    let screenTimeSeconds = usageLog?.screen_time_seconds ?? 0;
    if (screenTimeSeconds === 0 && usageLog?.messages_sent) {
      screenTimeSeconds = usageLog.messages_sent * 3 * 60;
    }

    return {
      success: true,
      screenTimeSeconds,
      dailyLimitMinutes: dailyLimit,
    };
  } catch (err) {
    return {
      success: false,
      screenTimeSeconds: 0,
      dailyLimitMinutes: 60,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Updates the screen time daily limit for a connected child.
 */
export async function updateDailyLimit(
  childId: string,
  limitMinutes: number
): Promise<{ success: boolean; error?: string | null }> {
  try {
    const { userId, role } = await getAuthenticatedUser();
    const supabase = await createClient();

    if (role !== "parent") {
      return { success: false, error: "Access denied. Only parents can configure usage limits." };
    }

    if (limitMinutes <= 0) {
      return { success: false, error: "Screen time limit must be at least 1 minute." };
    }

    // Update parent_child_link
    const { error: updateError } = await supabase
      .from("parent_child_link")
      .update({
        daily_limit_minutes: limitMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq("parent_user_id", userId)
      .eq("child_user_id", childId)
      .eq("is_active", true)
      .eq("is_approved", true);

    if (updateError) {
      console.error("[updateDailyLimit] Update error:", updateError);
      return { success: false, error: "Failed to update daily limit in the database." };
    }

    revalidatePath("/dashboard/parent");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}
