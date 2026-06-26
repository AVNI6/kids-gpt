"use server";

import { createClient } from "@/lib/supabase/server";

export type SignedUrlResult =
  | { success: true; url: string; error?: never }
  | { success: false; url?: never; error: string };

export async function getSignedResourceUrl(filePath: string): Promise<SignedUrlResult> {
  try {
    const supabase = await createClient();

    // Clean the file path (remove leading materials/ if present)
    let cleanPath = filePath;
    if (filePath.startsWith("materials/")) {
      cleanPath = filePath.substring("materials/".length);
    }

    const { data } = supabase.storage.from("materials").getPublicUrl(cleanPath);
    return { success: true, url: data.publicUrl };
  } catch (err) {
    console.error("getSignedResourceUrl (public fallback) error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to retrieve public resource URL",
    };
  }
}
