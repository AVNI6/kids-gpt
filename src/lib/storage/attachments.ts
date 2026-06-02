import type { SupabaseClient } from "@supabase/supabase-js";
import { validateAttachmentFile } from "./validation";
import { UploadResult } from "./avatar";

/**
 * Validates and uploads a chat message or classroom attachment to the materials bucket.
 * Designed to accept client context for server/client compatibility.
 */
export async function uploadChatAttachment(
  supabase: SupabaseClient,
  userId: string,
  file: File | Blob,
  path: string
): Promise<UploadResult> {
  try {
    // 1. Perform validation if it is an instance of File
    if (file instanceof File) {
      const validation = validateAttachmentFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error || "Invalid attachment file." };
      }
    }

    // 2. Upload to the materials bucket
    const { error: uploadError } = await supabase.storage.from("materials").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // 3. Retrieve public URL
    const { data: publicUrlData } = supabase.storage.from("materials").getPublicUrl(path);

    return {
      success: true,
      path: path,
      publicUrl: publicUrlData.publicUrl,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to upload attachment.",
    };
  }
}

/**
 * Safely deletes a file from a specified Supabase bucket.
 */
export async function deleteAttachment(
  supabase: SupabaseClient,
  bucketName: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage.from(bucketName).remove([filePath]);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete attachment.",
    };
  }
}
