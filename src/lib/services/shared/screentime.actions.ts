"use server";

import { cache } from "react";
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
const getAuthenticatedUser = cache(async () => {
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
});

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

    // FIXED: Removed revalidatePath to prevent heavy Next.js
    // Server Component re-renders every 15 seconds.
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
    // 1. Recover any stale/ghost sessions to flush their duration before querying totals
    await recoverStaleSessions();

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

    // 1. Retrieve the authenticated user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Verify caller identity / parent relationship
    if (user.id !== childId) {
      const { data: link } = await supabase
        .from("parent_child_link")
        .select("id")
        .eq("parent_user_id", user.id)
        .eq("child_user_id", childId)
        .eq("is_approved", true)
        .eq("is_active", true)
        .is("deleted_at", null)
        .maybeSingle();

      if (!link) {
        return { success: false, error: "Unauthorized screen time limit request." };
      }
    }

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

/**
 * Recovers stale/ghost screen time sessions older than 2 minutes by completing them at last_seen_at.
 */
export async function recoverStaleSessions(): Promise<{
  success: boolean;
  recoveredCount?: number;
  error?: string | null;
}> {
  try {
    const supabase = await createClient();

    // Find ACTIVE sessions where last_seen_at is older than 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: staleSessions, error: queryError } = await supabase
      .from("screen_time_sessions")
      .select("id, last_seen_at")
      .eq("status", "ACTIVE")
      .lt("last_seen_at", twoMinutesAgo);

    if (queryError) {
      console.error("[recoverStaleSessions] Query error:", queryError);
      return { success: false, error: queryError.message };
    }

    if (!staleSessions || staleSessions.length === 0) {
      return { success: true, recoveredCount: 0 };
    }

    const updatePromises = staleSessions.map(async (session) => {
      const { error: updateError } = await supabase
        .from("screen_time_sessions")
        .update({
          ended_at: session.last_seen_at,
          status: "COMPLETED",
        })
        .eq("id", session.id);

      if (updateError) {
        console.error(`[recoverStaleSessions] Failed to close session ${session.id}:`, updateError);
        return false;
      }
      return true;
    });

    const results = await Promise.all(updatePromises);
    const count = results.filter(Boolean).length;

    return { success: true, recoveredCount: count };
  } catch (err) {
    console.error("[recoverStaleSessions] Exception:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Creates an ACTIVE screen session for the child, after recovering any existing stale sessions.
 */
export async function startScreenSession(
  childId: string,
  parentId: string
): Promise<{ success: boolean; sessionId?: string; error?: string | null }> {
  try {
    const supabase = await createClient();

    // 1. Close any stale ACTIVE sessions older than 2 minutes
    await recoverStaleSessions();

    // 2. Prevent duplicate ACTIVE sessions for this child.
    // Return existing sessionId if active to prevent duplicates.
    const { data: existingSession, error: checkError } = await supabase
      .from("screen_time_sessions")
      .select("id")
      .eq("child_id", childId)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (checkError) {
      console.error("[startScreenSession] Duplicate check error:", checkError);
    }

    if (existingSession) {
      return { success: true, sessionId: existingSession.id };
    }

    // Determine parent_id from link if not provided
    let targetParentId = parentId;
    if (!targetParentId) {
      const { data: link } = await supabase
        .from("parent_child_link")
        .select("parent_user_id")
        .eq("child_user_id", childId)
        .eq("is_active", true)
        .eq("is_approved", true)
        .is("deleted_at", null)
        .maybeSingle();
      targetParentId = link?.parent_user_id || "";
    }

    if (!targetParentId) {
      return { success: false, error: "No active parent-child link found for child." };
    }

    // 3. Create a new ACTIVE session
    const { data: newSession, error: insertError } = await supabase
      .from("screen_time_sessions")
      .insert({
        child_id: childId,
        parent_id: targetParentId,
        status: "ACTIVE",
      })
      .select("id")
      .single();

    if (insertError) {
      // Gracefully handle concurrent starts by returning the existing active session
      if (insertError.code === "23505") {
        const { data: existingSession, error: checkError } = await supabase
          .from("screen_time_sessions")
          .select("id")
          .eq("child_id", childId)
          .eq("status", "ACTIVE")
          .maybeSingle();

        if (!checkError && existingSession) {
          return { success: true, sessionId: existingSession.id };
        }
      }
      console.error("[startScreenSession] Insert session error:", insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true, sessionId: newSession.id };
  } catch (err) {
    console.error("[startScreenSession] Exception:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Heartbeat Ping: Updates presence timing, increments daily usage table, and verifies limit thresholds.
 */
export async function updatePresence(
  sessionId: string,
  timezone: string = "Asia/Kolkata"
): Promise<{ success: boolean; isLocked?: boolean; error?: string | null }> {
  try {
    const supabase = await createClient();

    // 1. Fetch current session details
    const { data: session, error: fetchError } = await supabase
      .from("screen_time_sessions")
      .select("last_seen_at, child_id, parent_id")
      .eq("id", sessionId)
      .eq("status", "ACTIVE")
      .single();

    if (fetchError || !session) {
      console.error("[updatePresence] Active session not found or inactive:", fetchError);
      return { success: false, error: "Active session not found." };
    }

    const now = new Date();
    const elapsedSeconds = Math.max(
      0,
      Math.floor((now.getTime() - new Date(session.last_seen_at).getTime()) / 1000)
    );

    // 2. Update last_seen_at on the session table
    const { error: updateError } = await supabase
      .from("screen_time_sessions")
      .update({
        last_seen_at: now.toISOString(),
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("[updatePresence] Failed to update last_seen_at:", updateError);
      return { success: false, error: updateError.message };
    }

    // 3. Increment the daily_screen_time_usage table if elapsedSeconds > 0
    if (elapsedSeconds > 0) {
      const cappedSeconds = Math.min(elapsedSeconds, 3600);
      const todayStr = getLocalDateString(now, timezone);

      const { error: rpcError } = await supabase.rpc("increment_screen_time", {
        p_child_id: session.child_id,
        p_date: todayStr,
        p_seconds: cappedSeconds,
      });

      if (rpcError) {
        console.error("[updatePresence] RPC increment_screen_time failed:", rpcError);
        return { success: false, error: rpcError.message };
      }
    }

    // 4. Query daily limit settings and check lockout status
    const { data: link, error: linkError } = await supabase
      .from("parent_child_link")
      .select("daily_limit_minutes, is_screen_time_limit_enabled")
      .eq("child_user_id", session.child_id)
      .eq("is_active", true)
      .eq("is_approved", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (linkError) {
      console.error("[updatePresence] Link query error:", linkError);
    }

    const dailyLimit = link?.daily_limit_minutes ?? 60;
    const isLimitEnabled = link?.is_screen_time_limit_enabled ?? false;

    // Fetch the updated total seconds from daily_screen_time_usage
    const todayStr = getLocalDateString(now, timezone);
    const { data: usageLog, error: usageError } = await supabase
      .from("daily_screen_time_usage")
      .select("total_seconds")
      .eq("child_id", session.child_id)
      .eq("usage_date", todayStr)
      .maybeSingle();

    if (usageError) {
      console.error("[updatePresence] Usage log query error:", usageError);
    }

    const totalSeconds = usageLog?.total_seconds ?? 0;
    const totalMinutes = totalSeconds / 60;
    const isLocked = isLimitEnabled && totalMinutes >= dailyLimit;

    // 5. Handle single daily limit notification without strict DB constraint
    if (isLocked) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // Check if a LIMIT_REACHED notification already exists today in Server Action logic
      const { data: existingNotif, error: notifCheckError } = await supabase
        .from("parent_notifications")
        .select("id")
        .eq("child_id", session.child_id)
        .eq("type", "LIMIT_REACHED")
        .gte("created_at", startOfDay.toISOString())
        .limit(1);

      if (notifCheckError) {
        console.error("[updatePresence] Notification query error:", notifCheckError);
      }

      if (!existingNotif || existingNotif.length === 0) {
        // Fetch child first name
        const { data: childProfile } = await supabase
          .from("profile")
          .select("first_name")
          .eq("user_id", session.child_id)
          .maybeSingle();

        const childName = childProfile?.first_name || "Your child";

        await supabase.from("parent_notifications").insert({
          parent_id: session.parent_id,
          child_id: session.child_id,
          type: "LIMIT_REACHED",
          title: "Daily Limit Reached",
          message: `${childName} reached today's screen time limit.`,
          metadata: {
            limit_minutes: dailyLimit,
          },
        });
      }
    }

    return { success: true, isLocked };
  } catch (err) {
    console.error("[updatePresence] Exception:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * End Screen Session gracefully: Flushes any final elapsed seconds and completes session status.
 */
export async function endScreenSession(
  sessionId: string,
  timezone: string = "Asia/Kolkata"
): Promise<{ success: boolean; error?: string | null }> {
  try {
    const supabase = await createClient();

    // 1. Fetch current session details
    const { data: session, error: fetchError } = await supabase
      .from("screen_time_sessions")
      .select("last_seen_at, child_id, parent_id")
      .eq("id", sessionId)
      .eq("status", "ACTIVE")
      .single();

    if (fetchError || !session) {
      console.warn("[endScreenSession] Active session not found or already closed.");
      return { success: true };
    }

    const now = new Date();
    const elapsedSeconds = Math.max(
      0,
      Math.floor((now.getTime() - new Date(session.last_seen_at).getTime()) / 1000)
    );

    // 2. Increment daily usage if there are final unsynced seconds
    if (elapsedSeconds > 0) {
      const cappedSeconds = Math.min(elapsedSeconds, 3600);
      const todayStr = getLocalDateString(now, timezone);

      const { error: rpcError } = await supabase.rpc("increment_screen_time", {
        p_child_id: session.child_id,
        p_date: todayStr,
        p_seconds: cappedSeconds,
      });

      if (rpcError) {
        console.error("[endScreenSession] RPC increment failed:", rpcError);
      }
    }

    // 3. Mark session as completed
    const { error: updateError } = await supabase
      .from("screen_time_sessions")
      .update({
        ended_at: now.toISOString(),
        status: "COMPLETED",
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("[endScreenSession] Update session error:", updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[endScreenSession] Exception:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
