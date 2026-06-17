import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getCurrentDashboardProfile } from "@/lib/services/kid/dashboard.actions";
import { getTeacherDashboardData } from "@/lib/services/kid/classroom.actions";
import { createClient } from "@/lib/supabase/server";
import TeacherDashboardContainer from "@/components/teacher/home/TeacherDashboardContainer";

function HeroBannerSkeleton() {
  return (
    <Card className="rounded-[32px] border-0 relative bg-white dark:bg-black/30 shadow-md p-8 md:p-10 transition-colors duration-300">
      <CardContent className="p-0 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Welcome greeting left */}
        <div className="flex-1 space-y-4 w-full">
          <div className="space-y-3">
            <Skeleton className="h-10 md:h-12 w-2/3 rounded-xl" />
            <Skeleton className="h-5 w-1/4 rounded-lg" />
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full max-w-xl rounded" />
            <Skeleton className="h-4 w-5/6 max-w-lg rounded" />
          </div>
        </div>

        {/* Classroom Summary Card right */}
        <div className="shrink-0 flex flex-col items-stretch gap-4 bg-slate-50/50 dark:bg-black/30 border border-slate-100 dark:border-slate-850 p-6 rounded-[28px] shadow-sm min-w-[280px] w-full lg:w-auto">
          <Skeleton className="h-5 w-36 rounded-full" />
          <div className="grid grid-cols-2 gap-4 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-6 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-5 w-40 rounded" />
        </div>
        <Skeleton className="h-4 w-2/3 pl-6 rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Card
            key={idx}
            className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm overflow-hidden"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-6 w-12 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BottomGridSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* Recent Classrooms */}
      <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm">
        <CardContent className="p-5 md:p-6 flex flex-col gap-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
          </div>
          <Skeleton className="h-3.5 w-40 rounded" />
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900/60 p-1.5 pr-3.5 rounded-full border border-slate-150/60 dark:border-slate-800 shadow-sm w-36"
              >
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-2 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today Snapshot */}
      <Card className="rounded-[32px] border-slate-250/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm">
        <CardContent className="p-5 md:p-6 flex flex-col gap-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3.5 space-y-1.5">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-3 w-56 rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3.5 p-4 rounded-[22px] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 h-18"
              >
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton className="h-2.5 w-16 rounded" />
                  <Skeleton className="h-5 w-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
        <div className="flex flex-col gap-10">
          <HeroBannerSkeleton />
          <PerformanceOverviewSkeleton />
          <BottomGridSkeleton />
        </div>
      }
    >
      <TeacherDashboardContent />
    </Suspense>
  );
}
