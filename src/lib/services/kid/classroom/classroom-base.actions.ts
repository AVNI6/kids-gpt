"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUserRole } from "../dashboard.actions";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  TeacherDashboardData,
  KidClassroomMembership,
  EnrollmentStatus,
  WorkspaceStudent,
} from "@/types/classroom.types";

function generateClassCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Helper to verify that a teacher owns a classroom
 */
export async function verifyClassroomTeacher(
  supabase: SupabaseClient,
  classroomId: string,
  teacherId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("classrooms")
    .select("id")
    .eq("id", classroomId)
    .eq("teacher_user_id", teacherId)
    .is("deleted_at", null)
    .maybeSingle();
  return !error && !!data;
}

/**
 * Create a new classroom (Teacher only)
 */
export async function createClassroom(
  name: string,
  description: string | null = null,
  subject: string | null = null,
  grade: string | null = null
) {
  try {
    const { userId } = await verifyUserRole("teacher");
    const supabase = await createClient();

    if (!name.trim()) {
      return { success: false, error: "Classroom name is required." };
    }

    // Generate unique class code with collision checking
    let code = generateClassCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const { data } = await supabase
        .from("classrooms")
        .select("id")
        .eq("class_code", code)
        .maybeSingle();

      if (!data) {
        isUnique = true;
      } else {
        code = generateClassCode();
        attempts++;
      }
    }

    const { data: newClassroom, error } = await supabase
      .from("classrooms")
      .insert({
        teacher_user_id: userId,
        name: name.trim(),
        description: description?.trim() || null,
        subject: subject?.trim() || null,
        grade: grade?.trim() || null,
        class_code: code,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/teacher");
    return { success: true, classroom: newClassroom };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Soft delete a classroom (Teacher only)
 */
export async function deleteClassroom(classroomId: string) {
  try {
    const { userId } = await verifyUserRole("teacher");
    const supabase = await createClient();

    // Verify ownership
    const { data: classroom, error: verifyError } = await supabase
      .from("classrooms")
      .select("id")
      .eq("id", classroomId)
      .eq("teacher_user_id", userId)
      .maybeSingle();

    if (verifyError || !classroom) {
      return { success: false, error: "Classroom not found or unauthorized." };
    }

    // Perform soft delete
    const { error: deleteError } = await supabase
      .from("classrooms")
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", classroomId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    revalidatePath("/dashboard/teacher");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Request to join a classroom using the class code (Kid only)
 */
export async function joinClassroomByCode(code: string) {
  try {
    const { userId, profile } = await verifyUserRole("kid");
    const supabase = await createClient();

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, error: "Class code is required." };
    }

    // Look up active classroom using the secure RPC
    const { data, error: classError } = await supabase
      .rpc("get_classroom_by_code", { p_code: cleanCode })
      .maybeSingle();

    if (classError) {
      console.error("[joinClassroomByCode] RPC error:", classError.message, classError.code);
      if (classError.code === "42883") {
        return {
          success: false,
          error: "Classroom system is not yet set up. Please contact support.",
        };
      }
      return { success: false, error: classError.message || "Failed to look up classroom." };
    }

    if (!data) {
      return {
        success: false,
        error: "Classroom not found or is no longer active. Please check the code and try again.",
      };
    }

    const classroom = data as { id: string; name: string; teacher_user_id: string };

    // Check if membership already exists
    const { data: existingMember } = await supabase
      .from("classroom_members")
      .select("id, status")
      .eq("classroom_id", classroom.id)
      .eq("student_user_id", userId)
      .maybeSingle();

    if (existingMember) {
      if (existingMember.status === "APPROVED") {
        return { success: false, error: "You are already a member of this classroom." };
      }
      if (existingMember.status === "PENDING") {
        return { success: false, error: "Your join request is already pending approval." };
      }
      if (existingMember.status === "REJECTED") {
        return { success: false, error: "Your previous request to join was declined." };
      }
    }

    // Insert pending enrollment request
    const { data: memberLink, error: joinError } = await supabase
      .from("classroom_members")
      .insert({
        classroom_id: classroom.id,
        student_user_id: userId,
        status: "PENDING",
      })
      .select("id")
      .single();

    if (joinError) {
      return { success: false, error: joinError.message };
    }

    // Log a notification for the teacher securely
    const kidName = profile.first_name
      ? `${profile.first_name} ${profile.last_name || ""}`.trim()
      : profile.username || "A student";

    await supabase.from("notifications").insert({
      recipient_user_id: classroom.teacher_user_id,
      recipient_role: "teacher",
      type: "classroom_request",
      title: "New Join Request",
      message: `${kidName} has requested to join your classroom "${classroom.name}".`,
      source_type: "classroom",
      source_id: classroom.id,
      metadata: {
        student_user_id: userId,
        member_link_id: memberLink.id,
      },
    });

    revalidatePath("/dashboard/kid");
    revalidatePath("/dashboard/kid/classrooms");
    return { success: true, message: "Join request submitted successfully!" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Leave a classroom (Kid only)
 */
export async function leaveClassroom(classroomId: string) {
  try {
    const { userId } = await verifyUserRole("kid");
    const supabase = await createClient();

    const { error } = await supabase
      .from("classroom_members")
      .delete()
      .eq("classroom_id", classroomId)
      .eq("student_user_id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/kid");
    revalidatePath("/dashboard/kid/classrooms");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Handle student enrollment request (Teacher only)
 */
export async function handleEnrollmentRequest(memberLinkId: string, action: "APPROVE" | "REJECT") {
  try {
    const { userId } = await verifyUserRole("teacher");
    const supabase = await createClient();

    // Look up enrollment request and verify ownership of the classroom
    const { data: memberRequest, error: lookupError } = await supabase
      .from("classroom_members")
      .select("id, classroom_id, student_user_id, status, classrooms(name, teacher_user_id)")
      .eq("id", memberLinkId)
      .maybeSingle();

    if (lookupError || !memberRequest || !memberRequest.classrooms) {
      return { success: false, error: "Enrollment request not found." };
    }

    const classroomData = memberRequest.classrooms as unknown as {
      name: string;
      teacher_user_id: string;
    };

    if (classroomData.teacher_user_id !== userId) {
      return { success: false, error: "Unauthorized." };
    }

    const nextStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    const { error: updateError } = await supabase
      .from("classroom_members")
      .update({
        status: nextStatus,
        approved_at: action === "APPROVE" ? new Date().toISOString() : null,
      })
      .eq("id", memberLinkId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    if (action === "APPROVE") {
      // Establish direct teacher-student link for other permissions/activities
      const { error: linkError } = await supabase.from("teacher_student_links").insert({
        teacher_user_id: classroomData.teacher_user_id,
        student_user_id: memberRequest.student_user_id,
      });

      if (linkError && linkError.code !== "23505") {
        console.error(
          "[handleEnrollmentRequest] Failed to insert teacher_student_link:",
          linkError
        );
      }
    }

    // Send a secure notification to the student
    await supabase.from("notifications").insert({
      recipient_user_id: memberRequest.student_user_id,
      recipient_role: "kid",
      type: action === "APPROVE" ? "classroom_approved" : "classroom_rejected",
      title: action === "APPROVE" ? "Classroom Request Approved!" : "Classroom Request Declined",
      message:
        action === "APPROVE"
          ? `You have been approved to join "${classroomData.name}"!`
          : `Your request to join "${classroomData.name}" has been declined.`,
      source_type: "classroom",
      source_id: memberRequest.classroom_id,
    });

    revalidatePath("/dashboard/teacher");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Fetch aggregated teacher dashboard data (Teacher only)
 */
export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  await verifyUserRole("teacher");
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_teacher_dashboard");

  if (error) {
    throw new Error("Failed to load teacher dashboard: " + error.message);
  }

  return data as TeacherDashboardData;
}

/**
 * Fetch kid's classroom memberships and pending requests
 */
export async function getKidClassroomData(): Promise<{
  success: boolean;
  error?: string;
  memberships: KidClassroomMembership[];
}> {
  try {
    const { userId } = await verifyUserRole("kid");
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("classroom_members")
      .select(
        `
        id,
        status,
        classroom_id,
        classrooms (
          id,
          name,
          description,
          subject,
          grade,
          class_code,
          teacher_user_id,
          is_active,
          created_at,
          updated_at,
          deleted_at,
          teacher:profile!classrooms_teacher_user_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        )
      `
      )
      .eq("student_user_id", userId);

    if (error) {
      return { success: false, error: error.message, memberships: [] };
    }

    const membershipsWithTeachersRaw = (data || []).map((member) => {
      const classroomsRaw = member.classrooms;
      const classroom = (Array.isArray(classroomsRaw) ? classroomsRaw[0] : classroomsRaw) as {
        id: string;
        name: string;
        description: string | null;
        subject: string | null;
        grade: string | null;
        class_code: string;
        teacher_user_id: string;
        is_active?: boolean;
        created_at?: string;
        updated_at?: string;
        deleted_at?: string | null;
        teacher: unknown;
      } | null;

      if (!classroom) return null;

      const teacherProfile = (
        Array.isArray(classroom.teacher) ? classroom.teacher[0] || null : classroom.teacher || null
      ) as KidClassroomMembership["classrooms"]["teacher"];

      return {
        id: member.id,
        status: member.status as EnrollmentStatus,
        classroom_id: member.classroom_id,
        classrooms: {
          id: classroom.id,
          teacher_user_id: classroom.teacher_user_id,
          name: classroom.name,
          description: classroom.description,
          subject: classroom.subject,
          grade: classroom.grade,
          class_code: classroom.class_code,
          is_active: classroom.is_active ?? true,
          created_at: classroom.created_at ?? "",
          updated_at: classroom.updated_at ?? "",
          deleted_at: classroom.deleted_at ?? null,
          teacher: teacherProfile,
        },
      } as KidClassroomMembership;
    });

    const membershipsWithTeachers = membershipsWithTeachersRaw.filter(
      (m): m is KidClassroomMembership => m !== null
    );

    return { success: true, memberships: membershipsWithTeachers };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
      memberships: [],
    };
  }
}

/**
 * Fetch classroom metadata only (Teacher only)
 */
export async function getTeacherClassroomMetadata(classroomId: string) {
  try {
    const { userId } = await verifyUserRole("teacher");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("classrooms")
      .select(
        "id, teacher_user_id, name, description, subject, grade, class_code, is_active, created_at, updated_at, deleted_at"
      )
      .eq("id", classroomId)
      .eq("teacher_user_id", userId)
      .is("deleted_at", null)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load classroom metadata.",
    };
  }
}

/**
 * Fetch classroom students list only (Teacher only)
 */
export async function getTeacherClassroomStudents(classroomId: string) {
  try {
    const { userId } = await verifyUserRole("teacher");
    const supabase = await createClient();
    if (!(await verifyClassroomTeacher(supabase, classroomId, userId))) {
      return { success: false, error: "Unauthorized." };
    }
    const { data, error } = await supabase
      .from("classroom_members")
      .select(
        `
        joined_at,
        approved_at,
        student:profile!classroom_members_student_user_id_fkey (
          user_id,
          first_name,
          last_name,
          avatar_url,
          total_experience_points,
          current_streak
        )
      `
      )
      .eq("classroom_id", classroomId)
      .eq("status", "APPROVED");

    if (error) throw error;

    type MemberRow = {
      joined_at: string;
      approved_at: string | null;
      student: {
        user_id: string;
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
        total_experience_points: number | null;
        current_streak: number | null;
      } | null;
    };

    const students: WorkspaceStudent[] = ((data as unknown as MemberRow[]) || [])
      .filter(
        (m): m is MemberRow & { student: NonNullable<MemberRow["student"]> } => m.student !== null
      )
      .map((m) => ({
        user_id: m.student.user_id,
        first_name: m.student.first_name,
        last_name: m.student.last_name,
        avatar_url: m.student.avatar_url,
        total_experience_points: m.student.total_experience_points,
        current_streak: m.student.current_streak || 0,
        joined_at: m.joined_at,
        approved_at: m.approved_at,
      }))
      .sort((a, b) => {
        const nameA = `${a.first_name || ""} ${a.last_name || ""}`.trim().toLowerCase();
        const nameB = `${b.first_name || ""} ${b.last_name || ""}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });

    return { success: true, data: students };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load students.",
    };
  }
}

/**
 * Fetch classroom metadata and teacher profile (Student only)
 */
export async function getStudentClassroomMetadata(classroomId: string) {
  try {
    const { userId } = await verifyUserRole("kid");
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from("classroom_members")
      .select(
        `
        id,
        classroom:classrooms (
          id,
          name,
          description,
          subject,
          grade,
          class_code,
          teacher_user_id,
          is_active,
          created_at,
          updated_at,
          deleted_at,
          teacher:profile!classrooms_teacher_user_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        )
      `
      )
      .eq("classroom_id", classroomId)
      .eq("student_user_id", userId)
      .eq("status", "APPROVED")
      .maybeSingle();

    if (error || !data) {
      throw new Error("You are not an approved member of this classroom or it has been deleted.");
    }

    const classroomRaw = data.classroom;
    const classroom = Array.isArray(classroomRaw) ? classroomRaw[0] : classroomRaw;
    if (!classroom) {
      throw new Error("Classroom not found.");
    }

    const teacherRaw = classroom.teacher;
    const teacher = Array.isArray(teacherRaw) ? teacherRaw[0] || null : teacherRaw || null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { teacher: _, ...classroomMetadata } = classroom;
    const responseData = {
      ...classroomMetadata,
      teacher,
    };

    return { success: true, data: responseData };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load student classroom metadata.",
    };
  }
}
