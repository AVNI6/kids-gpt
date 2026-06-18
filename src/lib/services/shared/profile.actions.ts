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
      is_onboarded: true,
    })
    .eq("user_id", user.id);

  if (profileUpdateError) {
    return { error: profileUpdateError.message };
  }

  let linkMessage = "Profile setup complete!";

  // Check if there is an active child invitation for the child's email
  const { data: invite, error: inviteError } = await supabase
    .from("child_invitations")
    .select("id, parent_id")
    .eq("invitee_email", user.email)
    .is("accepted_at", null)
    .is("deleted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (inviteError) {
    console.error("Error querying active child invitation:", inviteError.message);
  }

  if (invite) {
    // 1. Get the parent's email address from their profile using parent_id
    const { data: parentProfile, error: parentProfileError } = await supabase
      .from("profile")
      .select("email")
      .eq("user_id", invite.parent_id)
      .maybeSingle();

    if (parentProfileError || !parentProfile?.email) {
      console.error("Error fetching parent profile for auto-linking:", parentProfileError?.message);
    } else {
      // 2. Call link_users_by_email to automatically link parent and child
      const { data: linkData, error: linkError } = await supabase.rpc("link_users_by_email", {
        p_current_user_id: user.id,
        p_target_email: parentProfile.email,
      });

      if (linkError) {
        console.error("Error auto-linking parent-child:", linkError.message);
      } else if (linkData?.status === "success") {
        // 3. Mark the invitation as accepted
        const { error: acceptError } = await supabase
          .from("child_invitations")
          .update({ accepted_at: new Date().toISOString() })
          .eq("id", invite.id);

        if (acceptError) {
          console.error("Error updating accepted_at for invitation:", acceptError.message);
        }

        linkMessage = "Profile setup complete and automatically linked with parent!";
      }
    }
  } else if (parentEmail) {
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
