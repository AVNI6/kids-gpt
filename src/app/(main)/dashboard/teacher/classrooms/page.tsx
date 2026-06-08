import { Suspense } from "react";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getCurrentDashboardProfile } from "@/lib/services/kid/dashboard.actions";
import { getTeacherDashboardData } from "@/lib/services/kid/classroom.actions";
import { createClient } from "@/lib/supabase/server";
import TeacherClassrooms from "@/components/teacher/classrooms/TeacherClassrooms";
import NeedsAttention from "@/components/teacher/home/NeedsAttention";
import TeacherActivityFeed from "@/components/teacher/home/TeacherActivityFeed";
import { Skeleton } from "@/components/shared/ui/skeleton";
import { Card, CardContent } from "@/components/shared/ui/card";

function ClassroomsSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      {/* Classroom list Skeleton */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-48 rounded-full" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card
              key={i}
              className="rounded-[32px] border border-indigo-100/50 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
            >
              <CardContent className="p-6 flex flex-col gap-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-12 w-full rounded-2xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Action Center Skeleton */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-48 rounded-full" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card
              key={i}
              className="rounded-[28px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
            >
              <CardContent className="p-5">
                <Skeleton className="h-8 w-8 rounded-full mb-3" />
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Activity Feed Skeleton */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-48 rounded-full" />
        <Card className="rounded-[32px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-2 border-b last:border-0 border-slate-50 dark:border-slate-850"
              >
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function ClassroomsPageContent({ createOpen }: { createOpen: boolean }) {
  const profile = await getCurrentDashboardProfile();
  const { classrooms, students, pendingRequests } = await getTeacherDashboardData();
  const supabase = await createClient();

  // Fetch counts for classroom enrichment + pending grading count
  const [
    { data: assignmentsCountsData },
    { data: resourcesCountsData },
    { data: announcementsCountsData },
    { count: pendingGradingCount },
  ] = await Promise.all([
    supabase
      .from("assignments")
      .select("classroom_id")
      .eq("teacher_user_id", profile.user_id)
      .eq("status", "PUBLISHED")
      .is("deleted_at", null),
    supabase
      .from("classroom_resources")
      .select("classroom_id")
      .eq("teacher_user_id", profile.user_id)
      .is("deleted_at", null),
    supabase
      .from("announcements")
      .select("classroom_id")
      .eq("teacher_user_id", profile.user_id)
      .is("deleted_at", null),
    supabase
      .from("assignment_submissions")
      .select("id, assignments!inner(teacher_user_id)", { count: "exact", head: true })
      .eq("assignments.teacher_user_id", profile.user_id)
      .is("score", null)
      .is("deleted_at", null)
      .is("assignments.deleted_at", null),
  ]);

  // Build count maps
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

  const enrichedClassrooms = classrooms.map((c) => ({
    ...c,
    students_count: studentsCountMap.get(c.id)?.size || 0,
    assignments_count: assignmentsCountMap.get(c.id) || 0,
    resources_count: resourcesCountMap.get(c.id) || 0,
    announcements_count: announcementsCountMap.get(c.id) || 0,
  }));

  // Calculate Needs Attention properties
  const pendingGrading = pendingGradingCount || 0;
  const emptyAnnouncementClassroomsCount = enrichedClassrooms.filter(
    (c) => c.announcements_count === 0
  ).length;

  // Fetch activity events feed (using RPC with fallback to raw query)
  let activityEvents = [];
  try {
    const { data, error } = await supabase.rpc("get_teacher_activity_feed");
    if (!error && data) {
      activityEvents = data;
    } else {
      console.warn("RPC get_teacher_activity_feed failed, falling back to manual query.", error);
      const { data: fallbackEvents } = await supabase
        .from("activity_events")
        .select(
          `
          id,
          event_type,
          actor_user_id,
          actor_role,
          source_type,
          source_id,
          metadata,
          created_at
        `
        )
        .order("created_at", { ascending: false })
        .limit(20);
      activityEvents = fallbackEvents || [];
    }
  } catch (err) {
    console.warn("RPC get_teacher_activity_feed threw error, falling back to manual query.", err);
    const { data: fallbackEvents } = await supabase
      .from("activity_events")
      .select(
        `
        id,
        event_type,
        actor_user_id,
        actor_role,
        source_type,
        source_id,
        metadata,
        created_at
      `
      )
      .order("created_at", { ascending: false })
      .limit(20);
    activityEvents = fallbackEvents || [];
  }

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <TeacherClassrooms classrooms={enrichedClassrooms} createOpen={createOpen} />
      <NeedsAttention
        pendingRequests={pendingRequests}
        pendingGrading={pendingGrading}
        emptyAnnouncementClassroomsCount={emptyAnnouncementClassroomsCount}
      />
      <TeacherActivityFeed activityEvents={activityEvents} />
    </div>
  );
}

export default async function TeacherClassroomsPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  await checkDashboardAccess(["teacher"]);
  const { create } = await searchParams;
  const shouldOpenCreate = create === "true";

  return (
    <Suspense fallback={<ClassroomsSkeleton />}>
      <ClassroomsPageContent createOpen={shouldOpenCreate} />
    </Suspense>
  );
}
