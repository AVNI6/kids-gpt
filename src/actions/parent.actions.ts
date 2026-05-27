"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResponse = {
  success: boolean;
  error?: string | null;
  message?: string | null;
};

/**
 * Verifies that the currently logged-in user is authenticated and has the role of 'parent'.
 * Returns the parent's user.id if successful, otherwise throws an error.
 */
async function verifyParentRole() {
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

  if (profileError || !profile || profile.role !== "parent") {
    throw new Error("Access denied. Only parents can access these management features.");
  }

  return user.id;
}

/**
 * Performs a soft delete on the parent-child linkage by setting `is_active = false` and `deleted_at = NOW()`.
 */
export async function softDeleteChildConnection(childUserId: string): Promise<ActionResponse> {
  try {
    const parentId = await verifyParentRole();
    const supabase = await createClient();

    // Check if the link exists
    const { data: link, error: fetchError } = await supabase
      .from("parent_child_link")
      .select("is_approved")
      .eq("parent_user_id", parentId)
      .eq("child_user_id", childUserId)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError || !link) {
      return { success: false, error: "Link between parent and child not found." };
    }

    // Update parent_child_link: set is_active = false, deleted_at = NOW()
    const { error: updateError } = await supabase
      .from("parent_child_link")
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq("parent_user_id", parentId)
      .eq("child_user_id", childUserId);

    if (updateError) {
      console.error("[softDeleteChildConnection] Database error:", updateError);
      return { success: false, error: "Failed to remove the child connection." };
    }

    revalidatePath("/dashboard/parent");
    return { success: true, message: "Child removed successfully!" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Safely updates a child's profile details.
 * Verifies that the parent is actively linked to the child.
 */
export async function updateChildProfile(
  childUserId: string,
  data: {
    firstName: string;
    lastName: string;
    standard?: string;
    avatarUrl?: string;
  }
): Promise<ActionResponse> {
  try {
    const parentId = await verifyParentRole();
    const supabase = await createClient();

    // Verify parent-child connection is active and approved
    const { data: link, error: linkError } = await supabase
      .from("parent_child_link")
      .select("is_active, is_approved")
      .eq("parent_user_id", parentId)
      .eq("child_user_id", childUserId)
      .eq("is_active", true)
      .eq("is_approved", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (linkError || !link) {
      return { success: false, error: "No active approved link exists for this child." };
    }

    // Update child profile in the profile table
    const { error: updateError } = await supabase
      .from("profile")
      .update({
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        standard: data.standard?.trim() || null,
        avatar_url: data.avatarUrl?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", childUserId);

    if (updateError) {
      console.error("[updateChildProfile] Profile update error:", updateError);
      return { success: false, error: "Failed to update the child profile." };
    }

    revalidatePath("/dashboard/parent");
    return { success: true, message: "Child profile updated successfully!" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Safely uploads a child's avatar image to Supabase storage and updates their profile.
 * Verifies parent-child permission beforehand.
 */
export async function uploadChildAvatar(
  childUserId: string,
  formData: FormData
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  try {
    const parentId = await verifyParentRole();
    const supabase = await createClient();

    // Verify parent-child connection is active and approved
    const { data: link, error: linkError } = await supabase
      .from("parent_child_link")
      .select("is_active, is_approved")
      .eq("parent_user_id", parentId)
      .eq("child_user_id", childUserId)
      .eq("is_active", true)
      .eq("is_approved", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (linkError || !link) {
      return { success: false, error: "No active approved link exists for this child." };
    }

    const avatarField = formData.get("avatar");

    if (!(avatarField instanceof File) || avatarField.size === 0) {
      return { success: false, error: "Please select an avatar image." };
    }

    if (!avatarField.type.startsWith("image/")) {
      return { success: false, error: "Only image files are allowed." };
    }

    const fileNameParts = avatarField.name.split(".");
    const fileExtension = fileNameParts.length > 1 ? fileNameParts.pop() : "png";
    const filePath = `avatars/${childUserId}/${Date.now()}.${fileExtension || "png"}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarField, {
        contentType: avatarField.type,
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const avatarUrl = publicUrlData.publicUrl;

    // Update child profile in the profile table
    const { error: updateError } = await supabase
      .from("profile")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", childUserId);

    if (updateError) {
      console.error("[uploadChildAvatar] Profile update error:", updateError);
      return { success: false, error: "Failed to update the child profile avatar." };
    }

    revalidatePath("/dashboard/parent");
    return { success: true, avatarUrl };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}
