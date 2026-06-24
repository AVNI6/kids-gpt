"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUserRole } from "../dashboard.actions";
import { verifyClassroomTeacher } from "./classroom-base.actions";

/**
 * Create announcement (Teacher only)
 */
export async function createAnnouncement(classroomId: string, title: string, message: string) {
  try {
    const { userId } = await verifyUserRole("teacher");
    const supabase = await createClient();

    if (!title.trim() || !message.trim()) {
      return { success: false, error: "Title and message are required." };
    }

    const { data: announcement, error } = await supabase
      .from("announcements")
      .insert({
        classroom_id: classroomId,
        teacher_user_id: userId,
        title: title.trim(),
        message: message.trim(),
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
      event_type: "ANNOUNCEMENT_POSTED",
      source_type: "announcements",
      source_id: announcement.id,
      metadata: { title: announcement.title, classroom_id: classroomId },
    };

    await supabase.from("activity_events").insert(eventData);

    if (members && members.length > 0) {
      const notificationsData = members.map((m) => ({
        recipient_user_id: m.student_user_id,
        recipient_role: "kid" as const,
        type: "ANNOUNCEMENT_POSTED",
        title: "New Classroom Announcement",
        message: `New announcement: "${announcement.title}" - ${announcement.message.slice(0, 50)}...`,
        source_type: "announcements",
        source_id: announcement.id,
        metadata: { classroom_id: classroomId },
      }));
      await supabase.from("notifications").insert(notificationsData);
    }

    revalidatePath(`/dashboard/teacher/classrooms/${classroomId}`);
    revalidatePath(`/dashboard/kid/classrooms/${classroomId}`);
    return { success: true, announcement };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create announcement.",
    };
  }
}

/**
 * Delete announcement (Teacher only)
 */
export async function deleteAnnouncement(announcementId: string) {
  try {
    await verifyUserRole("teacher");
    const supabase = await createClient();

    const { data: announcement, error: getErr } = await supabase
      .from("announcements")
      .select("classroom_id")
      .eq("id", announcementId)
      .single();

    if (getErr || !announcement) {
      return { success: false, error: "Announcement not found." };
    }

    const { error } = await supabase
      .from("announcements")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", announcementId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/dashboard/teacher/classrooms/${announcement.classroom_id}`);
    revalidatePath(`/dashboard/kid/classrooms/${announcement.classroom_id}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete announcement.",
    };
  }
}

/**
 * Fetch classroom announcements only (Teacher only)
 */
export async function getTeacherClassroomAnnouncements(classroomId: string) {
  try {
    const { userId } = await verifyUserRole("teacher");
    const supabase = await createClient();
    if (!(await verifyClassroomTeacher(supabase, classroomId, userId))) {
      return { success: false, error: "Unauthorized." };
    }
    const { data, error } = await supabase
      .from("announcements")
      .select(
        "id, classroom_id, teacher_user_id, title, message, created_at, updated_at, deleted_at"
      )
      .eq("classroom_id", classroomId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load announcements.",
    };
  }
}

/**
 * Fetch classroom announcements only (Student only)
 */
export async function getStudentClassroomAnnouncements(classroomId: string) {
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
      .from("announcements")
      .select(
        "id, classroom_id, teacher_user_id, title, message, created_at, updated_at, deleted_at"
      )
      .eq("classroom_id", classroomId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load announcements.",
    };
  }
}
