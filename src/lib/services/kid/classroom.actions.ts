"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();

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
          teacher_user_id
        )
      `
      )
      .eq("student_user_id", userId);

    if (error) {
      return { success: false, error: error.message, memberships: [] };
    }

    // For each classroom, fetch the teacher profile to avoid complex FKEY naming issues in standard joins
    const membershipsWithTeachersRaw = await Promise.all(
      (data || []).map(async (member) => {
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
        } | null;

        if (!classroom) return null;

        const { data: teacherProfile } = await supabase
          .from("profile")
          .select("first_name, last_name, avatar_url")
          .eq("user_id", classroom.teacher_user_id)
          .maybeSingle();

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
      })
    );

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
 * Publish an assignment (Teacher only)
 */
export async function publishAssignment(assignmentId: string) {
  try {
    const { userId } = await verifyUserRole("teacher");
    const supabase = await createClient();

    // 1. Fetch assignment details
    const { data: assignment, error: getErr } = await supabase
      .from("assignments")
      .select("classroom_id, title, status")
      .eq("id", assignmentId)
      .single();

    if (getErr || !assignment) {
      return { success: false, error: "Assignment not found." };
    }

    if (assignment.status !== "DRAFT") {
      return { success: false, error: "Only draft assignments can be published." };
    }

    // 2. Update status
    const { error: updateErr } = await supabase
      .from("assignments")
      .update({
        status: "PUBLISHED",
        published_at: new Date().toISOString(),
      })
      .eq("id", assignmentId);

    if (updateErr) return { success: false, error: updateErr.message };

    // 3. Fetch approved students in classroom
    const { data: members } = await supabase
      .from("classroom_members")
      .select("student_user_id")
      .eq("classroom_id", assignment.classroom_id)
      .eq("status", "APPROVED");

    const eventData = {
      actor_user_id: userId,
      actor_role: "teacher" as const,
      target_user_id: null,
      target_type: "classroom",
      event_type: "ASSIGNMENT_CREATED",
      source_type: "assignments",
      source_id: assignmentId,
      metadata: { title: assignment.title, classroom_id: assignment.classroom_id },
    };

    await supabase.from("activity_events").insert(eventData);

    if (members && members.length > 0) {
      const notificationsData = members.map((m) => ({
        recipient_user_id: m.student_user_id,
        recipient_role: "kid" as const,
        type: "ASSIGNMENT_PUBLISHED",
        title: "New Assignment Available",
        message: `Your teacher published a new assignment: "${assignment.title}".`,
        source_type: "assignments",
        source_id: assignmentId,
        metadata: { classroom_id: assignment.classroom_id },
      }));
      await supabase.from("notifications").insert(notificationsData);
    }

    revalidatePath(`/dashboard/teacher/classrooms/${assignment.classroom_id}`);
    revalidatePath(`/dashboard/kid/classrooms/${assignment.classroom_id}`);
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

    // Verify assignment is active
    const { data: assign, error: assignErr } = await supabase
      .from("assignments")
      .select("title, classroom_id, teacher_user_id, status")
      .eq("id", assignmentId)
      .is("deleted_at", null)
      .single();

    if (assignErr || !assign) {
      return { success: false, error: "Assignment not found or is no longer active." };
    }

    if (assign.status !== "PUBLISHED") {
      return { success: false, error: "This assignment is not open for submissions." };
    }

    // Insert submission
    const { data: submission, error: subErr } = await supabase
      .from("assignment_submissions")
      .insert({
        assignment_id: assignmentId,
        student_user_id: userId,
        submission_type: submissionType,
        submission_text: submissionText,
        submission_url: submissionUrl,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (subErr) return { success: false, error: subErr.message };

    // Log event
    await supabase.from("activity_events").insert({
      actor_user_id: userId,
      actor_role: "kid",
      target_user_id: assign.teacher_user_id,
      target_type: "classroom",
      event_type: "ASSIGNMENT_SUBMITTED",
      source_type: "assignment_submissions",
      source_id: submission.id,
      metadata: {
        assignment_id: assignmentId,
        title: assign.title,
        classroom_id: assign.classroom_id,
      },
    });

    revalidatePath(`/dashboard/kid/classrooms/${assign.classroom_id}`);
    revalidatePath(`/dashboard/teacher/classrooms/${assign.classroom_id}`);
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

    // 1. Fetch submission details
    const { data: submission, error: subErr } = await supabase
      .from("assignment_submissions")
      .select("assignment_id, student_user_id, score")
      .eq("id", submissionId)
      .is("deleted_at", null)
      .single();

    if (subErr || !submission) {
      return { success: false, error: "Submission not found." };
    }

    // 2. Fetch assignment
    const { data: assignment, error: assignErr } = await supabase
      .from("assignments")
      .select("title, total_points, classroom_id, activity_type")
      .eq("id", submission.assignment_id)
      .single();

    if (assignErr || !assignment) {
      return { success: false, error: "Assignment not found." };
    }

    if (assignment.activity_type) {
      return { success: false, error: "Auto-graded assignments cannot be graded manually." };
    }

    if (score < 0 || score > assignment.total_points) {
      return { success: false, error: `Score must be between 0 and ${assignment.total_points}.` };
    }

    const scorePercent = Math.round((score / assignment.total_points) * 100);

    // 3. Update grading
    const { error: gradeErr } = await supabase
      .from("assignment_submissions")
      .update({
        score,
        feedback: feedback?.trim() || null,
        graded_at: new Date().toISOString(),
        graded_by: userId,
      })
      .eq("id", submissionId);

    if (gradeErr) return { success: false, error: gradeErr.message };

    // 4. Log event
    await supabase.from("activity_events").insert({
      actor_user_id: userId,
      actor_role: "teacher",
      target_user_id: submission.student_user_id,
      target_type: "classroom",
      event_type: "ASSIGNMENT_GRADED",
      source_type: "assignment_submissions",
      source_id: submissionId,
      metadata: {
        score,
        total_points: assignment.total_points,
        title: assignment.title,
        classroom_id: assignment.classroom_id,
      },
    });

    // 5. Notify kid
    await supabase.from("notifications").insert({
      recipient_user_id: submission.student_user_id,
      recipient_role: "kid",
      type: "ASSIGNMENT_GRADED",
      title: "Assignment Graded",
      message: `Your assignment "${assignment.title}" has been graded. Score: ${scorePercent}%`,
      source_type: "assignment_submissions",
      source_id: submissionId,
      metadata: { classroom_id: assignment.classroom_id },
    });

    // 6. Award XP! (Check for existing reward, calculate delta, and update kid profile total XP)
    // NOTE: source_id must reference activity_settings(id) per FK constraint — use null for assignment rewards.
    //       Idempotency is checked via the assignment_id column (added in MVP migration).
    const { data: existingReward, error: rewardErr } = await supabase
      .from("rewards")
      .select("id, rewards_amount")
      .eq("user_id", submission.student_user_id)
      .eq("source_type", "assignment")
      .eq("assignment_id", submission.assignment_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (rewardErr) return { success: false, error: rewardErr.message };

    let xpDelta = score;

    if (existingReward) {
      xpDelta = score - (existingReward.rewards_amount || 0);

      const { error: updRewardErr } = await supabase
        .from("rewards")
        .update({
          rewards_amount: score,
          description: `Earned XP for Assignment: "${assignment.title}" (Score: ${scorePercent}%)`,
          score: scorePercent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingReward.id);

      if (updRewardErr) return { success: false, error: updRewardErr.message };
    } else {
      const { error: insRewardErr } = await supabase.from("rewards").insert({
        user_id: submission.student_user_id,
        rewards_amount: score,
        source_type: "assignment",
        source_id: null, // FK references activity_settings(id); assignment IDs are not valid — use null
        assignment_id: submission.assignment_id,
        description: `Earned XP for Assignment: "${assignment.title}" (Score: ${scorePercent}%)`,
        score: scorePercent,
      });

      if (insRewardErr) return { success: false, error: insRewardErr.message };
    }

    const { data: profile } = await supabase
      .from("profile")
      .select("total_experience_points")
      .eq("user_id", submission.student_user_id)
      .single();

    const newXp = (profile?.total_experience_points || 0) + xpDelta;
    await supabase
      .from("profile")
      .update({ total_experience_points: newXp })
      .eq("user_id", submission.student_user_id);

    revalidatePath(`/dashboard/teacher/classrooms/${assignment.classroom_id}`);
    revalidatePath(`/dashboard/kid/classrooms/${assignment.classroom_id}`);
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
    const supabase = await createClient();

    // 1. Fetch classroom metadata
    const { data: classroom, error: classErr } = await supabase
      .from("classrooms")
      .select(
        `
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
        deleted_at
      `
      )
      .eq("id", classroomId)
      .is("deleted_at", null)
      .single();

    if (classErr || !classroom) {
      throw new Error(classErr?.message || "Classroom not found.");
    }

    // 2. Fetch teacher profile details
    const { data: teacher } = await supabase
      .from("profile")
      .select("first_name, last_name, avatar_url")
      .eq("user_id", classroom.teacher_user_id)
      .single();

    // 3. Fetch RPC data for assignments, resources, announcements
    const { data: rpcData, error } = await supabase.rpc("get_student_classroom_workspace", {
      p_classroom_id: classroomId,
    });

    if (error) throw new Error(error.message);

    const mergedData = {
      classroom: {
        ...classroom,
        teacher: teacher || null,
      },
      assignments: rpcData.assignments || [],
      resources: rpcData.resources || [],
      announcements: rpcData.announcements || [],
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

    // Import helper modules inside action to avoid Next.js circular dependencies
    const { calculateUpdatedStreak } = await import("@/lib/utils/streak-helper");
    const { createParentNotification } = await import("@/lib/services/kid/dashboard.actions");

    // 1. Fetch assignment details
    const { data: assignment, error: assignErr } = await supabase
      .from("assignments")
      .select(
        "id, classroom_id, teacher_user_id, title, total_points, due_date, subject, status, activity_type"
      )
      .eq("id", assignmentId)
      .is("deleted_at", null)
      .single();

    if (assignErr || !assignment) {
      return { success: false, error: "Assignment not found." };
    }

    if (assignment.status !== "PUBLISHED") {
      return { success: false, error: "Assignment is not open for completions." };
    }

    if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
      return { success: false, error: "This assignment is past its due date." };
    }

    // 2. Verify classroom membership
    const { data: member } = await supabase
      .from("classroom_members")
      .select("id")
      .eq("classroom_id", assignment.classroom_id)
      .eq("student_user_id", userId)
      .eq("status", "APPROVED")
      .maybeSingle();

    if (!member) {
      return { success: false, error: "You are not an approved member of this classroom." };
    }

    // 3. Fetch existing submission to check if already completed
    const { data: submission } = await supabase
      .from("assignment_submissions")
      .select("*")
      .eq("assignment_id", assignmentId)
      .eq("student_user_id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (submission && submission.score !== null && submission.submitted_at !== null) {
      return { success: false, error: "This assignment has already been completed." };
    }

    // 4. Calculate graded score from gameplay accuracy percent (e.g. "80%")
    let percentage = 100;
    if (scoreString) {
      const percentMatch = scoreString.match(/([0-9]+)/);
      if (percentMatch) {
        percentage = parseInt(percentMatch[1], 10);
      }
    }
    const gradedScore = Math.round(assignment.total_points * (percentage / 100));

    // 5. Update submission
    let subId = submission?.id;
    if (!submission) {
      const { data: newSub, error: createSubErr } = await supabase
        .from("assignment_submissions")
        .insert({
          assignment_id: assignmentId,
          student_user_id: userId,
          submission_type: "TEXT",
          submission_text: "Completed activity",
          score: gradedScore,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createSubErr) return { success: false, error: createSubErr.message };
      subId = newSub.id;
    } else {
      const { error: updSubErr } = await supabase
        .from("assignment_submissions")
        .update({
          score: gradedScore,
          submitted_at: new Date().toISOString(),
          submission_text: "Completed activity",
        })
        .eq("id", submission.id);

      if (updSubErr) return { success: false, error: updSubErr.message };
    }

    // 6. Check for existing reward row to guarantee idempotency & avoid duplicate XP
    const { data: existingReward } = await supabase
      .from("rewards")
      .select("id")
      .eq("user_id", userId)
      .eq("source_type", "assignment")
      .eq("assignment_id", assignmentId)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingReward) {
      return { success: true, classroomId: assignment.classroom_id }; // Already logged rewards, aborting to prevent duplication
    }

    // Fetch corresponding activity setting to resolve default title
    const { data: activitySetting } = await supabase
      .from("activity_settings")
      .select("id, title")
      .eq("slug", assignment.activity_type)
      .maybeSingle();

    const desc = `Completed ${activitySetting?.title || "Activity"}
for Assignment:
${assignment.title}
[[${assignment.subject || "General"}]]
(Score: ${percentage}%)`;

    // Fetch previous last reward date before inserting the new one to calculate streak correctly
    const { data: lastRewards } = await supabase
      .from("rewards")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    const lastRewardDate = lastRewards && lastRewards.length > 0 ? lastRewards[0].created_at : null;

    // 7. Insert reward record
    const { error: insRewardErr } = await supabase.from("rewards").insert({
      user_id: userId,
      rewards_amount: gradedScore,
      source_id: activitySetting?.id || null,
      source_type: "assignment",
      assignment_id: assignmentId,
      description: desc,
      score: percentage,
    });

    if (insRewardErr) {
      if (
        insRewardErr.code === "23505" ||
        insRewardErr.message?.includes("uq_rewards_assignment_user")
      ) {
        return { success: true, classroomId: assignment.classroom_id };
      }
      return { success: false, error: insRewardErr.message };
    }

    // 8. Update kid profile XP and daily streak index
    const { data: profile } = await supabase
      .from("profile")
      .select("total_experience_points, current_streak, longest_streak")
      .eq("user_id", userId)
      .single();

    const newXp = (profile?.total_experience_points || 0) + gradedScore;

    const { currentStreak, longestStreak } = calculateUpdatedStreak(
      lastRewardDate,
      profile?.current_streak ?? 0,
      profile?.longest_streak ?? 0,
      "Asia/Kolkata"
    );

    const { error: profUpdErr } = await supabase
      .from("profile")
      .update({
        total_experience_points: newXp,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (profUpdErr) return { success: false, error: profUpdErr.message };

    // 9. Log event in activity_events
    await supabase.from("activity_events").insert({
      actor_user_id: userId,
      actor_role: "kid",
      target_user_id: assignment.teacher_user_id,
      target_type: "classroom",
      event_type: "ASSIGNMENT_SUBMITTED",
      source_type: "assignment_submissions",
      source_id: subId,
      metadata: {
        assignment_id: assignmentId,
        title: assignment.title,
        classroom_id: assignment.classroom_id,
        score: gradedScore,
      },
    });

    // 10. Notify teacher and parent
    const { data: kidProfile } = await supabase
      .from("profile")
      .select("first_name, last_name")
      .eq("user_id", userId)
      .single();

    const kidName =
      `${kidProfile?.first_name || ""} ${kidProfile?.last_name || ""}`.trim() || "A student";

    await supabase.from("notifications").insert({
      recipient_user_id: assignment.teacher_user_id,
      recipient_role: "teacher",
      type: "ASSIGNMENT_COMPLETED",
      title: "Assignment Completed",
      message: `${kidName} completed assignment "${assignment.title}". Score: ${percentage}%`,
      source_type: "assignments",
      source_id: assignmentId,
      metadata: { classroom_id: assignment.classroom_id },
    });

    await createParentNotification(
      userId,
      "quiz_completed",
      "Assignment Completed",
      `${kidName} completed Assignment: "${assignment.title}" (Score: ${percentage}%)`,
      { assignment_id: assignmentId }
    );

    revalidatePath(`/dashboard/kid/classrooms/${assignment.classroom_id}`);
    revalidatePath(`/dashboard/teacher/classrooms/${assignment.classroom_id}`);
    revalidatePath("/dashboard/kid");
    revalidatePath("/dashboard/parent");

    return { success: true, classroomId: assignment.classroom_id };
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

    // Fetch classrooms student is approved in
    const { data: members, error: memberErr } = await supabase
      .from("classroom_members")
      .select("classroom_id")
      .eq("student_user_id", userId)
      .eq("status", "APPROVED");

    if (memberErr || !members || members.length === 0) {
      return 0;
    }

    const classroomIds = members.map((m) => m.classroom_id);

    // Fetch active published assignments in those classrooms
    const { data: assignments, error: assignErr } = await supabase
      .from("assignments")
      .select("id")
      .in("classroom_id", classroomIds)
      .eq("status", "PUBLISHED")
      .is("deleted_at", null);

    if (assignErr || !assignments || assignments.length === 0) {
      return 0;
    }

    const assignmentIds = assignments.map((a) => a.id);

    // Fetch completed submissions for these assignments
    const { data: submissions, error: subErr } = await supabase
      .from("assignment_submissions")
      .select("assignment_id")
      .in("assignment_id", assignmentIds)
      .eq("student_user_id", userId)
      .not("submitted_at", "is", null)
      .is("deleted_at", null);

    if (subErr) {
      return assignments.length;
    }

    const completedAssignmentIds = new Set((submissions || []).map((s) => s.assignment_id));
    const pendingCount = assignments.filter((a) => !completedAssignmentIds.has(a.id)).length;

    return pendingCount;
  } catch (err) {
    console.error("Failed to get pending assignments count:", err);
    return 0;
  }
}
