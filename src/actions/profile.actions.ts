"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type KidOnboardingState = {
  error: string | null;
};

export type ParentOnboardingState = {
  error: string | null;
};

export type TeacherOnboardingState = {
  error: string | null;
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

  if (!avatarField.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized.");
  }

  const fileNameParts = avatarField.name.split(".");
  const fileExtension = fileNameParts.length > 1 ? fileNameParts.pop() : "png";
  const filePath = `avatars/${user.id}/${Date.now()}.${fileExtension || "png"}`;

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
  const avatarUrl = publicUrlData.publicUrl;

  const { error: updateError } = await supabase
    .from("profile")
    .update({ avatar_url: avatarUrl })
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { avatarUrl };
}

export async function setProfileAvatar(
  _previousState: AvatarUploadState,
  formData: FormData
): Promise<AvatarUploadState> {
  try {
    const { avatarUrl } = await uploadAvatar(formData);
    return { avatarUrl, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Avatar upload failed.";
    return { avatarUrl: null, error: message };
  }
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

  if (!firstName || !lastName || !dateOfBirth || !parentEmail) {
    return { error: "Please fill in all required fields." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Please sign in again to continue onboarding." };
  }

  const { data: parentProfile, error: parentLookupError } = await supabase
    .from("profile")
    .select("user_id, role")
    .eq("email", parentEmail)
    .eq("role", "parent")
    .maybeSingle();

  if (parentLookupError) {
    return { error: parentLookupError.message };
  }

  if (!parentProfile?.user_id) {
    return { error: "Parent account not found for that email." };
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

  const { error: removeExistingLinkError } = await supabase
    .from("parent_child_link")
    .delete()
    .eq("child_user_id", user.id);

  if (removeExistingLinkError) {
    return { error: removeExistingLinkError.message };
  }

  const { error: linkInsertError } = await supabase.from("parent_child_link").insert({
    parent_user_id: parentProfile.user_id,
    child_user_id: user.id,
    is_approved: true,
  });

  if (linkInsertError) {
    return { error: linkInsertError.message };
  }

  redirect("/dashboard/kid");
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

  if (!firstName || !lastName) {
    return { error: "First name and last name are required." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

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
    return { error: profileUpdateError.message };
  }

  let childNotFound = false;

  if (childEmail) {
    const { data: childProfile, error: childLookupError } = await supabase
      .from("profile")
      .select("user_id, role")
      .eq("email", childEmail)
      .eq("role", "kid")
      .maybeSingle();

    if (childLookupError) {
      return { error: childLookupError.message };
    }

    if (!childProfile?.user_id) {
      childNotFound = true;
    } else {
      await supabase
        .from("parent_child_link")
        .delete()
        .eq("parent_user_id", user.id)
        .eq("child_user_id", childProfile.user_id);

      const { error: linkInsertError } = await supabase.from("parent_child_link").insert({
        parent_user_id: user.id,
        child_user_id: childProfile.user_id,
        is_approved: true,
      });

      if (linkInsertError) {
        return { error: linkInsertError.message };
      }
    }
  }

  if (childNotFound) {
    redirect("/dashboard/parent?warning=child-not-found");
  }

  redirect("/dashboard/parent");
}

export async function submitTeacherOnboarding(
  _previousState: TeacherOnboardingState,
  formData: FormData
): Promise<TeacherOnboardingState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const organizationName = String(formData.get("organizationName") ?? "").trim();

  if (!firstName || !lastName || !organizationName) {
    return { error: "First name, last name, and organization/school name are required." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

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
    return { error: profileUpdateError.message };
  }

  redirect("/dashboard/teacher");
}
