"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";
import type {
  DashboardUserProfile,
  KidDashboardStats,
  LinkedChildProfile,
  LinkedStudentProfile,
} from "@/types/dashboard.types";

type VerifiedUser = {
  userId: string;
  profile: DashboardUserProfile;
};

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
      "user_id, first_name, last_name, username, avatar_url, role, standard, date_of_birth, total_experience_points, current_streak, longest_streak"
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

  const supabase = await getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { status: "error", message: "Unauthorized" };
  }

  // Get current user's profile to determine role
  const { data: currentProfile, error: currentProfileError } = await supabase
    .from("profile")
    .select("user_id, role")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle<{ user_id: string; role: UserRole }>();

  if (currentProfileError || !currentProfile) {
    return { status: "error", message: "Unable to determine current user role." };
  }

  // If current user is a teacher, handle teacher-student linking
  if (currentProfile.role === "teacher") {
    // Query for target student profile by email
    const { data: targetUsers, error: targetError } = await supabase
      .from("profile")
      .select("user_id, role")
      .eq("email", email)
      .is("deleted_at", null);

    if (targetError) {
      return { status: "error", message: targetError.message };
    }

    const targetUser = targetUsers?.[0];

    if (!targetUser) {
      return { status: "error", message: "User with this email not found." };
    }

    // Verify target is a student/kid
    if (targetUser.role !== "kid") {
      return { status: "error", message: "Can only link students (kids)." };
    }

    // Check if link already exists
    const { data: existingLink, error: existingError } = await supabase
      .from("teacher_student_links")
      .select("id")
      .eq("teacher_user_id", user.id)
      .eq("student_user_id", targetUser.user_id)
      .maybeSingle();

    if (existingError) {
      return { status: "error", message: existingError.message };
    }

    if (existingLink) {
      return { status: "error", message: "This student is already linked." };
    }

    // Insert into teacher_student_links with status 'active'
    const { error: insertError } = await supabase.from("teacher_student_links").insert({
      teacher_user_id: user.id,
      student_user_id: targetUser.user_id,
      status: "active",
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      return { status: "error", message: insertError.message };
    }

    revalidatePath("/dashboard/teacher");
    return { status: "success", message: "Student linked successfully!" };
  }

  // For parent/kid, use the existing RPC
  const { data, error } = await supabase.rpc("link_users_by_email", {
    p_current_user_id: user.id,
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
    revalidatePath("/dashboard/parent");
  }

  return result;
}

export async function updateParentProfile(formData: FormData): Promise<ProfileUpdateResult> {
  return updateProfileFields({
    allowedRole: "parent",
    formData,
    organizationFieldName: "organizationName",
    revalidateTarget: "/dashboard/parent",
  });
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
      "user_id, first_name, last_name, username, avatar_url, role, date_of_birth, total_experience_points, current_streak, longest_streak"
    )
    .eq("user_id", userId)
    .maybeSingle<DashboardUserProfile>();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return profile;
}

export async function getLinkedChildren(): Promise<LinkedChildProfile[]> {
  const { userId } = await verifyUserRole("parent");
  const supabase = await getSupabaseClient();

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
          longest_streak
        )
      `
    )
    .eq("parent_user_id", userId)
    .eq("is_approved", true)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data as Array<{ child_profile: LinkedChildProfile[] | null }> | null) ?? [])
    .flatMap((row) => row.child_profile ?? [])
    .filter((profile): profile is LinkedChildProfile => Boolean(profile));
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
          longest_streak
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
