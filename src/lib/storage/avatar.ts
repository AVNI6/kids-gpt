import type { SupabaseClient } from "@supabase/supabase-js";
import { validateAvatarFile } from "./validation";
import { generateAvatarPath } from "./paths";

export interface UploadResult {
  success: boolean;
  path?: string;
  publicUrl?: string;
  error?: string;
}

/**
 * Validates, sanitizes, and uploads a user or child avatar to the avatars bucket.
 * Designed to accept client context for server/client compatibility.
 */
export async function uploadUserAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<UploadResult> {
  try {
    // 1. Perform centralized validation
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error || "Invalid avatar file." };
    }

    // 2. Generate secure centralized path
    const filePath = generateAvatarPath(userId, file.name);

    // 3. Upload to the avatars bucket
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // 4. Retrieve public URL
    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);

    return {
      success: true,
      path: filePath,
      publicUrl: publicUrlData.publicUrl,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to upload avatar.",
    };
  }
}

/**
 * Safely deletes a user avatar from the avatars bucket.
 */
export async function deleteUserAvatar(
  supabase: SupabaseClient,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage.from("avatars").remove([filePath]);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete avatar.",
    };
  }
}
