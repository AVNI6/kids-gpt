"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifyUserRole } from "@/lib/services/kid/dashboard.actions";

export type ActionResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function updateParentProfileSettings(fields: {
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}): Promise<ActionResponse> {
  try {
    const { userId } = await verifyUserRole("parent");
    const supabase = await createClient();

    const updatePayload: Record<string, string | null> = {
      first_name: fields.firstName.trim(),
      last_name: fields.lastName.trim() || null,
    };

    if (fields.avatarUrl) {
      updatePayload.avatar_url = fields.avatarUrl;
    }

    const { error } = await supabase.from("profile").update(updatePayload).eq("user_id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/parent/settings");
    revalidatePath("/dashboard/parent");
    return { success: true, message: "Profile settings updated successfully!" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update profile settings.",
    };
  }
}

export async function changeParentPassword(password: string): Promise<ActionResponse> {
  try {
    await verifyUserRole("parent");
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: "Password updated successfully!" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to change password.",
    };
  }
}
