import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getCurrentDashboardProfile } from "@/lib/services/kid/dashboard.actions";
import { getTeacherDashboardData } from "@/lib/services/kid/classroom.actions";
import { createClient } from "@/lib/supabase/server";
import TeacherDashboardContainer from "@/components/teacher/home/TeacherDashboardContainer";

interface TeacherDashboardAnalyticsResponse {
  published_assignments_count: number;
  pending_grading_count: number;
  resources_uploaded_count: number;
  announcements_posted_count: number;
  assignments_classroom_ids: string[];
  resources_classroom_ids: string[];
  announcements_classroom_ids: string[];
  active_students_today_count: number;
  assignments_submitted_today_count: number;
  assignments_graded_today_count: number;
  announcements_posted_today_count: number;
}

async function TeacherDashboardContent() {
  await checkDashboardAccess(["teacher"]);
  const supabase = await createClient();

  const [profile, dashboardData, analyticsResult] = await Promise.all([
    getCurrentDashboardProfile(),
    getTeacherDashboardData(),
    supabase.rpc("get_teacher_dashboard_analytics"),
  ]);

  const { classrooms, students, pendingRequests } = dashboardData;
  const { data: analytics, error: analyticsError } = analyticsResult as {
    data: TeacherDashboardAnalyticsResponse | null;
    error: { message: string } | null;
  };

  if (analyticsError || !analytics) {
    throw new Error(
      "Failed to load teacher dashboard analytics: " + (analyticsError?.message || "No data")
    );
  }

  const publishedAssignmentsCount = analytics.published_assignments_count;
  const pendingGradingCount = analytics.pending_grading_count;
  const resourcesUploadedCount = analytics.resources_uploaded_count;
  const announcementsPostedCount = analytics.announcements_posted_count;

  // Format groupings to match the structure expected by the downstream map-building loop
  const assignmentsCountsData = (analytics.assignments_classroom_ids || []).map((id: string) => ({
    classroom_id: id,
  }));
  const resourcesCountsData = (analytics.resources_classroom_ids || []).map((id: string) => ({
    classroom_id: id,
  }));
  const announcementsCountsData = (analytics.announcements_classroom_ids || []).map(
    (id: string) => ({ classroom_id: id })
  );

  const activeStudentsTodayCount = analytics.active_students_today_count;
  const assignmentsSubmittedTodayCount = analytics.assignments_submitted_today_count;
  const assignmentsGradedTodayCount = analytics.assignments_graded_today_count;
  const announcementsPostedTodayCount = analytics.announcements_posted_today_count;

  // Map groupings to maps
  const studentsCountMap = new Map<string, Set<string>>();
  students.forEach((s) => {
    const set = studentsCountMap.get(s.classroom_id) || new Set<string>();
    set.add(s.user_id);
    studentsCountMap.set(s.classroom_id, set);
  });

  const assignmentsCountMap = new Map<string, number>();
  (assignmentsCountsData || []).forEach((a) => {
    assignmentsCountMap.set(a.classroom_id, (assignmentsCountMap.get(a.classroom_id) || 0) + 1);
  });

  const resourcesCountMap = new Map<string, number>();
  (resourcesCountsData || []).forEach((r) => {
    resourcesCountMap.set(r.classroom_id, (resourcesCountMap.get(r.classroom_id) || 0) + 1);
  });

  const announcementsCountMap = new Map<string, number>();
  (announcementsCountsData || []).forEach((a) => {
    announcementsCountMap.set(a.classroom_id, (announcementsCountMap.get(a.classroom_id) || 0) + 1);
  });

  // Enrich classrooms
  const enrichedClassrooms = classrooms.map((c) => ({
    ...c,
    students_count: studentsCountMap.get(c.id)?.size || 0,
    assignments_count: assignmentsCountMap.get(c.id) || 0,
    resources_count: resourcesCountMap.get(c.id) || 0,
    announcements_count: announcementsCountMap.get(c.id) || 0,
  }));

  const teacherStudentIds = new Set(students.map((s) => s.user_id));

  // Aggregate stats
  const metrics = {
    activeClassrooms: classrooms.length,
    enrolledStudents: teacherStudentIds.size,
    publishedAssignments: publishedAssignmentsCount || 0,
    pendingGrading: pendingGradingCount || 0,
    resourcesUploaded: resourcesUploadedCount || 0,
    announcementsPosted: announcementsPostedCount || 0,
  };

  const snapshot = {
    activeStudentsToday: activeStudentsTodayCount,
    assignmentsSubmittedToday: assignmentsSubmittedTodayCount || 0,
    assignmentsGradedToday: assignmentsGradedTodayCount || 0,
    announcementsPostedToday: announcementsPostedTodayCount || 0,
  };

  return (
    <TeacherDashboardContainer
      profile={profile}
      classrooms={enrichedClassrooms}
      pendingRequests={pendingRequests}
      students={students}
      metrics={metrics}
      snapshot={snapshot}
    />
  );
}

export default async function TeacherDashboardPage() {
  return <TeacherDashboardContent />;
}
