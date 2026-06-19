"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUserRole } from "./dashboard.actions";
import type {
  TeacherDashboardData,
  KidClassroomMembership,
  EnrollmentStatus,
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
      // Surface a more specific message if the RPC doesn't exist yet (migration not applied)
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

    // Cast as classrooms object
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
 * Create a new assignment (Teacher only)
 */
export async function createAssignment(
  classroomId: string,
  title: string,
  description: string | null = null,
  subject: string | null = null,
  totalPoints: number = 100,
  dueDate: string | null = null,
  activityType: string | null = null,
  topic: string | null = null,
  difficulty: string | null = null,
  questionCount: number | null = null
) {
  try {
    const { userId } = await verifyUserRole("teacher");
    const supabase = await createClient();

    if (!title.trim()) {
      return { success: false, error: "Assignment title is required." };
    }

    // Verify classroom ownership
    const { data: classroom, error: classErr } = await supabase
      .from("classrooms")
      .select("id")
      .eq("id", classroomId)
      .eq("teacher_user_id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (classErr || !classroom) {
      return { success: false, error: "Unauthorized: Classroom not found or not owned by you." };
    }

    const { data, error } = await supabase
      .from("assignments")
      .insert({
        classroom_id: classroomId,
        teacher_user_id: userId,
        created_by: userId,
        title: title.trim(),
        description: description?.trim() || null,
        subject: subject?.trim() || null,
        total_points: totalPoints,
        due_date: dueDate,
        status: "DRAFT",
        activity_type: activityType,
        topic: topic?.trim() || null,
        difficulty: difficulty,
        question_count: questionCount ?? 3,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/dashboard/teacher/classrooms/${classroomId}`);
    return { success: true, assignment: data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create assignment.",
    };
  }
}

/**
 * Update/Edit an existing assignment (Teacher only)
 */
export async function updateAssignment(
  assignmentId: string,
  title: string,
  description: string | null = null,
  subject: string | null = null,
  totalPoints: number = 100,
  dueDate: string | null = null,
  activityType: string | null = null,
  topic: string | null = null,
  difficulty: string | null = null,
  questionCount: number | null = null
) {
  try {
    const { userId } = await verifyUserRole("teacher");
    const supabase = await createClient();

    if (!title.trim()) {
      return { success: false, error: "Assignment title is required." };
    }

    // Fetch current assignment details to check status and owner
    const { data: assignment, error: fetchErr } = await supabase
      .from("assignments")
      .select("classroom_id, teacher_user_id, status, total_points, activity_type")
      .eq("id", assignmentId)
      .is("deleted_at", null)
      .single();

    if (fetchErr || !assignment) {
      return { success: false, error: "Assignment not found." };
    }

    if (assignment.teacher_user_id !== userId) {
      return { success: false, error: "Unauthorized: You do not own this assignment." };
    }

    // Prepare update payload
    type AssignmentUpdatePayload = {
      title: string;
      description: string | null;
      subject: string | null;
      due_date: string | null;
      updated_at: string;
      total_points?: number;
      activity_type?: string | null;
      topic?: string | null;
      difficulty?: string | null;
      question_count?: number;
    };

    const updatePayload: AssignmentUpdatePayload = {
      title: title.trim(),
      description: description?.trim() || null,
      subject: subject?.trim() || null,
      due_date: dueDate,
      updated_at: new Date().toISOString(),
    };

    // Restrict updates if the assignment is already published
    if (assignment.status === "PUBLISHED" || assignment.status === "CLOSED") {
      // Block changes to total_points and activity configuration to preserve grade safety
      if (assignment.total_points !== totalPoints || assignment.activity_type !== activityType) {
        return {
          success: false,
          error: "Cannot change points or activity type of a published or closed assignment.",
        };
      }
    } else {
      // DRAFT status allows complete modification
      updatePayload.total_points = totalPoints;
      updatePayload.activity_type = activityType;
      updatePayload.topic = topic?.trim() || null;
      updatePayload.difficulty = difficulty;
      updatePayload.question_count = questionCount ?? 3;
    }

    const { data, error } = await supabase
      .from("assignments")
      .update(updatePayload)
      .eq("id", assignmentId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/dashboard/teacher/classrooms/${assignment.classroom_id}`);
    revalidatePath(`/dashboard/kid/classrooms/${assignment.classroom_id}`);
    return { success: true, assignment: data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update assignment.",
    };
  }
}

/**
 * Publish an assignment (Teacher only)
 */
export async function publishAssignment(assignmentId: string) {
  try {
    const { userId } = await verifyUserRole("teacher");
    const supabase = await createClient();

    const { data: rpcData, error: rpcError } = await supabase.rpc("publish_assignment", {
      p_teacher_id: userId,
      p_assignment_id: assignmentId,
    });

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    const result = rpcData as { success: boolean; error?: string; classroom_id?: string } | null;
    if (!result || !result.success || !result.classroom_id) {
      return { success: false, error: result?.error || "Failed to publish assignment." };
    }

    revalidatePath(`/dashboard/teacher/classrooms/${result.classroom_id}`);
    revalidatePath(`/dashboard/kid/classrooms/${result.classroom_id}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to publish assignment.",
    };
  }
}

/**
 * Delete assignment (Teacher only)
 */
export async function deleteAssignment(assignmentId: string) {
  try {
    await verifyUserRole("teacher");
    const supabase = await createClient();

    const { data: assignment, error: getErr } = await supabase
      .from("assignments")
      .select("classroom_id")
      .eq("id", assignmentId)
      .single();

    if (getErr || !assignment) {
      return { success: false, error: "Assignment not found." };
    }

    const { error } = await supabase
      .from("assignments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", assignmentId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/dashboard/teacher/classrooms/${assignment.classroom_id}`);
    revalidatePath(`/dashboard/kid/classrooms/${assignment.classroom_id}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete assignment.",
    };
  }
}

/**
 * Submit assignment (Kid only)
 */
export async function submitAssignment(
  assignmentId: string,
  submissionType: "TEXT" | "PDF" | "IMAGE" | "LINK",
  submissionText: string | null = null,
  submissionUrl: string | null = null
) {
  try {
    const { userId } = await verifyUserRole("kid");
    const supabase = await createClient();

    const { data: rpcData, error: rpcError } = await supabase.rpc("submit_student_assignment", {
      p_student_id: userId,
      p_assignment_id: assignmentId,
      p_submission_type: submissionType,
      p_submission_text: submissionText,
      p_submission_url: submissionUrl,
    });

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    const result = rpcData as {
      success: boolean;
      error?: string;
      submission_id?: string;
      classroom_id?: string;
    } | null;
    if (!result || !result.success || !result.submission_id || !result.classroom_id) {
      return { success: false, error: result?.error || "Failed to submit assignment." };
    }

    revalidatePath(`/dashboard/kid/classrooms/${result.classroom_id}`);
    revalidatePath(`/dashboard/teacher/classrooms/${result.classroom_id}`);

    // Return the full submission shape the component uses for optimistic local state update
    const submission = {
      id: result.submission_id,
      submission_type: submissionType,
      submission_text: submissionText,
      submission_url: submissionUrl,
      submitted_at: new Date().toISOString(),
    };
    return { success: true, submission };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to submit assignment.",
    };
  }
}

/**
 * Grade assignment submission (Teacher only)
 */
export async function gradeAssignment(
  submissionId: string,
  score: number,
  feedback: string | null = null
) {
  try {
    const { userId } = await verifyUserRole("teacher");
    const supabase = await createClient();

    const { data: rpcData, error: rpcError } = await supabase.rpc("grade_student_submission", {
      p_teacher_id: userId,
      p_submission_id: submissionId,
      p_score: score,
      p_feedback: feedback,
    });

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    const result = rpcData as { success: boolean; error?: string; classroom_id?: string } | null;
    if (!result || !result.success || !result.classroom_id) {
      return { success: false, error: result?.error || "Failed to grade assignment." };
    }

    revalidatePath(`/dashboard/teacher/classrooms/${result.classroom_id}`);
    revalidatePath(`/dashboard/kid/classrooms/${result.classroom_id}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to grade assignment.",
    };
  }
}

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
 * Load classroom workspace for Teacher
 */
export async function getTeacherClassroomWorkspace(classroomId: string) {
  try {
    await verifyUserRole("teacher");
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_teacher_classroom_workspace", {
      p_classroom_id: classroomId,
    });

    if (error) throw new Error(error.message);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load classroom workspace.",
    };
  }
}

/**
 * Load assignment overview for Teacher
 */
export async function getTeacherAssignmentOverview(assignmentId: string) {
  try {
    await verifyUserRole("teacher");
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_teacher_assignment_overview", {
      p_assignment_id: assignmentId,
    });

    if (error) throw new Error(error.message);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load assignment overview.",
    };
  }
}

/**
 * Load classroom workspace for Student
 */
export async function getStudentClassroomWorkspace(classroomId: string) {
  try {
    const { userId } = await verifyUserRole("kid");
    console.log(
      "[getStudentClassroomWorkspace] Diagnostic - classroomId:",
      classroomId,
      "userId:",
      userId
    );
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Fetch approved membership, classroom details, and teacher profile details in a single query
    // and run RPC in parallel
    const [memberResult, workspaceResult] = await Promise.all([
      adminSupabase
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
        .maybeSingle(),
      supabase.rpc("get_student_classroom_workspace", { p_classroom_id: classroomId }),
    ]);

    if (memberResult.error || !memberResult.data) {
      throw new Error("You are not an approved member of this classroom.");
    }

    const classroomRaw = memberResult.data.classroom;
    // Handle classrooms returning as array or single object
    const classroom = Array.isArray(classroomRaw) ? classroomRaw[0] : classroomRaw;
    if (!classroom) {
      throw new Error("Classroom not found.");
    }

    if (workspaceResult.error) {
      throw new Error(workspaceResult.error.message);
    }

    const rpcData = workspaceResult.data || {};
    const teacherRaw = classroom.teacher;
    const teacher = Array.isArray(teacherRaw) ? teacherRaw[0] || null : teacherRaw || null;

    // Map RPC assignments to StudentAssignment interface
    const rpcAssignments = rpcData.assignments || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mergedAssignments = rpcAssignments.map((assign: any) => ({
      ...assign,
      classroom_id: classroomId,
      teacher_user_id: classroom.teacher_user_id,
      created_by: classroom.teacher_user_id,
      created_at: assign.created_at || classroom.created_at,
      updated_at: assign.updated_at || classroom.updated_at,
      deleted_at: null,
    }));

    // Map RPC resources to ClassroomResource interface
    const rpcResources = rpcData.resources || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resources = rpcResources.map((res: any) => ({
      ...res,
      classroom_id: classroomId,
      teacher_user_id: classroom.teacher_user_id,
      updated_at: res.created_at || classroom.created_at,
      deleted_at: null,
    }));

    // Map RPC announcements to ClassroomAnnouncement interface
    const rpcAnnouncements = rpcData.announcements || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const announcements = rpcAnnouncements.map((ann: any) => ({
      ...ann,
      classroom_id: classroomId,
      teacher_user_id: classroom.teacher_user_id,
      updated_at: ann.created_at || classroom.created_at,
      deleted_at: null,
    }));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { teacher: _, ...classroomMetadata } = classroom;
    const mergedData = {
      classroom: {
        ...classroomMetadata,
        teacher: teacher,
      },
      assignments: mergedAssignments,
      resources: resources,
      announcements: announcements,
    };

    return { success: true, data: mergedData };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load student classroom workspace.",
    };
  }
}

/**
 * Start assignment activity and track it as IN_PROGRESS (Kid only)
 */
export async function startAssignmentActivity(assignmentId: string) {
  try {
    const { userId } = await verifyUserRole("kid");
    const supabase = await createClient();

    // 1. Fetch assignment details
    const { data: assignment, error: assignErr } = await supabase
      .from("assignments")
      .select("classroom_id, status, due_date")
      .eq("id", assignmentId)
      .is("deleted_at", null)
      .single();

    if (assignErr || !assignment) {
      return { success: false, error: "Assignment not found or is no longer active." };
    }

    if (assignment.status !== "PUBLISHED") {
      return { success: false, error: "This assignment is not open yet." };
    }

    if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
      return { success: false, error: "This assignment is past its due date." };
    }

    // 2. Verify kid is approved student in the classroom
    const { data: member, error: memberErr } = await supabase
      .from("classroom_members")
      .select("id")
      .eq("classroom_id", assignment.classroom_id)
      .eq("student_user_id", userId)
      .eq("status", "APPROVED")
      .maybeSingle();

    if (memberErr || !member) {
      return { success: false, error: "You are not an approved member of this classroom." };
    }

    // 3. Check for existing submission
    const { data: existingSub, error: subErr } = await supabase
      .from("assignment_submissions")
      .select("*")
      .eq("assignment_id", assignmentId)
      .eq("student_user_id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (subErr) return { success: false, error: subErr.message };
    if (existingSub) {
      return { success: true, submission: existingSub };
    }

    // 4. Create new placeholder submission (IN_PROGRESS status represented implicitly)
    const { data: newSub, error: createErr } = await supabase
      .from("assignment_submissions")
      .insert({
        assignment_id: assignmentId,
        student_user_id: userId,
        submission_type: "TEXT",
        submission_text: "Activity Started",
        score: null,
      })
      .select()
      .single();

    if (createErr) return { success: false, error: createErr.message };

    revalidatePath(`/dashboard/kid/classrooms/${assignment.classroom_id}`);
    return { success: true, submission: newSub };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to start assignment activity.",
    };
  }
}

/**
 * Submit assignment completion automatically upon gameplay finish (Kid only)
 */
export async function submitAssignmentActivityCompletion(
  assignmentId: string,
  scoreString: string
) {
  try {
    const { userId } = await verifyUserRole("kid");
    const supabase = await createClient();

    // 1. Calculate graded score percentage from gameplay accuracy percent (e.g. "80%")
    let percentage = 100;
    if (scoreString) {
      const percentMatch = scoreString.match(/([0-9]+)/);
      if (percentMatch) {
        percentage = parseInt(percentMatch[1], 10);
      }
    }

    // 2. Call the single atomic transactional RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc("submit_activity_assignment", {
      p_student_id: userId,
      p_assignment_id: assignmentId,
      p_percentage: percentage,
      p_timezone: "Asia/Kolkata",
    });

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    const result = rpcData as {
      success: boolean;
      error?: string;
      classroom_id?: string;
      reward_id?: string | null;
      submission_id?: string | null;
    } | null;
    if (!result || !result.success || !result.classroom_id) {
      return { success: false, error: result?.error || "Failed to complete assignment activity." };
    }

    revalidatePath(`/dashboard/kid/classrooms/${result.classroom_id}`);
    revalidatePath(`/dashboard/teacher/classrooms/${result.classroom_id}`);
    revalidatePath("/dashboard/kid");
    revalidatePath("/dashboard/parent");

    return {
      success: true,
      classroomId: result.classroom_id,
      rewardId: result.reward_id ?? null,
      submissionId: result.submission_id ?? null,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to complete assignment activity.",
    };
  }
}

/**
 * Update the submission_url of an assignment submission (Kid only)
 */
export async function updateAssignmentSubmissionUrl(submissionId: string, submissionUrl: string) {
  try {
    const { userId } = await verifyUserRole("kid");
    const supabase = await createClient();

    const { error } = await supabase
      .from("assignment_submissions")
      .update({ submission_url: submissionUrl })
      .eq("id", submissionId)
      .eq("student_user_id", userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update submission URL.",
    };
  }
}

/**
 * Fetch total number of published, uncompleted assignments across all classrooms the kid is approved in
 */
export async function getKidPendingAssignmentsCount(): Promise<number> {
  try {
    const { userId } = await verifyUserRole("kid");
    const supabase = await createClient();

    // Query active published assignments and the student's submission (if any) in a single joined select.
    // RLS automatically limits retrieved assignments to those in classrooms where the student is approved.
    const { data: assignments, error: assignErr } = await supabase
      .from("assignments")
      .select(
        `
        id,
        assignment_submissions!left(id, submitted_at)
      `
      )
      .eq("status", "PUBLISHED")
      .is("deleted_at", null)
      .eq("assignment_submissions.student_user_id", userId)
      .is("assignment_submissions.deleted_at", null);

    if (assignErr || !assignments) {
      console.error("Error fetching pending assignments count:", assignErr);
      return 0;
    }

    // A pending assignment has no approved submission with a valid submitted_at timestamp
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pendingCount = assignments.filter((a: any) => {
      const submissions = a.assignment_submissions || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasSubmission = submissions.some((s: any) => s.submitted_at !== null);
      return !hasSubmission;
    }).length;

    return pendingCount;
  } catch (err) {
    console.error("Failed to get pending assignments count:", err);
    return 0;
  }
}
