"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUserRole } from "../dashboard.actions";
import { verifyClassroomTeacher } from "./classroom-base.actions";

/**
 * Upload learning resource (Teacher only)
 */
export async function uploadResource(
  classroomId: string,
  title: string,
  description: string | null = null,
  resourceType: "PDF" | "VIDEO" | "LINK" | "DOCUMENT",
  resourceUrl: string,
  storagePath: string | null = null
) {
  try {
    const { userId } = await verifyUserRole("teacher");
    const supabase = await createClient();

    if (!title.trim() || !resourceUrl.trim()) {
      return { success: false, error: "Title and Resource URL are required." };
    }

    const { data: resource, error } = await supabase
      .from("classroom_resources")
      .insert({
        classroom_id: classroomId,
        teacher_user_id: userId,
        title: title.trim(),
        description: description?.trim() || null,
        resource_type: resourceType,
        resource_url: resourceUrl.trim(),
        storage_path: storagePath,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // Notify classroom members
    const { data: members } = await supabase
      .from("classroom_members")
      .select("student_user_id")
      .eq("classroom_id", classroomId)
      .eq("status", "APPROVED");

    const eventData = {
      actor_user_id: userId,
      actor_role: "teacher" as const,
      target_user_id: null,
      target_type: "classroom",
      event_type: "RESOURCE_UPLOADED",
      source_type: "classroom_resources",
      source_id: resource.id,
      metadata: { title: resource.title, classroom_id: classroomId },
    };

    await supabase.from("activity_events").insert(eventData);

    if (members && members.length > 0) {
      const notificationsData = members.map((m) => ({
        recipient_user_id: m.student_user_id,
        recipient_role: "kid" as const,
        type: "RESOURCE_UPLOADED",
        title: "New Resource Added",
        message: `Your teacher uploaded a new resource: "${resource.title}".`,
        source_type: "classroom_resources",
        source_id: resource.id,
        metadata: { classroom_id: classroomId },
      }));
      await supabase.from("notifications").insert(notificationsData);
    }

    revalidatePath(`/dashboard/teacher/classrooms/${classroomId}`);
    revalidatePath(`/dashboard/kid/classrooms/${classroomId}`);
    return { success: true, resource };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to upload resource.",
    };
  }
}

/**
 * Delete learning resource (Teacher only)
 */
export async function deleteResource(resourceId: string) {
  try {
    await verifyUserRole("teacher");
    const supabase = await createClient();

    const { data: resource, error: getErr } = await supabase
      .from("classroom_resources")
      .select("classroom_id")
      .eq("id", resourceId)
      .single();

    if (getErr || !resource) {
      return { success: false, error: "Resource not found." };
    }

    const { error } = await supabase
      .from("classroom_resources")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", resourceId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/dashboard/teacher/classrooms/${resource.classroom_id}`);
    revalidatePath(`/dashboard/kid/classrooms/${resource.classroom_id}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete resource.",
    };
  }
}

/**
 * Fetch classroom resources only (Teacher only)
 */
export async function getTeacherClassroomResources(classroomId: string) {
  try {
    const { userId } = await verifyUserRole("teacher");
    const supabase = await createClient();
    if (!(await verifyClassroomTeacher(supabase, classroomId, userId))) {
      return { success: false, error: "Unauthorized." };
    }
    const { data, error } = await supabase
      .from("classroom_resources")
      .select(
        "id, classroom_id, teacher_user_id, title, description, resource_type, resource_url, storage_path, created_at, updated_at, deleted_at"
      )
      .eq("classroom_id", classroomId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load resources.",
    };
  }
}

/**
 * Fetch classroom resources only (Student only)
 */
export async function getStudentClassroomResources(classroomId: string) {
  try {
    const { userId } = await verifyUserRole("kid");
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify student is approved member
    const { data: member, error: memberErr } = await adminSupabase
      .from("classroom_members")
      .select("id")
      .eq("classroom_id", classroomId)
      .eq("student_user_id", userId)
      .eq("status", "APPROVED")
      .maybeSingle();
    if (memberErr || !member) {
      return { success: false, error: "Unauthorized." };
    }

    const { data, error } = await supabase
      .from("classroom_resources")
      .select(
        "id, classroom_id, teacher_user_id, title, description, resource_type, resource_url, storage_path, created_at, updated_at, deleted_at"
      )
      .eq("classroom_id", classroomId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load resources.",
    };
  }
}
