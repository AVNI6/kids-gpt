export type EnrollmentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Classroom {
  id: string;
  teacher_user_id: string;
  name: string;
  description: string | null;
  subject: string | null;
  grade: string | null;
  class_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ClassroomMember {
  id: string;
  classroom_id: string;
  student_user_id: string;
  status: EnrollmentStatus;
  joined_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassroomNotification {
  id: string;
  recipient_user_id: string;
  recipient_role: "parent" | "kid" | "teacher";
  type: string;
  title: string;
  message: string;
  source_type: string | null;
  source_id: string | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApprovedStudent {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  total_experience_points: number | null;
  current_streak: number | null;
  classroom_name: string;
  classroom_id: string;
}

export interface PendingEnrollmentRequest {
  member_link_id: string;
  classroom_id: string;
  classroom_name: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  requested_at: string;
}

export interface TeacherDashboardData {
  classrooms: Classroom[];
  students: ApprovedStudent[];
  pendingRequests: PendingEnrollmentRequest[];
}

export interface KidClassroomMembership {
  id: string;
  status: EnrollmentStatus;
  classroom_id: string;
  classrooms: Classroom & {
    teacher: {
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
    } | null;
  };
}

export interface ClassroomAssignment {
  id: string;
  classroom_id: string;
  teacher_user_id: string;
  created_by: string;
  title: string;
  description: string | null;
  subject: string | null;
  total_points: number;
  due_date: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  published_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  activity_type?: string | null;
  topic?: string | null;
  difficulty?: string | null;
  question_count?: number | null;
  total_students?: number;
  submissions_count?: number;
  average_score?: number;
}

export interface StudentAssignment extends ClassroomAssignment {
  submission_id: string | null;
  submission_type: "TEXT" | "PDF" | "IMAGE" | "LINK" | null;
  submission_text: string | null;
  submission_url: string | null;
  submitted_at: string | null;
  score: number | null;
  feedback: string | null;
  graded_at: string | null;
}

export interface ClassroomResource {
  id: string;
  classroom_id: string;
  teacher_user_id: string;
  title: string;
  description: string | null;
  resource_type: "PDF" | "VIDEO" | "LINK" | "DOCUMENT";
  resource_url: string;
  storage_path: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ClassroomAnnouncement {
  id: string;
  classroom_id: string;
  teacher_user_id: string;
  title: string;
  message: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WorkspaceStudent {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  total_experience_points: number | null;
  current_streak: number;
  joined_at: string;
  approved_at: string | null;
}

export interface StudentWorkspaceData {
  assignments: StudentAssignment[];
  resources: ClassroomResource[];
  announcements: ClassroomAnnouncement[];
}

export interface TeacherWorkspaceData {
  classroom: Classroom;
  assignments: ClassroomAssignment[];
  resources: ClassroomResource[];
  announcements: ClassroomAnnouncement[];
  students: WorkspaceStudent[];
}

export interface SubmissionDetails {
  id: string;
  student_user_id: string;
  submission_type: "TEXT" | "PDF" | "IMAGE" | "LINK";
  submission_text: string | null;
  submission_url: string | null;
  submitted_at: string;
  score: number | null;
  feedback: string | null;
  graded_at: string | null;
  graded_by: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export interface TeacherAssignmentOverview {
  assignment: ClassroomAssignment;
  submitted_count: number;
  graded_count: number;
  pending_count: number;
  submissions: SubmissionDetails[];
}
