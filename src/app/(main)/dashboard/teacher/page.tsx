import { Suspense } from "react";
import { Card, CardContent } from "@/components/shared/ui/card";
import { Skeleton } from "@/components/shared/ui/skeleton";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getCurrentDashboardProfile } from "@/lib/services/kid/dashboard.actions";
import { getTeacherDashboardData } from "@/lib/services/kid/classroom.actions";
import { createClient } from "@/lib/supabase/server";
import TeacherDashboardContainer from "@/components/teacher/home/TeacherDashboardContainer";

function HeroBannerSkeleton() {
  return (
    <Card className="rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 bg-slate-100/50 dark:bg-slate-900/50 p-8 shadow-sm">
      <CardContent className="p-0 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex-1 flex flex-col lg:flex-row items-center gap-6 w-full">
          <Skeleton className="h-24 w-24 md:h-28 md:w-28 rounded-full shrink-0" />
          <div className="space-y-3 flex-1 w-full max-w-md">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-10 w-36 rounded-full" />
              <Skeleton className="h-10 w-36 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentListSkeleton() {
  return (
    <Card className="rounded-[32px] border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ClassroomsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card
            key={i}
            className="rounded-[32px] border border-indigo-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
          >
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

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
  const profile = await getCurrentDashboardProfile();
  const { classrooms, students, pendingRequests } = await getTeacherDashboardData();
  const supabase = await createClient();

  // Call the consolidated database analytics RPC
  const { data: analytics, error: analyticsError } = (await supabase.rpc(
    "get_teacher_dashboard_analytics"
  )) as { data: TeacherDashboardAnalyticsResponse | null; error: { message: string } | null };

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
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-8">
          <HeroBannerSkeleton />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ClassroomsSkeleton />
            </div>
            <div>
              <StudentListSkeleton />
            </div>
          </div>
        </div>
      }
    >
      <TeacherDashboardContent />
    </Suspense>
  );
}
