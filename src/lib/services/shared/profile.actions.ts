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
  const parentEmail = String(formData.get("parentEmail") ?? "")
    .trim()
    .toLowerCase();

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

  const { error: profileUpdateError } = await supabase
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
    return { error: profileUpdateError.message };
  }

  let linkMessage = "Profile setup complete!";

  // ─── Auto-link via invite token (stored in user metadata at sign-up) ───────
  // This is the primary path for invited kids. More reliable than email lookup
  // because it matches the exact token used in the invite link.
  const inviteToken = user.user_metadata?.invite_token as string | undefined;

  console.log("[submitKidOnboarding] user.id:", user.id);
  console.log("[submitKidOnboarding] user.email:", user.email);
  console.log("[submitKidOnboarding] invite_token from metadata:", inviteToken ?? "NONE");
  console.log("[submitKidOnboarding] parentEmail from form:", parentEmail || "EMPTY");

  if (inviteToken) {
    // Lookup the invitation directly by token
    const { data: invite, error: inviteError } = await supabase
      .from("child_invitations")
      .select("id, parent_id")
      .eq("token", inviteToken)
      .is("accepted_at", null)
      .is("deleted_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    console.log("[submitKidOnboarding] invite lookup result:", JSON.stringify(invite));
    if (inviteError) {
      console.error("[submitKidOnboarding] invite lookup error:", inviteError.message);
    }

    if (invite?.parent_id) {
      // Get parent's email from their profile
      const { data: parentProfile, error: parentProfileError } = await supabase
        .from("profile")
        .select("email")
        .eq("user_id", invite.parent_id)
        .maybeSingle();

      console.log("[submitKidOnboarding] parent profile:", JSON.stringify(parentProfile));
      if (parentProfileError) {
        console.error("[submitKidOnboarding] parent profile error:", parentProfileError.message);
      }

      if (parentProfile?.email) {
        // Call link_users_by_email RPC
        const { data: linkData, error: linkError } = await supabase.rpc("link_users_by_email", {
          p_current_user_id: user.id,
          p_target_email: parentProfile.email,
        });

        console.log("[submitKidOnboarding] link RPC result:", JSON.stringify(linkData));
        if (linkError) {
          console.error("[submitKidOnboarding] link RPC error:", linkError.message);
        }

        if (linkData?.status === "success") {
          // Mark invitation as accepted
          const { error: acceptError } = await supabase
            .from("child_invitations")
            .update({ accepted_at: new Date().toISOString() })
            .eq("id", invite.id);

          if (acceptError) {
            console.error("[submitKidOnboarding] accept invitation error:", acceptError.message);
          }

          linkMessage = "Profile setup complete and automatically linked with parent!";
          console.log("[submitKidOnboarding] ✅ Auto-linked successfully!");
        } else {
          console.warn("[submitKidOnboarding] RPC did not return success:", linkData?.message);
        }
      }
    }
  } else if (parentEmail) {
    // ─── Fallback: manual parent email entered in the form ──────────────────
    console.log("[submitKidOnboarding] trying manual parentEmail path:", parentEmail);

    const { data: linkData, error: linkError } = await supabase.rpc("link_users_by_email", {
      p_current_user_id: user.id,
      p_target_email: parentEmail,
    });

    console.log("[submitKidOnboarding] manual link RPC result:", JSON.stringify(linkData));

    if (linkError) {
      console.error("[submitKidOnboarding] manual link RPC error:", linkError.message);
      // Non-fatal — profile is already updated, don't block success
    } else if (linkData?.status === "success") {
      linkMessage = linkData.message ?? "Linked with parent!";
    } else {
      console.warn("[submitKidOnboarding] manual link did not succeed:", linkData?.message);
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
