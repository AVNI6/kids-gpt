"use server";

import { createClient } from "@/lib/supabase/server";

export async function getSignedResourceUrl(filePath: string): Promise<string> {
  const supabase = await createClient();

  // 1. Retrieve the authenticated user session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // 2. Get profile to check user role
  const { data: profile } = await supabase
    .from("profile")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role = profile?.role;

  // Clean the file path (remove leading materials/ if present)
  let cleanPath = filePath;
  if (filePath.startsWith("materials/")) {
    cleanPath = filePath.substring("materials/".length);
  }

  const parts = cleanPath.split("/");
  const fileOwnerId = parts[0];

  if (!fileOwnerId) {
    throw new Error("Invalid resource path structure.");
  }

  // 1. Owner can always access own uploads
  if (user.id === fileOwnerId) {
    const { data, error } = await supabase.storage
      .from("materials")
      .createSignedUrl(cleanPath, 900, { download: false });
    if (error) throw error;
    return data.signedUrl;
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
      if (error) throw error;
      return data.signedUrl;
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
      if (error) throw error;
      return data.signedUrl;
    }
  }

  // 4. Kid can access classroom teacher's uploads
  if (role === "kid") {
    const { data: isTeacher } = await supabase
      .from("teacher_student_links")
      .select("id")
      .eq("teacher_user_id", fileOwnerId)
      .eq("student_user_id", user.id)
      .maybeSingle();

    if (isTeacher) {
      const { data, error } = await supabase.storage
        .from("materials")
        .createSignedUrl(cleanPath, 900, { download: false });
      if (error) throw error;
      return data.signedUrl;
    }
  }

  throw new Error("Access denied. You do not have permission to view this resource.");
}
