"use server";

import { createClient } from "@/lib/supabase/server";
import { uploadUserAvatar } from "@/lib/storage";

export type KidOnboardingState = {
  error: string | null;
  success?: boolean;
  message?: string | null;
};

export type ParentOnboardingState = {
  error: string | null;
  success?: boolean;
  message?: string | null;
};

export type TeacherOnboardingState = {
  error: string | null;
  success?: boolean;
  message?: string | null;
};

export type AvatarUploadState = {
  avatarUrl: string | null;
  error: string | null;
};

export async function uploadAvatar(formData: FormData) {
  const avatarField = formData.get("avatar");

  if (!(avatarField instanceof File) || avatarField.size === 0) {
    throw new Error("Please select an avatar image.");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized.");
  }

  // Use the centralized storage layer helper
  const uploadResult = await uploadUserAvatar(supabase, user.id, avatarField);

  if (!uploadResult.success || !uploadResult.publicUrl) {
    throw new Error(uploadResult.error || "Failed to upload avatar.");
  }

  const avatarUrl = uploadResult.publicUrl;

  const { error: updateError } = await supabase
    .from("profile")
    .update({ avatar_url: avatarUrl })
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { avatarUrl };
}

export async function submitKidOnboarding(
  _previousState: KidOnboardingState,
  formData: FormData
): Promise<KidOnboardingState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();
  const parentEmail = String(formData.get("parentEmail") ?? "")
    .trim()
    .toLowerCase();

  if (!firstName) {
    return { error: "First name is required." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Please sign in again to continue onboarding." };
  }

  const { error: profileUpdateError } = await supabase
    .from("profile")
    .update({
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      is_onboarded: true,
    })
    .eq("user_id", user.id);

  if (profileUpdateError) {
    return { error: profileUpdateError.message };
  }

  let linkMessage = "Profile setup complete!";

  if (parentEmail) {
    const { data: linkData, error: linkError } = await supabase.rpc("link_users_by_email", {
      p_current_user_id: user.id,
      p_target_email: parentEmail,
    });

    if (linkError) {
      return { error: linkError.message };
    }

    if (linkData?.status === "error" || linkData?.status === "pending") {
      return { error: linkData.message };
    }

    if (linkData?.message) {
      linkMessage = linkData.message;
    }
  }

  return { success: true, message: linkMessage, error: null };
}

export async function submitParentOnboarding(
  _previousState: ParentOnboardingState,
  formData: FormData
): Promise<ParentOnboardingState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const childEmail = String(formData.get("childEmail") ?? "")
    .trim()
    .toLowerCase();

  if (!firstName) {
    return { error: "First name is required." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Please sign in again to continue onboarding." };
  }

  const { error: profileUpdateError } = await supabase
    .from("profile")
    .update({
      first_name: firstName,
      last_name: lastName,
      is_onboarded: true,
    })
    .eq("user_id", user.id);

  if (profileUpdateError) {
    return { error: "Profile update failed." };
  }

  let linkMessage = "Profile setup complete!";

  if (childEmail) {
    const { data: linkData, error: linkError } = await supabase.rpc("link_users_by_email", {
      p_current_user_id: user.id,
      p_target_email: childEmail,
    });

    if (linkError) {
      return { error: linkError.message };
    }

    if (linkData?.status === "error" || linkData?.status === "pending") {
      return { error: linkData.message };
    }

    if (linkData?.message) {
      linkMessage = linkData.message;
    }
  }

  return { success: true, message: linkMessage, error: null };
}

export async function submitTeacherOnboarding(
  _previousState: TeacherOnboardingState,
  formData: FormData
): Promise<TeacherOnboardingState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const organizationName = String(formData.get("organizationName") ?? "").trim();

  const studentEmail = String(formData.get("studentEmail") ?? "")
    .trim()
    .toLowerCase();

  if (!firstName) {
    return { error: "First name is required." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Please sign in again to continue onboarding." };
  }

  const { error: profileUpdateError } = await supabase
    .from("profile")
    .update({
      first_name: firstName,
      last_name: lastName,
      standard: organizationName,
      is_onboarded: true,
    })
    .eq("user_id", user.id);

  if (profileUpdateError) {
    return { error: "Profile update failed." };
  }

  let linkMessage = "Profile setup complete!";

  if (studentEmail) {
    const { data: linkData, error: linkError } = await supabase.rpc("link_users_by_email", {
      p_current_user_id: user.id,
      p_target_email: studentEmail,
    });

    if (linkError) {
      return { error: linkError.message };
    }

    if (linkData?.status === "error" || linkData?.status === "pending") {
      return { error: linkData.message };
    }

    if (linkData?.message) {
      linkMessage = linkData.message;
    }
  }

  return { success: true, message: linkMessage, error: null };
}

export type ProfileUpdateState = {
  error: string | null;
  success?: boolean;
  message?: string | null;
};

export async function updateUserProfile(
  _previousState: ProfileUpdateState,
  formData: FormData
): Promise<ProfileUpdateState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();

  if (!firstName) {
    return { error: "First name is required." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Please sign in again to edit your profile." };
  }

  const { error: profileUpdateError } = await supabase
    .from("profile")
    .update({
      first_name: firstName,
      last_name: lastName,
    })
    .eq("user_id", user.id);

  if (profileUpdateError) {
    return { error: "Profile update failed: " + profileUpdateError.message };
  }

  return { success: true, message: "Profile updated successfully!", error: null };
}
