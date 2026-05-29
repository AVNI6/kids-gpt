"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getLocalDateString } from "@/lib/utils";
import type { UserRole } from "@/types/auth";
import type {
  DashboardUserProfile,
  KidDashboardStats,
  LinkedStudentProfile,
  ChildActivityLog,
  ChildDetailsResult,
} from "@/types/dashboard.types";

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

function calculateDisplayStreak(
  dbStreak: number,
  lastRewardCreatedAt: string | null,
  timezone: string = "Asia/Kolkata"
): number {
  if (!lastRewardCreatedAt || dbStreak === 0) {
    return 0;
  }

  const todayStr = getLocalDateString(new Date(), timezone);
  const lastDateStr = getLocalDateString(new Date(lastRewardCreatedAt), timezone);

  if (lastDateStr === todayStr) {
    return dbStreak;
  }

  const lastDate = new Date(lastDateStr + "T12:00:00");
  const todayDate = new Date(todayStr + "T12:00:00");
  const diffTime = todayDate.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) {
    return dbStreak;
  }

  return 0;
}

async function verifyUserRole(allowedRole?: UserRole): Promise<VerifiedUser> {
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
      "user_id, email, first_name, last_name, username, avatar_url, role, standard, date_of_birth, total_experience_points, current_streak, longest_streak"
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
}

export async function getKidStats(timezone: string = "Asia/Kolkata"): Promise<KidDashboardStats> {
  const { userId, profile } = await verifyUserRole("kid");
  const supabase = await getSupabaseClient();

  // Query the latest activity reward for this kid to calculate streak
  const { data: lastRewards } = await supabase
    .from("rewards")
    .select("created_at")
    .eq("user_id", userId)
    .not("source_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  const lastRewardTime = lastRewards && lastRewards.length > 0 ? lastRewards[0].created_at : null;
  const currentStreak = calculateDisplayStreak(
    profile.current_streak ?? 0,
    lastRewardTime,
    timezone
  );

  return {
    first_name: profile.first_name,
    last_name: profile.last_name,
    avatar_url: profile.avatar_url,
    date_of_birth: profile.date_of_birth,
    total_experience_points: profile.total_experience_points ?? 0,
    current_streak: currentStreak,
    longest_streak: profile.longest_streak ?? 0,
  };
}

export async function getCurrentDashboardProfile(): Promise<DashboardUserProfile> {
  const { profile } = await verifyUserRole();
  return profile;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function uploadAvatarForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  avatarField: FormDataEntryValue | null
) {
  if (!(avatarField instanceof File) || avatarField.size === 0) {
    return undefined;
  }

  if (!avatarField.type.startsWith("image/")) {
    throw new Error("Avatar must be an image file.");
  }

  const fileNameParts = avatarField.name.split(".");
  const fileExtension = fileNameParts.length > 1 ? fileNameParts.pop() : "png";
  const baseName = sanitizeFileName(fileNameParts.join(".") || "avatar");
  const filePath = `avatars/${userId}/${Date.now()}-${baseName}.${fileExtension || "png"}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, avatarField, {
      contentType: avatarField.type,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
  return publicUrlData.publicUrl;
}

async function updateProfileFields(options: {
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

export async function updateKidProfile(formData: FormData) {
  const { userId } = await verifyUserRole("kid");
  const supabase = await getSupabaseClient();

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastNameRaw = String(formData.get("last_name") ?? "").trim();
  const dateOfBirthRaw = String(formData.get("date_of_birth") ?? "").trim();
  const avatarField = formData.get("avatar");

  if (!firstName) {
    throw new Error("First name is required.");
  }

  let avatarUrl: string | null | undefined;

  if (avatarField instanceof File && avatarField.size > 0) {
    if (!avatarField.type.startsWith("image/")) {
      throw new Error("Avatar must be an image file.");
    }

    const fileNameParts = avatarField.name.split(".");
    const fileExtension = fileNameParts.length > 1 ? fileNameParts.pop() : "png";
    const baseName = sanitizeFileName(fileNameParts.join(".") || "avatar");
    const filePath = `avatars/${userId}/${Date.now()}-${baseName}.${fileExtension || "png"}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarField, {
        contentType: avatarField.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    avatarUrl = publicUrlData.publicUrl;
  }

  const updatePayload: {
    first_name: string;
    last_name: string | null;
    date_of_birth: string | null;
    avatar_url?: string | null;
  } = {
    first_name: firstName,
    last_name: lastNameRaw || null,
    date_of_birth: dateOfBirthRaw || null,
  };

  if (typeof avatarUrl !== "undefined") {
    updatePayload.avatar_url = avatarUrl;
  }

  const { error: updateError } = await supabase
    .from("profile")
    .update(updatePayload)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/dashboard/kid");

  const { data: profile, error: profileError } = await supabase
    .from("profile")
    .select(
      "user_id, email, first_name, last_name, username, avatar_url, role, date_of_birth, total_experience_points, current_streak, longest_streak"
    )
    .eq("user_id", userId)
    .maybeSingle<DashboardUserProfile>();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return profile;
}

export async function getLinkedStudents(): Promise<LinkedStudentProfile[]> {
  const { userId } = await verifyUserRole("teacher");
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("teacher_student_links")
    .select(
      `
        student_profile:profile!teacher_student_links_student_user_id_fkey (
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
    .eq("teacher_user_id", userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data as Array<{ student_profile: LinkedStudentProfile[] | null }> | null) ?? [])
    .flatMap((row) => row.student_profile ?? [])
    .filter((profile): profile is LinkedStudentProfile => Boolean(profile));
}

export async function saveKidActivityProgress(
  activitySlug: string,
  xpEarned: number,
  activityTitle: string,
  score?: string,
  timezone: string = "Asia/Kolkata"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await verifyUserRole("kid");
    const supabase = await getSupabaseClient();

    // 1. Attempt to execute the atomic database RPC function first
    const { data: rpcData, error: rpcError } = await supabase.rpc("save_kid_activity_progress", {
      p_user_id: userId,
      p_activity_slug: activitySlug,
      p_activity_title: activityTitle,
      p_score_str: score || null,
      p_timezone: timezone,
    });

    // Check if RPC was successful
    if (
      !rpcError &&
      rpcData &&
      typeof rpcData === "object" &&
      "success" in rpcData &&
      (rpcData as import("@/types/json").JsonObject).success === true
    ) {
      try {
        const { data: prof } = await supabase
          .from("profile")
          .select("first_name")
          .eq("user_id", userId)
          .maybeSingle();
        const kidName = prof?.first_name || "Your child";

        // Query the latest reward for the kid to get its ID
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

    // 2. Client-side Fallback (in case migration is not fully deployed or has temporary failure)
    // Securely query dynamic XP settings from DB, falling back to the client-provided parameter
    let actualXp = xpEarned;
    const { data: activitySetting } = await supabase
      .from("activity_settings")
      .select("id, slug, title, xp_reward")
      .eq("slug", activitySlug)
      .maybeSingle();

    if (activitySetting?.xp_reward) {
      actualXp = activitySetting.xp_reward;
    }

    // Parse score percentage if available (e.g. "80%" -> 80)
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

    // Apply score-based XP scaling (100% correct score = full XP, else proportional)
    if (parsedScore !== null) {
      if (parsedScore === 100) {
        // Full XP points
      } else {
        actualXp = Math.round(actualXp * (parsedScore / 100));
      }
    }
    actualXp = Math.max(0, actualXp);

    // Fetch current profile stats for streak computation
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("total_experience_points, current_streak, longest_streak")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      return { success: false, error: "Profile not found." };
    }

    // Query the latest activity reward for this kid to calculate streak
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
      // First activity
      currentStreak = 1;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // Insert reward record with dynamic XP, description, and score column
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

    // Update profile with dynamic XP and streaks
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

export async function getKidComprehensiveDetails(
  timezone: string = "Asia/Kolkata"
): Promise<ChildDetailsResult> {
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

  const lastRewardTime = rewards && rewards.length > 0 ? rewards[0].created_at : null;
  const currentStreak = calculateDisplayStreak(
    childProfile.current_streak ?? 0,
    lastRewardTime,
    timezone
  );
  const longestStreak = childProfile.longest_streak ?? 0;

  // 3. Calculate Subject Mastery based on activity title keywords
  let mathCount = 0;
  let scienceCount = 0;
  let englishCount = 0;
  let codingCount = 0;

  timeline.forEach((item) => {
    const desc = (item.description ?? "").toLowerCase();
    if (desc.includes("math") || desc.includes("arithmetic") || desc.includes("number")) {
      mathCount++;
    } else if (desc.includes("science") || desc.includes("nature") || desc.includes("space")) {
      scienceCount++;
    } else if (
      desc.includes("english") ||
      desc.includes("spelling") ||
      desc.includes("word") ||
      desc.includes("grammar")
    ) {
      englishCount++;
    } else if (
      desc.includes("coding") ||
      desc.includes("programming") ||
      desc.includes("logic") ||
      desc.includes("puzzle")
    ) {
      codingCount++;
    } else {
      codingCount++;
    }
  });

  const subjectMastery = {
    math: Math.min(100, 20 + mathCount * 20),
    science: Math.min(100, 20 + scienceCount * 20),
    english: Math.min(100, 20 + englishCount * 20),
    coding: Math.min(100, 20 + codingCount * 20),
  };

  let learningTimeMins = 0;
  try {
    const { data: settings } = await supabase.from("activity_settings").select("title, minutes");

    const settingsList = settings ?? [];

    timeline.forEach((item) => {
      const desc = item.description ?? "";
      const matchedSetting = settingsList.find((s) =>
        desc.toLowerCase().includes(s.title.toLowerCase())
      );
      if (matchedSetting) {
        learningTimeMins += matchedSetting.minutes;
      } else {
        learningTimeMins += 10;
      }
    });
  } catch {
    learningTimeMins = totalCompleted * 10;
  }

  if (totalCompleted > 0) {
    learningTimeMins += 15;
  }

  let totalScore = 0;
  let scoreCount = 0;
  timeline.forEach((item) => {
    const match = (item.description ?? "").match(/Score:\s*(\d+)%/i);
    if (match && match[1]) {
      totalScore += parseInt(match[1], 10);
      scoreCount++;
    }
  });
  const quizAccuracy =
    scoreCount > 0 ? Math.round(totalScore / scoreCount) : totalCompleted > 0 ? 88 : 0;

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
