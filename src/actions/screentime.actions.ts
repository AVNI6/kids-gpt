"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getLocalDateString } from "@/lib/utils";

export type ScreenTimeData = {
  success: boolean;
  screenTimeSeconds: number;
  dailyLimitMinutes: number;
  isLimitEnabled: boolean;
  serverDate: string;
  error?: string | null;
};

export type ScreenTimeAnalyticsData = {
  success: boolean;
  dailySeconds: number;
  weeklySeconds: number;
  monthlySeconds: number;
  dailyLimitMinutes: number;
  isLimitEnabled: boolean;
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
 * Adds tracked active seconds atomically to the database using the Postgres RPC.
 * This prevents read-modify-write race conditions and verifies limits securely.
 */
export async function logScreenTimeSession(
  childId: string,
  activeSeconds: number,
  timezone: string = "Asia/Kolkata"
): Promise<{ success: boolean; error?: string | null }> {
  try {
    const { userId, role } = await getAuthenticatedUser();
    const supabase = await createClient();

    let targetChildId = childId;

    if (role === "kid") {
      targetChildId = userId;
    } else if (role === "parent") {
      // Verify parent connection
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
        return { success: false, error: "Access denied. Parent is not connected to this child." };
      }
    } else {
      return { success: false, error: "Only kids or parents can update screen time." };
    }

    // Capture local date string using getLocalDateString
    const todayStr = getLocalDateString(new Date(), timezone);

    // Call atomic PostgreSQL function increment_screen_time
    const { error: rpcError } = await supabase.rpc("increment_screen_time", {
      p_child_id: targetChildId,
      p_date: todayStr,
      p_seconds: activeSeconds,
    });

    if (rpcError) {
      console.error("[logScreenTimeSession] Postgres RPC Error:", rpcError);
      return { success: false, error: rpcError.message };
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
 * Reads directly from the daily_screen_time_usage aggregation table.
 */
export async function getDailyScreenTime(
  childId: string,
  timezone: string = "Asia/Kolkata"
): Promise<ScreenTimeData> {
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
        isLimitEnabled: false,
        serverDate: getLocalDateString(new Date(), timezone),
        error: "Unauthorized role.",
      };
    }

    // 1. Fetch the parent-child linkage to get the daily limit and enabled status
    const query = supabase
      .from("parent_child_link")
      .select("daily_limit_minutes, is_screen_time_limit_enabled")
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
        isLimitEnabled: false,
        serverDate: getLocalDateString(new Date(), timezone),
        error: "Failed to query link limit.",
      };
    }

    const dailyLimit = link?.daily_limit_minutes ?? 60;
    const isLimitEnabled = link?.is_screen_time_limit_enabled ?? false;

    // 2. Fetch screen time usage today from daily_screen_time_usage table
    const todayStr = getLocalDateString(new Date(), timezone);
    const { data: usageLog, error: usageError } = await supabase
      .from("daily_screen_time_usage")
      .select("total_seconds")
      .eq("child_id", targetChildId)
      .eq("usage_date", todayStr)
      .maybeSingle();

    if (usageError) {
      console.error("[getDailyScreenTime] Usage log error:", usageError);
      return {
        success: false,
        screenTimeSeconds: 0,
        dailyLimitMinutes: dailyLimit,
        isLimitEnabled,
        serverDate: todayStr,
        error: "Failed to query screen time logs.",
      };
    }

    const screenTimeSeconds = usageLog?.total_seconds ?? 0;

    return {
      success: true,
      screenTimeSeconds,
      dailyLimitMinutes: dailyLimit,
      isLimitEnabled,
      serverDate: todayStr,
    };
  } catch (err) {
    return {
      success: false,
      screenTimeSeconds: 0,
      dailyLimitMinutes: 60,
      isLimitEnabled: false,
      serverDate: getLocalDateString(new Date(), timezone),
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Updates the screen time daily limit settings for a connected child (limit & toggle).
 */
export async function updateDailyLimit(
  childId: string,
  limitMinutes: number,
  isEnabled: boolean
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

    // Update parent_child_link with both is_screen_time_limit_enabled and daily_limit_minutes
    const { error: updateError } = await supabase
      .from("parent_child_link")
      .update({
        daily_limit_minutes: limitMinutes,
        is_screen_time_limit_enabled: isEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("parent_user_id", userId)
      .eq("child_user_id", childId)
      .eq("is_active", true)
      .eq("is_approved", true);

    if (updateError) {
      console.error("[updateDailyLimit] Update error:", updateError);
      return { success: false, error: "Failed to update daily limit settings." };
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
 * Aggregates a child's screen time data from daily_screen_time_usage table.
 * Returns values in seconds. Fully optimized daily/weekly/monthly calculations.
 */
export async function getScreenTimeAnalytics(
  childId: string,
  timezone: string = "Asia/Kolkata"
): Promise<ScreenTimeAnalyticsData> {
  try {
    const { userId, role } = await getAuthenticatedUser();
    const supabase = await createClient();

    if (role !== "parent") {
      return {
        success: false,
        dailySeconds: 0,
        weeklySeconds: 0,
        monthlySeconds: 0,
        dailyLimitMinutes: 60,
        isLimitEnabled: false,
        error: "Access denied. Only parents can view usage analytics.",
      };
    }

    // 1. Verify parent linkage
    const { data: link, error: linkError } = await supabase
      .from("parent_child_link")
      .select("daily_limit_minutes, is_screen_time_limit_enabled")
      .eq("parent_user_id", userId)
      .eq("child_user_id", childId)
      .eq("is_active", true)
      .eq("is_approved", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (linkError || !link) {
      return {
        success: false,
        dailySeconds: 0,
        weeklySeconds: 0,
        monthlySeconds: 0,
        dailyLimitMinutes: 60,
        isLimitEnabled: false,
        error: "Access denied. Parent is not linked to this child.",
      };
    }

    const dailyLimit = link.daily_limit_minutes ?? 60;
    const isLimitEnabled = link.is_screen_time_limit_enabled ?? false;

    // Calculate dates in local timezone
    const today = new Date();
    const todayStr = getLocalDateString(today, timezone);

    // Get date strings for start of week (last 7 days) and start of month (last 30 days)
    const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo, timezone);

    const thirtyDaysAgo = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoStr = getLocalDateString(thirtyDaysAgo, timezone);

    // 2. Query usage logs inside the last 30 days directly from daily_screen_time_usage table
    const { data: usageLogs, error: usageError } = await supabase
      .from("daily_screen_time_usage")
      .select("usage_date, total_seconds")
      .eq("child_id", childId)
      .gte("usage_date", thirtyDaysAgoStr)
      .lte("usage_date", todayStr);

    if (usageError) {
      console.error("[getScreenTimeAnalytics] Fetch error:", usageError);
      return {
        success: false,
        dailySeconds: 0,
        weeklySeconds: 0,
        monthlySeconds: 0,
        dailyLimitMinutes: dailyLimit,
        isLimitEnabled,
        error: "Failed to load usage logs for analytics.",
      };
    }

    let dailySeconds = 0;
    let weeklySeconds = 0;
    let monthlySeconds = 0;

    const logs = usageLogs ?? [];

    logs.forEach((log) => {
      const seconds = log.total_seconds ?? 0;

      // Add to monthly total
      monthlySeconds += seconds;

      // Add to weekly total if within last 7 days
      if (log.usage_date && log.usage_date >= sevenDaysAgoStr) {
        weeklySeconds += seconds;
      }

      // Add to daily total if matches today
      if (log.usage_date === todayStr) {
        dailySeconds = seconds;
      }
    });

    return {
      success: true,
      dailySeconds,
      weeklySeconds,
      monthlySeconds,
      dailyLimitMinutes: dailyLimit,
      isLimitEnabled,
    };
  } catch (err) {
    return {
      success: false,
      dailySeconds: 0,
      weeklySeconds: 0,
      monthlySeconds: 0,
      dailyLimitMinutes: 60,
      isLimitEnabled: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Server Action: Triggers parent notification when screen time limit is reached,
 * strictly preventing spamming via daily database existence checks.
 */
export async function notifyParentLimitReached(
  childId: string,
  limitMinutes?: number
): Promise<{ success: boolean; message?: string; error?: string | null }> {
  try {
    const supabase = await createClient();

    // Step 1 — Calculate Start of Current Day in local server time
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Step 2 — Query Existing Notifications today
    const { data: existingNotifications, error: checkError } = await supabase
      .from("parent_notifications")
      .select("id, metadata")
      .eq("child_id", childId)
      .eq("type", "SCREEN_TIME_LIMIT")
      .gte("created_at", startOfDay.toISOString());

    if (checkError) {
      console.error("[notifyParentLimitReached] Error checking existing notification:", checkError);
    }

    // Required Behavior: If ANY matching row exists for the same limit today, return early.
    // If the limit has been extended today, allow sending a new notification.
    if (existingNotifications && existingNotifications.length > 0) {
      if (limitMinutes !== undefined) {
        const alreadyNotifiedForThisLimit = existingNotifications.some((notif) => {
          const meta = notif.metadata as Record<string, unknown> | null;
          return meta && meta.limit_minutes === limitMinutes;
        });

        if (alreadyNotifiedForThisLimit) {
          return {
            success: true,
            message: `Already notified today for limit of ${limitMinutes} minutes`,
          };
        }
      } else {
        // Fallback: If no limitMinutes is provided, block any duplicate notifications today
        return {
          success: true,
          message: "Already notified today",
        };
      }
    }

    // 2. Fetch linked parents
    const { data: links, error: linkError } = await supabase
      .from("parent_child_link")
      .select("parent_user_id")
      .eq("child_user_id", childId)
      .eq("is_approved", true)
      .is("deleted_at", null);

    if (linkError || !links || links.length === 0) {
      console.warn("[notifyParentLimitReached] No linked parent found for childId:", childId);
      return { success: false, error: "No linked parent found" };
    }

    // 3. Fetch child first name
    const { data: childProfile } = await supabase
      .from("profile")
      .select("first_name")
      .eq("user_id", childId)
      .maybeSingle();

    const childName = childProfile?.first_name || "Your child";

    // 4. Insert notifications for each linked parent
    for (const link of links) {
      const { error: insertError } = await supabase.from("parent_notifications").insert({
        parent_id: link.parent_user_id,
        child_id: childId,
        type: "SCREEN_TIME_LIMIT",
        title: "Daily Limit Reached",
        message: `${childName} has reached their daily screen time limit and is currently locked out.`,
        metadata: {
          limit_minutes: limitMinutes,
        },
      });

      if (insertError) {
        console.error("[notifyParentLimitReached] Insert error:", insertError.message);
      }
    }

    return { success: true };
  } catch (err) {
    console.error("[notifyParentLimitReached] Exception caught:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}
