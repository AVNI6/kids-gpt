"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUserRole } from "../dashboard.actions";
import { verifyClassroomTeacher } from "./classroom-base.actions";

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

/**
 * Fetch classroom assignments only (Teacher only)
 */
export async function getTeacherClassroomAssignments(classroomId: string) {
  try {
    const { userId } = await verifyUserRole("teacher");
    const supabase = await createClient();
    if (!(await verifyClassroomTeacher(supabase, classroomId, userId))) {
      return { success: false, error: "Unauthorized." };
    }
    const { data, error } = await supabase
      .from("assignments")
      .select(
        "id, classroom_id, teacher_user_id, created_by, title, description, subject, total_points, due_date, status, published_at, closed_at, created_at, updated_at, deleted_at, activity_type, topic, difficulty, question_count"
      )
      .eq("classroom_id", classroomId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load assignments.",
    };
  }
}

/**
 * Fetch classroom assignments and submissions (Student only)
 */
export async function getStudentClassroomAssignments(classroomId: string) {
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

    // Fetch classroom teacher details
    const { data: classroom, error: classErr } = await adminSupabase
      .from("classrooms")
      .select("teacher_user_id, created_at, updated_at")
      .eq("id", classroomId)
      .single();
    if (classErr || !classroom) throw classErr || new Error("Classroom not found");

    // Fetch assignments and student's submissions
    const [assignmentsResult, submissionsResult] = await Promise.all([
      supabase
        .from("assignments")
        .select(
          "id, title, description, subject, total_points, due_date, status, published_at, closed_at, created_at, updated_at, activity_type, topic, difficulty, question_count"
        )
        .eq("classroom_id", classroomId)
        .eq("status", "PUBLISHED")
        .is("deleted_at", null)
        .order("due_date", { ascending: true }),
      supabase
        .from("assignment_submissions")
        .select(
          "id, assignment_id, submission_type, submission_text, submission_url, submitted_at, score, feedback, graded_at"
        )
        .eq("student_user_id", userId)
        .is("deleted_at", null),
    ]);

    if (assignmentsResult.error) throw assignmentsResult.error;
    if (submissionsResult.error) throw submissionsResult.error;

    const submissionsMap = new Map(
      (submissionsResult.data || []).map((sub) => [sub.assignment_id, sub])
    );

    const mergedAssignments = (assignmentsResult.data || []).map((assign) => {
      const sub = submissionsMap.get(assign.id);
      return {
        ...assign,
        classroom_id: classroomId,
        teacher_user_id: classroom.teacher_user_id,
        created_by: classroom.teacher_user_id,
        created_at: assign.created_at || classroom.created_at,
        updated_at: assign.updated_at || classroom.updated_at,
        deleted_at: null,
        submission_id: sub ? sub.id : null,
        submission_type: sub ? sub.submission_type : null,
        submission_text: sub ? sub.submission_text : null,
        submission_url: sub ? sub.submission_url : null,
        submitted_at: sub ? sub.submitted_at : null,
        score: sub ? sub.score : null,
        feedback: sub ? sub.feedback : null,
        graded_at: sub ? sub.graded_at : null,
      };
    });

    return { success: true, data: mergedAssignments };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load assignments.",
    };
  }
}
