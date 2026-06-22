"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { calculateActivityAnalytics } from "@/lib/utils/activity-analytics";
import { createChildInvitation } from "@/lib/services/shared/invitations";
import { getFullActivitySettings } from "./activities/xp-settings.actions";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { uploadUserAvatar } from "@/lib/storage";
import type { UserRole } from "@/types/user";
import type {
  DashboardUserProfile,
  KidDashboardStats,
  ChildActivityLog,
  ChildDetailsResult,
} from "@/types/kid";

type VerifiedUser = {
  userId: string;
  profile: DashboardUserProfile;
};

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
      }
    | {
        id: string;
        slug: string;
        title: string;
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

async function getSupabaseClient() {
  return createClient();
}

export const verifyUserRole = cache(async (allowedRole?: UserRole): Promise<VerifiedUser> => {
  const supabase = await getSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select(
      "user_id, email, first_name, last_name, username, avatar_url, role, standard, mobile_no, date_of_birth, total_experience_points, current_streak, longest_streak"
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle<DashboardUserProfile>();

  if (profileError || !profile || !profile.role) {
    throw new Error("Unauthorized");
  }

  if (allowedRole && profile.role !== allowedRole) {
    throw new Error("Unauthorized");
  }

  return {
    userId: user.id,
    profile,
  };
});

export async function getKidStats(): Promise<KidDashboardStats> {
  const { profile } = await verifyUserRole("kid");

  return {
    first_name: profile.first_name,
    last_name: profile.last_name,
    avatar_url: profile.avatar_url,
    date_of_birth: profile.date_of_birth,
    total_experience_points: profile.total_experience_points ?? 0,
    current_streak: profile.current_streak ?? 0,
    longest_streak: profile.longest_streak ?? 0,
  };
}

export async function getCurrentDashboardProfile(): Promise<DashboardUserProfile> {
  const { profile } = await verifyUserRole();
  return profile;
}

async function uploadAvatarForUser(
  supabase: SupabaseClient,
  userId: string,
  avatarField: FormDataEntryValue | null
) {
  if (!(avatarField instanceof File) || avatarField.size === 0) {
    return undefined;
  }

  const result = await uploadUserAvatar(supabase, userId, avatarField);
  if (!result.success || !result.publicUrl) {
    throw new Error(result.error || "Failed to upload avatar.");
  }

  return result.publicUrl;
}

export async function updateProfileFields(options: {
  allowedRole: UserRole;
  formData: FormData;
  organizationFieldName?: string;
  revalidateTarget: string;
}): Promise<ProfileUpdateResult> {
  const { userId } = await verifyUserRole(options.allowedRole);
  const supabase = await getSupabaseClient();

  const firstName = String(
    options.formData.get("first_name") ?? options.formData.get("firstName") ?? ""
  ).trim();
  const lastName = String(
    options.formData.get("last_name") ?? options.formData.get("lastName") ?? ""
  ).trim();
  const organization = String(
    options.formData.get(options.organizationFieldName ?? "organization") ??
      options.formData.get("organizationName") ??
      options.formData.get("organization") ??
      ""
  ).trim();
  const avatarField = options.formData.get("avatar");

  if (!firstName) {
    return { error: "First name is required." };
  }

  let avatarUrl: string | undefined;

  if (avatarField instanceof File && avatarField.size > 0) {
    avatarUrl = await uploadAvatarForUser(supabase, userId, avatarField);
  }

  const updatePayload: {
    first_name: string;
    last_name: string | null;
    avatar_url?: string | null;
    standard?: string | null;
  } = {
    first_name: firstName,
    last_name: lastName || null,
  };

  if (typeof avatarUrl !== "undefined") {
    updatePayload.avatar_url = avatarUrl;
  }

  if (organization) {
    updatePayload.standard = organization;
  }

  const { error: updateError } = await supabase
    .from("profile")
    .update(updatePayload)
    .eq("user_id", userId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath(options.revalidateTarget);

  return { error: null };
}

export async function linkByEmail(targetEmail: string): Promise<EmailLinkResult> {
  const email = targetEmail.trim().toLowerCase();

  if (!email) {
    return { status: "error", message: "Email is required." };
  }

  const { profile } = await verifyUserRole();
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase.rpc("link_users_by_email", {
    p_current_user_id: profile.user_id,
    p_target_email: email,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  const result = data as EmailLinkResult | null;

  if (!result || typeof result.status !== "string") {
    return { status: "error", message: "Unexpected response from email linking RPC." };
  }

  if (result.status === "pending" && profile.role === "parent") {
    const inviteResult = await createChildInvitation(email, profile.user_id);
    if (!inviteResult.success) {
      return {
        status: "error",
        message: inviteResult.error || "Failed to create invitation link.",
      };
    }
    revalidatePath("/dashboard/parent");
    return { status: "pending", message: inviteResult.message || "Invitation sent successfully." };
  }

  if (result.status === "success" || result.status === "pending") {
    revalidatePath(profile.role === "teacher" ? "/dashboard/teacher" : "/dashboard/parent");
  }

  return result;
}

export async function updateTeacherProfile(formData: FormData): Promise<ProfileUpdateResult> {
  return updateProfileFields({
    allowedRole: "teacher",
    formData,
    organizationFieldName: "organizationName",
    revalidateTarget: "/dashboard/teacher",
  });
}

export async function getKidComprehensiveDetails(): Promise<ChildDetailsResult> {
  const { userId } = await verifyUserRole("kid");
  const supabase = await getSupabaseClient();

  // 1. Fetch kid profile
  const { data: childProfile, error: childError } = await supabase
    .from("profile")
    .select("total_experience_points, current_streak, longest_streak")
    .eq("user_id", userId)
    .maybeSingle();

  if (childError || !childProfile) {
    throw new Error("Kid profile not found");
  }

  // 2. Fetch rewards (activities)
  const { data: rewards, error: rewardsError } = await supabase
    .from("rewards")
    .select(
      "id, rewards_amount, description, created_at, updated_at, source_type, score, activity_settings(id, slug, title)"
    )
    .eq("user_id", userId)
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
          }
        : null,
    };
  });

  const totalCompleted = timeline.length;
  const totalXp = childProfile.total_experience_points ?? 0;

  const currentStreak = childProfile.current_streak ?? 0;
  const longestStreak = childProfile.longest_streak ?? 0;

  // 3. Calculate metrics and subject focus using the activity-analytics utility
  let settingsList: { title: string; minutes: number }[] = [];
  try {
    settingsList = await getFullActivitySettings();
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
    quiz_accuracy: quizAccuracy,
    subject_mastery: subjectMastery,
    timeline,
  };
}

export async function createParentNotification(
  childUserId: string,
  type: string,
  title: string,
  message: string,
  metadata: Record<string, unknown> = {}
) {
  const supabase = await getSupabaseClient();

  // 1. Retrieve the authenticated user session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  // 2. Verify caller identity / parent relationship
  if (user.id !== childUserId) {
    const { data: link } = await supabase
      .from("parent_child_link")
      .select("id")
      .eq("parent_user_id", user.id)
      .eq("child_user_id", childUserId)
      .eq("is_approved", true)
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (!link) {
      return { success: false, error: "Unauthorized notification trigger" };
    }
  }

  const { data: links, error: linkError } = await supabase
    .from("parent_child_link")
    .select("parent_user_id")
    .eq("child_user_id", childUserId)
    .eq("is_approved", true)
    .is("deleted_at", null);

  if (linkError || !links || links.length === 0) {
    return { success: false, error: "No linked parent found" };
  }

  for (const link of links) {
    try {
      await supabase.from("parent_notifications").insert({
        parent_id: link.parent_user_id,
        child_id: childUserId,
        type,
        title,
        message,
        metadata,
      });
    } catch (err) {
      console.warn("Failed to insert notification inside action:", err);
    }
  }
  return { success: true };
}
