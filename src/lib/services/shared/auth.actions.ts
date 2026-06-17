"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Checks if a user profile exists with the given email address.
 * Bypasses RLS by using the admin client.
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return false;

  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("profile")
      .select("user_id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (error) {
      console.error("Error checking email in profile table:", error.message);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error("Failed to check email existence:", err);
    return false;
  }
}
