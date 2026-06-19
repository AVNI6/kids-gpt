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

    // 2. Upload to the materials bucket with explicit content type for inline browser viewing
    let contentType = "application/octet-stream";
    if (file && typeof file === "object") {
      const fileName = (file as any).name;
      if (fileName && typeof fileName === "string") {
        const ext = fileName.split(".").pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
          svg: "image/svg+xml",
          png: "image/png",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          gif: "image/gif",
          webp: "image/webp",
          pdf: "application/pdf",
          mp4: "video/mp4",
          webm: "video/webm",
          ogg: "video/ogg",
          mp3: "audio/mpeg",
          wav: "audio/wav",
          txt: "text/plain",
          html: "text/html",
          htm: "text/html",
          json: "application/json",
        };

        if (ext && mimeTypes[ext]) {
          contentType = mimeTypes[ext];
        } else {
          contentType = (file as any).type || "application/octet-stream";
        }
      } else {
        contentType = (file as any).type || "application/octet-stream";
      }
    }

    const { error: uploadError } = await supabase.storage.from("materials").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType,
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
