"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifyUserRole } from "@/lib/services/kid/dashboard.actions";
import { calculateAge } from "@/lib/utils/kid/childAge";

export type ActionResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function updateKidProfileSettings(fields: {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  username: string;
  avatarUrl?: string;
}): Promise<ActionResponse> {
  try {
    const { userId } = await verifyUserRole("kid");

    if (fields.dateOfBirth) {
      const age = calculateAge(fields.dateOfBirth);
      if (age === null || age < 5) {
        return { success: false, error: "You must be at least 5 years old." };
      }
      if (age > 25) {
        return { success: false, error: "You must be at most 25 years old." };
      }
    } else {
      return { success: false, error: "Birthdate is required." };
    }

    const supabase = await createClient();

    const updatePayload: Record<string, string | null> = {
      first_name: fields.firstName.trim(),
      last_name: fields.lastName.trim() || null,
      date_of_birth: fields.dateOfBirth.trim() || null,
      username: fields.username.trim() || null,
    };

    if (fields.avatarUrl) {
      updatePayload.avatar_url = fields.avatarUrl;
    }

    const { error } = await supabase.from("profile").update(updatePayload).eq("user_id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/kid/settings");
    revalidatePath("/dashboard/kid");
    return { success: true, message: "Profile settings updated successfully!" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update profile settings.",
    };
  }
}

export async function changeKidPassword(password: string): Promise<ActionResponse> {
  try {
    await verifyUserRole("kid");
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
