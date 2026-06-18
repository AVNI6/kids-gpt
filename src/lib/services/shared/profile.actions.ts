"use server";

import { createClient } from "@/lib/supabase/server";
import { uploadUserAvatar } from "@/lib/storage";
import { calculateAge, parseLocalDate } from "@/lib/utils/kid/childAge";
import { createAdminClient } from "@/lib/supabase/admin";

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

  if (!firstName) {
    return { error: "First name is required." };
  }

  if (!dateOfBirth) {
    return { error: "Birthdate is required." };
  }

  const dob = parseLocalDate(dateOfBirth);
  if (isNaN(dob.getTime())) {
    return { error: "Invalid date format for birthdate." };
  }

  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dobDateOnly = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());

  if (dobDateOnly > todayDateOnly) {
    return { error: "Birthdate cannot be in the future." };
  }

  const age = calculateAge(dob, todayDateOnly);
  if (age === null || age < 5) {
    return { error: "You must be at least 5 years old to sign up." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Please sign in again to continue onboarding." };
  }

  const inviteToken = user.user_metadata?.invite_token as string | undefined;

  if (!inviteToken) {
    return { error: "Invitation token is missing. You must be invited by a parent to sign up as a kid." };
  }

  const adminClient = createAdminClient();

  // 1. Fetch the invitation details using admin client (bypassing RLS)
  const { data: invite, error: inviteError } = await adminClient
    .from("child_invitations")
    .select("id, parent_id, invitee_email, expires_at, accepted_at, deleted_at")
    .eq("token", inviteToken)
    .maybeSingle();

  if (inviteError) {
    console.error("[submitKidOnboarding] invite query error:", inviteError.message);
    return { error: "Failed to verify invitation." };
  }

  if (!invite) {
    return { error: "Invitation not found." };
  }

  if (invite.accepted_at) {
    return { error: "This invitation has already been accepted." };
  }

  if (invite.deleted_at) {
    return { error: "This invitation is no longer active." };
  }

  const expiresAt = new Date(invite.expires_at);
  if (expiresAt.getTime() < Date.now()) {
    return { error: "This invitation link has expired." };
  }

  // 2. Security requirement: Validate invitation belongs to the authenticated user
  if (invite.invitee_email.trim().toLowerCase() !== user.email?.trim().toLowerCase()) {
    return { error: "This invitation belongs to a different email address." };
  }

  // 3. Mark the child's profile as onboarded (using admin client to ensure database write success)
  const { error: profileUpdateError } = await adminClient
    .from("profile")
    .update({
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      role: "kid",
      is_onboarded: true,
    })
    .eq("user_id", user.id);

  if (profileUpdateError) {
    console.error("[submitKidOnboarding] profile update error:", profileUpdateError.message);
    return { error: "Failed to update profile details." };
  }

  // 4. Resolve the parent's email from their profile
  const { data: parentProfile, error: parentProfileError } = await adminClient
    .from("profile")
    .select("email")
    .eq("user_id", invite.parent_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (parentProfileError || !parentProfile?.email) {
    console.error("[submitKidOnboarding] parent profile lookup failed:", parentProfileError?.message);
    return { error: "Failed to resolve parent profile." };
  }

  // 5. Create the parent-child relationship using the invitation parent email via RPC
  const { data: linkData, error: linkError } = await adminClient.rpc("link_users_by_email", {
    p_current_user_id: user.id,
    p_target_email: parentProfile.email,
  });

  if (linkError) {
    console.error("[submitKidOnboarding] link users RPC error:", linkError.message);
    return { error: "Failed to establish parent-child relationship." };
  }

  if (linkData?.status !== "success") {
    console.error("[submitKidOnboarding] link users RPC failed status:", linkData?.message);
    return { error: linkData?.message || "Failed to link accounts." };
  }

  // 6. Mark the invitation as accepted
  const { error: acceptError } = await adminClient
    .from("child_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (acceptError) {
    console.error("[submitKidOnboarding] accept invitation status error:", acceptError.message);
  }

  return { success: true, message: "Profile setup complete and automatically linked with parent!", error: null };
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

export async function checkIfEmailExists(email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return false;

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("profile")
    .select("user_id")
    .eq("email", cleanEmail)
    .maybeSingle();

  if (error) {
    console.error("Error in checkIfEmailExists server action:", error);
    return false;
  }

  return !!data;
}
