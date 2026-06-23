"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SignedUrlResult =
  | { success: true; url: string; error?: never }
  | { success: false; url?: never; error: string };

export async function getSignedResourceUrl(filePath: string): Promise<SignedUrlResult> {
  try {
    const supabase = await createClient();

    // 1. Retrieve the authenticated user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("getSignedResourceUrl: Auth error or user not found:", authError);
      return { success: false, error: "Unauthorized" };
    }

    // 2. Get profile to check user role
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error("getSignedResourceUrl: Profile fetch error:", profileError);
    }

    const role = profile?.role;

    // Clean the file path (remove leading materials/ if present)
    let cleanPath = filePath;
    if (filePath.startsWith("materials/")) {
      cleanPath = filePath.substring("materials/".length);
    }

    const parts = cleanPath.split("/");
    const fileOwnerId = parts[0];

    if (!fileOwnerId) {
      return { success: false, error: "Invalid resource path structure." };
    }

    // 1. Owner can always access own uploads
    if (user.id === fileOwnerId) {
      const { data, error } = await supabase.storage
        .from("materials")
        .createSignedUrl(cleanPath, 900, { download: false });
      if (error) {
        console.error("getSignedResourceUrl: Storage signed url error (owner):", error);
        return { success: false, error: error.message };
      }
      return { success: true, url: data.signedUrl };
    }

    // 2. Parent can access linked children's uploads
    if (role === "parent") {
      const { data: isLinked } = await supabase
        .from("parent_child_link")
        .select("id")
        .eq("parent_user_id", user.id)
        .eq("child_user_id", fileOwnerId)
        .eq("is_approved", true)
        .eq("is_active", true)
        .is("deleted_at", null)
        .maybeSingle();

      if (isLinked) {
        const { data, error } = await supabase.storage
          .from("materials")
          .createSignedUrl(cleanPath, 900, { download: false });
        if (error) {
          console.error("getSignedResourceUrl: Storage signed url error (parent):", error);
          return { success: false, error: error.message };
        }
        return { success: true, url: data.signedUrl };
      }
    }

    // 3. Teacher can access students' uploads
    if (role === "teacher") {
      const { data: isStudent } = await supabase
        .from("teacher_student_links")
        .select("id")
        .eq("teacher_user_id", user.id)
        .eq("student_user_id", fileOwnerId)
        .maybeSingle();

      if (isStudent) {
        const { data, error } = await supabase.storage
          .from("materials")
          .createSignedUrl(cleanPath, 900, { download: false });
        if (error) {
          console.error("getSignedResourceUrl: Storage signed url error (teacher):", error);
          return { success: false, error: error.message };
        }
        return { success: true, url: data.signedUrl };
      }
    }

    // 4. Kid can access classroom teacher's uploads
    // Use admin client to bypass RLS — same pattern as getStudentClassroomWorkspace.
    if (role === "kid") {
      const adminClient = createAdminClient();

      // Check direct teacher_student_links first
      const { data: directLink } = await adminClient
        .from("teacher_student_links")
        .select("id")
        .eq("teacher_user_id", fileOwnerId)
        .eq("student_user_id", user.id)
        .maybeSingle();

      let hasAccess = !!directLink;

      if (!hasAccess) {
        // Use the SECURITY DEFINER DB function — checks if the kid is an
        // APPROVED student of the teacher via any classroom (bypasses all RLS)
        const { data: isApprovedStudent, error: rpcError } = await adminClient.rpc(
          "is_approved_classroom_student_of_teacher",
          { p_student_id: user.id, p_teacher_id: fileOwnerId }
        );

        if (rpcError) {
          console.error("getSignedResourceUrl: RPC error during kid access check:", rpcError);
        }

        if (isApprovedStudent === true) {
          hasAccess = true;
        }
      }

      if (hasAccess) {
        const { data, error } = await supabase.storage
          .from("materials")
          .createSignedUrl(cleanPath, 900, { download: false });
        if (error) {
          console.error("getSignedResourceUrl: Storage signed url error (kid):", error);
          return { success: false, error: error.message };
        }
        return { success: true, url: data.signedUrl };
      }
    }

    return {
      success: false,
      error: "Access denied. You do not have permission to view this resource.",
    };
  } catch (err) {
    console.error("getSignedResourceUrl: Error occurred:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to sign resource URL",
    };
  }
}
