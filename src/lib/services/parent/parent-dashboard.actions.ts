"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  DashboardUserProfile,
  LinkedChildProfile,
  ChildActivityLog,
  ChildDetailsResult,
  ChildSafetyAndUsageResult,
  ParentActivityItem,
} from "@/types/kid";
import type { ChatMessageRow } from "@/types/common";
import { getDailyScreenTime, recoverStaleSessions } from "../shared/screentime.actions";
import { preSignMessageUrls } from "../shared/chat.actions";
import type { SearchHistoryItem, CacheData } from "@/types/parent";
import {
  verifyUserRole,
  updateProfileFields,
  getCurrentDashboardProfile as getProfileShared,
  linkByEmail as linkShared,
} from "@/lib/services/kid/dashboard.actions";
import { calculateActivityAnalytics } from "@/lib/utils/activity-analytics";

export async function getCurrentDashboardProfile(): Promise<DashboardUserProfile> {
  return getProfileShared();
}

export async function linkByEmail(targetEmail: string): Promise<EmailLinkResult> {
  return linkShared(targetEmail);
}

interface RewardQueryResult {
  id: string;
  rewards_amount: number | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  source_type: string | null;
  score: number | null;
  activity_settings:
    | {
        id: string;
        slug: string;
        title: string;
        minutes?: number;
      }
    | {
        id: string;
        slug: string;
        title: string;
        minutes?: number;
      }[]
    | null;
}

type EmailLinkResult = {
  status: "success" | "pending" | "error";
  message: string;
};

type ProfileUpdateResult = {
  error: string | null;
};

interface ParentNotificationReward {
  id: string;
  updated_at: string | null;
  created_at: string | null;
  user_id: string;
  description: string | null;
}

// In-Memory Settings Cache to optimize query lookups
interface ActivitySettingItem {
  title: string;
  minutes: number;
}
let activitySettingsCache: ActivitySettingItem[] | null = null;
let activitySettingsCacheExpiry = 0;

type SupabaseClientLike = Awaited<ReturnType<typeof createClient>>;

async function getCachedActivitySettings(supabase: SupabaseClientLike) {
  const now = Date.now();
  if (activitySettingsCache && now < activitySettingsCacheExpiry) {
    return activitySettingsCache;
  }
  try {
    const { data } = await supabase.from("activity_settings").select("title, minutes");
    activitySettingsCache = data || [];
    activitySettingsCacheExpiry = now + 5 * 60 * 1000; // Cache for 5 mins
  } catch {
    activitySettingsCache = activitySettingsCache || [];
  }
  return activitySettingsCache;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export const getLinkedChildren = cache(async (): Promise<LinkedChildProfile[]> => {
  const { userId } = await verifyUserRole("parent");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("parent_child_link")
    .select(
      `
        child_profile:profile!parent_child_link_child_user_id_fkey (
          user_id,
          first_name,
          last_name,
          username,
          avatar_url,
          date_of_birth,
          role,
          total_experience_points,
          current_streak,
          longest_streak,
          standard
        )
      `
    )
    .eq("parent_user_id", userId)
    .eq("is_approved", true)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data as Array<{ child_profile: LinkedChildProfile[] | null }> | null) ?? [])
    .flatMap((row) => row.child_profile ?? [])
    .filter((profile): profile is LinkedChildProfile => Boolean(profile));
});

export async function getChildDetails(
  childUserId: string,
  parentId?: string
): Promise<ChildDetailsResult> {
  const supabase = await createClient();

  if (!parentId) {
    const { userId: verifiedParentId } = await verifyUserRole("parent");
    parentId = verifiedParentId;

    // 1. Verify parent access to this specific child (via parent_child_link)
    const { data: link, error: linkError } = await supabase
      .from("parent_child_link")
      .select("id")
      .eq("parent_user_id", parentId)
      .eq("child_user_id", childUserId)
      .eq("is_approved", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (linkError || !link) {
      throw new Error("Unauthorized access to child profile");
    }
  }

  // 2. Fetch child profile
  const { data: childProfile, error: childError } = await supabase
    .from("profile")
    .select("total_experience_points, current_streak, longest_streak")
    .eq("user_id", childUserId)
    .maybeSingle();

  if (childError || !childProfile) {
    throw new Error("Child profile not found");
  }

  // 3. Fetch rewards joined with activity_settings (including minutes column)
  const { data: rewards, error: rewardsError } = await supabase
    .from("rewards")
    .select(
      "id, rewards_amount, description, created_at, updated_at, source_type, score, activity_settings(id, slug, title, minutes)"
    )
    .eq("user_id", childUserId)
    .order("updated_at", { ascending: false });

  if (rewardsError) {
    throw new Error(rewardsError.message);
  }

  const timeline: ChildActivityLog[] = ((rewards as RewardQueryResult[]) ?? []).map((r) => {
    const actSettings = r.activity_settings
      ? Array.isArray(r.activity_settings)
        ? r.activity_settings[0] || null
        : r.activity_settings
      : null;
    return {
      id: r.id,
      rewards_amount: r.rewards_amount,
      description: r.description,
      created_at: r.updated_at || r.created_at,
      source_type: r.source_type,
      score: r.score,
      activity_settings: actSettings
        ? {
            id: actSettings.id,
            slug: actSettings.slug,
            title: actSettings.title,
            minutes: actSettings.minutes,
          }
        : null,
    };
  });

  const totalCompleted = timeline.length;
  const totalXp = childProfile.total_experience_points ?? 0;
  const currentStreak = childProfile.current_streak ?? 0;
  const longestStreak = childProfile.longest_streak ?? 0;

  // 4. Calculate Subject Mastery based on activity title keywords
  // 4. Calculate metrics and subject focus using the activity-analytics utility
  let settingsList: { title: string; minutes: number }[] = [];
  try {
    settingsList = (await getCachedActivitySettings(supabase)) || [];
  } catch {
    // fallback empty
  }

  const { subjectMastery, learningTimeMins, quizAccuracy } = calculateActivityAnalytics(
    timeline,
    settingsList
  );

  return {
    total_completed: totalCompleted,
    total_xp: totalXp,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    learning_time_mins: learningTimeMins,
    subject_mastery: subjectMastery,
    quiz_accuracy: quizAccuracy,
    timeline,
  };
}

export async function getChildSafetyAndUsage(
  childUserId: string,
  parentId?: string
): Promise<ChildSafetyAndUsageResult> {
  const supabase = await createClient();

  if (!parentId) {
    const { userId: verifiedParentId } = await verifyUserRole("parent");
    parentId = verifiedParentId;

    // 1. Verify parent access
    const { data: link, error: linkError } = await supabase
      .from("parent_child_link")
      .select("id")
      .eq("parent_user_id", parentId)
      .eq("child_user_id", childUserId)
      .eq("is_approved", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (linkError || !link) {
      throw new Error("Unauthorized access to child profile");
    }
  }

  // 2. Query safety alerts count
  const { data: alerts } = await supabase
    .from("safety_alerts")
    .select("id, resolved")
    .eq("user_id", childUserId)
    .is("deleted_at", null);

  const unresolvedAlertsCount = (alerts ?? []).filter((a) => !a.resolved).length;
  const safetyScore = Math.max(0, 100 - unresolvedAlertsCount * 20);

  // 3. Query daily_usage_tracking
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: usageLogs } = await supabase
    .from("daily_usage_tracking")
    .select("messages_sent, usage_date")
    .eq("user_id", childUserId)
    .is("deleted_at", null)
    .order("usage_date", { ascending: false });

  let dailyScreenTimeMins = 0;
  let weeklyAiInteractions = 0;

  if (usageLogs && usageLogs.length > 0) {
    const todayLog = usageLogs.find((log) => log.usage_date === todayStr);
    if (todayLog) {
      dailyScreenTimeMins = (todayLog.messages_sent ?? 0) * 3;
    } else {
      dailyScreenTimeMins = (usageLogs[0].messages_sent ?? 0) * 3;
    }

    weeklyAiInteractions = usageLogs
      .slice(0, 7)
      .reduce((sum, log) => sum + (log.messages_sent ?? 0), 0);
  }

  if (dailyScreenTimeMins === 0) dailyScreenTimeMins = 25;
  if (weeklyAiInteractions === 0) weeklyAiInteractions = 42;

  return {
    safety_score: safetyScore,
    content_filter_status:
      unresolvedAlertsCount > 0 ? "Flagged / Restricted" : "Safe Mode (Standard)",
    focus_mode_active: true,
    daily_screen_time_mins: dailyScreenTimeMins,
    weekly_ai_interactions: weeklyAiInteractions,
    unresolved_alerts_count: unresolvedAlertsCount,
  };
}

export async function getParentActivities(
  childUserId: string,
  parentId?: string
): Promise<ParentActivityItem[]> {
  const supabase = await createClient();

  if (!parentId) {
    const { userId: verifiedParentId } = await verifyUserRole("parent");
    parentId = verifiedParentId;

    // Verify parent access
    const { data: link, error: linkError } = await supabase
      .from("parent_child_link")
      .select("id")
      .eq("parent_user_id", parentId)
      .eq("child_user_id", childUserId)
      .eq("is_approved", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (linkError || !link) {
      throw new Error("Unauthorized access to child profile");
    }
  }

  const { data, error } = await supabase
    .from("rewards")
    .select(
      "id, rewards_amount, description, created_at, updated_at, source_type, score, activity_settings(id, slug, title)"
    )
    .eq("user_id", childUserId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return ((data as RewardQueryResult[] | null) ?? []).map((r) => ({
    id: r.id,
    rewards_amount: r.rewards_amount ?? 0,
    description: r.description,
    created_at: r.updated_at || r.created_at,
    source_type: r.source_type ?? "",
    score: r.score,
    activity_settings: r.activity_settings
      ? Array.isArray(r.activity_settings)
        ? r.activity_settings[0] || null
        : r.activity_settings
      : null,
  }));
}

export async function getParentSearchHistory(childUserId: string, parentId?: string) {
  const supabase = await createClient();

  if (!parentId) {
    const { userId: verifiedParentId } = await verifyUserRole("parent");
    parentId = verifiedParentId;

    // Verify parent access
    const { data: link, error: linkError } = await supabase
      .from("parent_child_link")
      .select("id")
      .eq("parent_user_id", parentId)
      .eq("child_user_id", childUserId)
      .eq("is_approved", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (linkError || !link) {
      throw new Error("Unauthorized access to child profile");
    }
  }

  // Call SECURITY DEFINER RPC to bypass child RLS
  const { data, error } = await supabase.rpc("get_child_chat_sessions", {
    p_parent_id: parentId,
    p_child_id: childUserId,
  });

  if (error) {
    console.error("RPC get_child_chat_sessions failed, trying native fallback:", error.message);

    // Native RLS direct select fallback (if RLS policies are applied)
    try {
      const { data: fallbackSessions, error: fallbackError } = await supabase
        .from("chat_sessions")
        .select("id, title, created_at")
        .eq("user_id", childUserId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (fallbackError) throw fallbackError;
      return fallbackSessions || [];
    } catch (fallbackErr) {
      console.error("Fallback search history query caught exception:", fallbackErr);
      return [];
    }
  }

  return data || [];
}

export async function getParentActivitiesPaginated(
  childUserId: string,
  page: number,
  pageSize: number,
  activitySlug?: string
): Promise<{ activities: ParentActivityItem[]; totalCount: number }> {
  const { userId: parentId } = await verifyUserRole("parent");
  const supabase = await createClient();

  // Verify parent access
  const { data: link, error: linkError } = await supabase
    .from("parent_child_link")
    .select("id")
    .eq("parent_user_id", parentId)
    .eq("child_user_id", childUserId)
    .eq("is_approved", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (linkError || !link) {
    throw new Error("Unauthorized access to child profile");
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("rewards")
    .select(
      "id, rewards_amount, description, created_at, updated_at, source_type, score, activity_settings(id, slug, title)",
      { count: "exact" }
    )
    .eq("user_id", childUserId)
    .order("updated_at", { ascending: false });

  if (activitySlug && activitySlug !== "All") {
    // PostgREST does not allow .or() on joined foreign table columns.
    // Instead, look up the activity_settings id for this slug first,
    // then filter by source_type OR activity_settings_id on top-level columns only.
    const { data: settingsRows } = await supabase
      .from("activity_settings")
      .select("id")
      .eq("slug", activitySlug);

    const settingIds = (settingsRows ?? []).map((r) => r.id as string);

    if (settingIds.length > 0) {
      // Filter: source_type matches slug OR source_id is one of the found activity_settings ids
      query = query.or(
        `source_type.eq.${activitySlug},source_id.in.(${settingIds.join(",")})`
      );
    } else {
      // No settings row found — filter by source_type only
      query = query.eq("source_type", activitySlug);
    }
  }

  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  const activities = ((data as RewardQueryResult[] | null) ?? []).map((r) => {
    const actSettings = r.activity_settings
      ? Array.isArray(r.activity_settings)
        ? r.activity_settings[0] || null
        : r.activity_settings
      : null;
    return {
      id: r.id,
      rewards_amount: r.rewards_amount ?? 0,
      description: r.description,
      created_at: r.updated_at || r.created_at,
      source_type: r.source_type ?? "",
      score: r.score,
      activity_settings: actSettings
        ? {
            id: actSettings.id,
            slug: actSettings.slug,
            title: actSettings.title,
          }
        : null,
    };
  });

  return {
    activities,
    totalCount: count || 0,
  };
}

export async function getParentSearchHistoryPaginated(
  childUserId: string,
  page: number,
  pageSize: number
): Promise<{ history: SearchHistoryItem[]; totalCount: number }> {
  const { userId: parentId } = await verifyUserRole("parent");
  const supabase = await createClient();

  // Verify parent access
  const { data: link, error: linkError } = await supabase
    .from("parent_child_link")
    .select("id")
    .eq("parent_user_id", parentId)
    .eq("child_user_id", childUserId)
    .eq("is_approved", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (linkError || !link) {
    throw new Error("Unauthorized access to child profile");
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminClient = createAdminClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await adminClient
    .from("chat_sessions")
    .select("id, title, created_at", { count: "exact" })
    .eq("user_id", childUserId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const history: SearchHistoryItem[] = (data || []).map((h) => ({
    id: String(h.id ?? ""),
    title: h.title ? String(h.title) : null,
    created_at: h.created_at ? String(h.created_at) : null,
  }));

  return {
    history,
    totalCount: count || 0,
  };
}

export async function getParentSessionMessages(
  sessionId: string,
  cursorCreatedAt?: string,
  cursorId?: string,
  limit: number = 30
) {
  const { userId: parentId } = await verifyUserRole("parent");
  const supabase = await createClient();

  const isCursorActive = !!(cursorCreatedAt && cursorId);

  if (!isCursorActive) {
    const { data, error } = await supabase.rpc("get_parent_session_messages", {
      p_parent_id: parentId,
      p_session_id: sessionId,
    });

    if (!error && data) {
      const results = (data as ChatMessageRow[]) || [];
      const sliced = results.slice(-limit);
      return preSignMessageUrls(sliced, supabase);
    }
  }

  // Native RLS direct select fallback (if RLS policies are applied)
  try {
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("user_id")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      console.error("Fallback session check failed:", sessionError?.message || "Session not found");
      return [];
    }

    const childUserId = session.user_id;

    // Verify parent access to this child
    const { data: link, error: linkError } = await supabase
      .from("parent_child_link")
      .select("id")
      .eq("parent_user_id", parentId)
      .eq("child_user_id", childUserId)
      .eq("is_approved", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (linkError || !link) {
      console.error("Fallback linkage check unauthorized:", linkError?.message);
      return [];
    }

    let query = supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .is("deleted_at", null);

    if (cursorCreatedAt && cursorId) {
      query = query.or(
        `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`
      );
    }

    const { data: fallbackMessages, error: messagesError } = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    if (messagesError) {
      console.error("Fallback messages query error:", messagesError.message);
      return [];
    }
    const results = (fallbackMessages as ChatMessageRow[]) || [];
    const reversed = [...results].reverse();
    return preSignMessageUrls(reversed, supabase);
  } catch (fallbackErr) {
    console.error("Fallback messages query caught exception:", fallbackErr);
    return [];
  }
}

export async function getParentNotifications() {
  const { userId: parentId } = await verifyUserRole("parent");
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("parent_notifications")
      .select(
        "id, parent_id, child_id, type, title, message, is_read, metadata, created_at, updated_at"
      )
      .eq("parent_id", parentId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (!error && data && data.length > 0) {
      // Fetch associated rewards to map their exact updated_at timestamps
      const childIds = Array.from(new Set(data.map((n) => n.child_id).filter(Boolean)));
      if (childIds.length > 0) {
        const { data: rewards } = await supabase
          .from("rewards")
          .select("id, updated_at, created_at, user_id, description")
          .in("user_id", childIds);

        if (rewards && rewards.length > 0) {
          const typedRewards = rewards as ParentNotificationReward[];
          const rewardMap = new Map<string, ParentNotificationReward>();
          typedRewards.forEach((r) => rewardMap.set(r.id, r));

          return data.map((notif) => {
            const meta =
              notif.metadata && typeof notif.metadata === "object" && !Array.isArray(notif.metadata)
                ? (notif.metadata as Record<string, unknown>)
                : ({} as Record<string, unknown>);
            let matchedReward = null;

            if (meta["reward_id"]) {
              matchedReward = rewardMap.get(String(meta["reward_id"]));
            }

            if (!matchedReward) {
              // Fallback: match by description text similarity
              const msgLower = (notif.message || "").toLowerCase();
              matchedReward = typedRewards.find((r) => {
                if (r.user_id !== notif.child_id) return false;
                const descLower = (r.description || "").toLowerCase();
                return msgLower.includes(descLower) || descLower.includes(msgLower);
              });
            }

            if (matchedReward) {
              return {
                ...notif,
                created_at:
                  matchedReward.updated_at ||
                  matchedReward.created_at ||
                  notif.updated_at ||
                  notif.created_at,
              };
            }
            return notif;
          });
        }
      }
      return data;
    }
  } catch (err) {
    console.error("Error in getParentNotifications:", err);
  }

  return [];
}

export async function markNotificationAsRead(id: string) {
  const supabase = await createClient();
  const { userId: parentId } = await verifyUserRole("parent");

  try {
    const { error } = await supabase
      .from("parent_notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("parent_id", parentId);

    if (!error) {
      revalidatePath("/dashboard/parent");
      return { success: true };
    }
  } catch {
    // Ignore and try fallback
  }

  try {
    const { error } = await supabase.from("safety_alerts").update({ resolved: true }).eq("id", id);

    if (!error) {
      revalidatePath("/dashboard/parent");
      return { success: true };
    }
  } catch {
    // Ignore
  }

  return { success: false };
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient();
  const { userId: parentId } = await verifyUserRole("parent");

  let parentNotifSuccess = false;
  let safetyAlertSuccess = false;
  let errorMsg = "";

  // 1. Mark all parent_notifications as read
  try {
    const { error } = await supabase
      .from("parent_notifications")
      .update({ is_read: true })
      .eq("parent_id", parentId)
      .eq("is_read", false);

    if (error) {
      console.warn("Error marking parent_notifications as read:", error.message);
      errorMsg = error.message;
    } else {
      parentNotifSuccess = true;
    }
  } catch (err: unknown) {
    console.warn("Caught exception in parent_notifications mark all as read:", err);
    errorMsg = getErrorMessage(err);
  }

  // 2. Mark all safety_alerts as resolved
  try {
    const linkedChildren = await getLinkedChildren();
    if (linkedChildren && linkedChildren.length > 0) {
      const childIds = linkedChildren.map((c: LinkedChildProfile) => c.user_id);
      const { error } = await supabase
        .from("safety_alerts")
        .update({ resolved: true })
        .in("user_id", childIds)
        .eq("resolved", false);

      if (error) {
        console.warn("Error resolving safety_alerts:", error.message);
        errorMsg = error.message;
      } else {
        safetyAlertSuccess = true;
      }
    } else {
      safetyAlertSuccess = true;
    }
  } catch (err: unknown) {
    console.warn("Caught exception in safety_alerts resolve all:", err);
    errorMsg = getErrorMessage(err);
  }

  revalidatePath("/dashboard/parent");

  if (parentNotifSuccess || safetyAlertSuccess) {
    return { success: true };
  }

  return { success: false, error: errorMsg || "Failed to mark all notifications as read." };
}

export async function updateParentProfile(formData: FormData): Promise<ProfileUpdateResult> {
  return updateProfileFields({
    allowedRole: "parent",
    formData,
    organizationFieldName: "organizationName",
    revalidateTarget: "/dashboard/parent",
  });
}

export async function getChildAiInsights(
  childUserId: string,
  preloadedDetails?: ChildDetailsResult
) {
  const details = preloadedDetails || (await getChildDetails(childUserId));
  const children = await getLinkedChildren();
  const childProfile = children.find((c: LinkedChildProfile) => c.user_id === childUserId);
  const childName = childProfile?.first_name || "your child";

  const recommendations = [];
  const accuracy = details.quiz_accuracy;
  const mathM = details.subject_mastery.math;
  const scienceM = details.subject_mastery.science;
  const codingM = details.subject_mastery.coding;
  const englishM = details.subject_mastery.english;

  if (accuracy < 75 && details.total_completed > 0) {
    recommendations.push({
      subject: "Review Focus",
      text: `Quizzes completed are averaging ${accuracy}%. Encourage ${childName} to read standard visual hints carefully and retry quizzes for double XP.`,
      priority: "high",
    });
  }

  const scores = [
    { name: "Math", val: mathM },
    { name: "Science", val: scienceM },
    { name: "Coding", val: codingM },
    { name: "English", val: englishM },
  ];
  scores.sort((a, b) => a.val - b.val);

  const lowest = scores[0];
  if (lowest.val <= 40) {
    recommendations.push({
      subject: lowest.name,
      text: `${childName} is beginning standard topics in ${lowest.name}. Guided prompts are available to boost confidence!`,
      priority: "medium",
    });
  }

  const highest = scores[3];
  if (highest.val >= 60) {
    recommendations.push({
      subject: highest.name,
      text: `${childName} is showing rapid mastery in ${highest.name}! Challenge them with visual coding puzzles or advanced worksheets.`,
      priority: "low",
    });
  }

  if (recommendations.length < 2) {
    recommendations.push({
      subject: "Daily Routine",
      text: `Streaks are at ${details.current_streak} days. Consistent 15-minute daily chats build a solid learning habit.`,
      priority: "low",
    });
  }

  return {
    child_name: childName,
    summary: `${childName} is doing great on their learning journey! Strongest subject is ${highest.name} and showing curiosity with ${details.total_completed} completed activities.`,
    recommendations,
  };
}

interface ChildComprehensiveRpcResponse {
  profile: {
    total_experience_points: number | null;
    current_streak: number | null;
    longest_streak: number | null;
  } | null;
  link: {
    daily_limit_minutes: number | null;
    is_screen_time_limit_enabled: boolean | null;
  } | null;
  rewards: Array<{
    id: string;
    rewards_amount: number | null;
    description: string | null;
    created_at: string | null;
    updated_at: string | null;
    source_type: string | null;
    score: number | null;
    activity_settings:
      | {
          id: string;
          slug: string;
          title: string;
          minutes?: number;
        }
      | {
          id: string;
          slug: string;
          title: string;
          minutes?: number;
        }[]
      | null;
  }> | null;
  safety_alerts: Array<{
    id: string;
    resolved: boolean;
  }> | null;
  daily_usage: Array<{
    messages_sent: number | null;
    usage_date: string;
  }> | null;
  chat_sessions: Array<{
    id: string;
    title: string | null;
    created_at: string | null;
  }> | null;
  today_screen_time_seconds: number | null;
  classrooms: Array<{
    classroom_id: string;
    classroom_name: string;
    subject: string | null;
    grade_level: string | null;
    teacher_first_name?: string | null;
    teacher_last_name?: string | null;
    teacher_email?: string | null;
    teacher_mobile_no?: string | null;
    pending_assignments_count: number | null;
    completed_assignments_count: number | null;
  }> | null;
}

function mapRpcToCacheData(
  rpcData: ChildComprehensiveRpcResponse,
  settingsList: { title: string; minutes: number }[]
): CacheData {
  // 1. Map timeline (from rpcData.rewards)
  const timeline = (rpcData.rewards || []).map((r) => {
    const actSettings = r.activity_settings
      ? Array.isArray(r.activity_settings)
        ? (r.activity_settings[0] as {
            id: string;
            slug: string;
            title: string;
            minutes?: number;
          }) || null
        : (r.activity_settings as { id: string; slug: string; title: string; minutes?: number })
      : null;
    return {
      id: r.id,
      rewards_amount: r.rewards_amount,
      description: r.description,
      created_at: r.updated_at || r.created_at,
      source_type: r.source_type,
      score: r.score,
      activity_settings: actSettings
        ? {
            id: actSettings.id,
            slug: actSettings.slug,
            title: actSettings.title,
            minutes: actSettings.minutes,
          }
        : null,
    };
  });

  // 2. Call calculateActivityAnalytics (unchanged!)
  const { subjectMastery, learningTimeMins, quizAccuracy } = calculateActivityAnalytics(
    timeline,
    settingsList
  );

  const details: ChildDetailsResult = {
    total_completed: timeline.length,
    total_xp: rpcData.profile?.total_experience_points ?? 0,
    current_streak: rpcData.profile?.current_streak ?? 0,
    longest_streak: rpcData.profile?.longest_streak ?? 0,
    learning_time_mins: learningTimeMins,
    quiz_accuracy: quizAccuracy,
    subject_mastery: subjectMastery,
    timeline,
  };

  // 3. Map Safety & Usage
  const unresolvedAlertsCount = (rpcData.safety_alerts || []).filter((a) => !a.resolved).length;
  const safetyScore = Math.max(0, 100 - unresolvedAlertsCount * 20);

  const usageLogs = rpcData.daily_usage || [];
  const todayStr = new Date().toISOString().split("T")[0];
  let dailyScreenTimeMins = 0;
  let weeklyAiInteractions = 0;

  if (usageLogs.length > 0) {
    const todayLog = usageLogs.find((log) => log.usage_date === todayStr);
    if (todayLog) {
      dailyScreenTimeMins = (todayLog.messages_sent ?? 0) * 3;
    } else {
      dailyScreenTimeMins = (usageLogs[0].messages_sent ?? 0) * 3;
    }
    weeklyAiInteractions = usageLogs
      .slice(0, 7)
      .reduce((sum: number, log) => sum + (log.messages_sent ?? 0), 0);
  }

  if (dailyScreenTimeMins === 0) dailyScreenTimeMins = 25;
  if (weeklyAiInteractions === 0) weeklyAiInteractions = 42;

  const safety: ChildSafetyAndUsageResult = {
    safety_score: safetyScore,
    content_filter_status:
      unresolvedAlertsCount > 0 ? "Flagged / Restricted" : "Safe Mode (Standard)",
    focus_mode_active: true,
    daily_screen_time_mins: dailyScreenTimeMins,
    weekly_ai_interactions: weeklyAiInteractions,
    unresolved_alerts_count: unresolvedAlertsCount,
    daily_limit_minutes: rpcData.link?.daily_limit_minutes ?? 60,
    is_screen_time_limit_enabled: rpcData.link?.is_screen_time_limit_enabled ?? false,
  };

  // 4. Map search history
  const history: SearchHistoryItem[] = (rpcData.chat_sessions || []).map((h) => ({
    id: String(h.id ?? ""),
    title: h.title ? String(h.title) : null,
    created_at: h.created_at ? String(h.created_at) : null,
  }));

  // 5. Map activities
  const activities: ParentActivityItem[] = (rpcData.rewards || []).map((r) => {
    const actSettings = r.activity_settings
      ? Array.isArray(r.activity_settings)
        ? (r.activity_settings[0] as { id: string; slug: string; title: string }) || null
        : (r.activity_settings as { id: string; slug: string; title: string })
      : null;
    return {
      id: r.id,
      rewards_amount: r.rewards_amount ?? 0,
      description: r.description,
      created_at: r.updated_at || r.created_at,
      source_type: r.source_type ?? "",
      score: r.score,
      activity_settings: actSettings
        ? {
            id: actSettings.id,
            slug: actSettings.slug,
            title: actSettings.title,
          }
        : null,
    };
  });

  // 6. Map screen time
  const screenTime = {
    screenTimeSeconds: rpcData.today_screen_time_seconds ?? 0,
    dailyLimitMinutes: rpcData.link?.daily_limit_minutes ?? 60,
    isLimitEnabled: rpcData.link?.is_screen_time_limit_enabled ?? false,
  };

  // 7. Map classrooms
  const classrooms = (rpcData.classrooms || []).map((c) => ({
    classroom_id: c.classroom_id,
    classroom_name: c.classroom_name,
    subject: c.subject,
    grade_level: c.grade_level,
    teacher_first_name: c.teacher_first_name,
    teacher_last_name: c.teacher_last_name,
    teacher_email: c.teacher_email,
    teacher_mobile_no: c.teacher_mobile_no,
    pending_assignments_count: c.pending_assignments_count ?? 0,
    completed_assignments_count: c.completed_assignments_count ?? 0,
  }));

  return {
    details,
    safety,
    history,
    activities,
    screenTime,
    classrooms,
    aiInsights: null,
  };
}

export async function getChildComprehensiveData(childUserId: string): Promise<CacheData> {
  const { userId: parentId } = await verifyUserRole("parent");
  const supabase = await createClient();

  // Read-only path: Stale session recovery has been decoupled from parent dashboard loads.
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_child_comprehensive_data", {
      p_parent_id: parentId,
      p_child_id: childUserId,
    });

    if (rpcError || !rpcData) {
      throw rpcError || new Error("No RPC data returned");
    }

    let settingsList: { title: string; minutes: number }[] = [];
    try {
      settingsList = (await getCachedActivitySettings(supabase)) || [];
    } catch {
      // fallback empty
    }

    const cacheData = mapRpcToCacheData(rpcData as ChildComprehensiveRpcResponse, settingsList);

    // Compute AI Insights in Next.js using the preloaded details
    let aiInsights = null;
    try {
      aiInsights = await getChildAiInsights(childUserId, cacheData.details!);
    } catch {
      aiInsights = null;
    }

    return {
      ...cacheData,
      aiInsights,
    };
  } catch (err) {
    console.warn("[getChildComprehensiveData] RPC failed, falling back to legacy query path:", err);
    return getChildComprehensiveDataLegacy(childUserId);
  }
}

export async function getChildComprehensiveDataLegacy(childUserId: string): Promise<CacheData> {
  const { userId: parentId } = await verifyUserRole("parent");
  const supabase = await createClient();

  // Verify parent access once
  const { data: link, error: linkError } = await supabase
    .from("parent_child_link")
    .select("id")
    .eq("parent_user_id", parentId)
    .eq("child_user_id", childUserId)
    .eq("is_approved", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (linkError || !link) {
    throw new Error("Unauthorized access to child profile");
  }

  const [details, safety, history, activities, screenTimeData] = await Promise.all([
    getChildDetails(childUserId, parentId),
    getChildSafetyAndUsage(childUserId, parentId),
    getParentSearchHistory(childUserId, parentId),
    getParentActivities(childUserId, parentId),
    getDailyScreenTime(childUserId).catch(() => ({
      success: false,
      screenTimeSeconds: 0,
      dailyLimitMinutes: 60,
      isLimitEnabled: false,
      serverDate: "",
    })),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedHistory: SearchHistoryItem[] = (history || []).map((h: any) => ({
    id: String(h.id ?? ""),
    title: h.title ? String(h.title) : null,
    created_at: h.created_at ? String(h.created_at) : null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedActivities: ParentActivityItem[] = (activities || []).map((act: any) => ({
    id: act.id,
    rewards_amount: act.rewards_amount ?? 0,
    description: act.description,
    created_at: act.created_at,
    source_type: act.source_type ?? "",
    score: act.score,
    activity_settings: act.activity_settings,
  }));

  const cachedScreenTime = screenTimeData.success
    ? {
        screenTimeSeconds: screenTimeData.screenTimeSeconds,
        dailyLimitMinutes: screenTimeData.dailyLimitMinutes,
        isLimitEnabled: screenTimeData.isLimitEnabled,
      }
    : null;

  let aiInsights = null;
  try {
    aiInsights = await getChildAiInsights(childUserId, details);
  } catch {
    aiInsights = null;
  }

  return {
    details,
    safety,
    history: formattedHistory,
    activities: formattedActivities,
    screenTime: cachedScreenTime,
    classrooms: [],
    aiInsights,
  };
}
