import { Suspense } from "react";
import { getCurrentDashboardProfile } from "@/actions/dashboard.actions";
import { getTeacherDashboardData } from "@/actions/classroom.actions";
import { createClient } from "@/lib/supabase/server";
import TeacherDashboardContainer from "@/components/dashboard/teacher/TeacherDashboardContainer";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

function HeroBannerSkeleton() {
  return (
    <Card className="rounded-[32px] border-0 bg-slate-100/50 p-8 shadow-sm">
      <CardContent className="p-0 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex-1 flex flex-col lg:flex-row items-center gap-6 w-full">
          <Skeleton className="h-24 w-24 md:h-28 md:w-28 rounded-full bg-slate-200 shrink-0" />
          <div className="space-y-3 flex-1 w-full max-w-md">
            <Skeleton className="h-8 w-2/3 bg-slate-200" />
            <Skeleton className="h-4 w-1/3 bg-slate-200" />
            <Skeleton className="h-4 w-1/2 bg-slate-200" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-10 w-36 rounded-full bg-slate-200" />
              <Skeleton className="h-10 w-36 rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentListSkeleton() {
  return (
    <Card className="rounded-[32px] border-sky-100 bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-6 w-40 bg-slate-100" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl bg-slate-100" />
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
        <Skeleton className="h-6 w-48 bg-slate-100" />
        <Skeleton className="h-10 w-32 bg-slate-100 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="rounded-[32px] border-indigo-100 bg-white shadow-sm">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-5 w-40 bg-slate-100" />
              <Skeleton className="h-4 w-56 bg-slate-100" />
              <Skeleton className="h-12 w-full bg-slate-100 rounded-2xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function getOneDayAgo(): string {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

async function TeacherDashboardContent() {
  const profile = await getCurrentDashboardProfile();
  const { classrooms, students, pendingRequests } = await getTeacherDashboardData();
  const supabase = await createClient();

  // 1. Fetch overall counts and groupings
  const [
    { count: publishedAssignmentsCount },
    { count: pendingGradingCount },
    { count: resourcesUploadedCount },
    { count: announcementsPostedCount },
    { data: assignmentsCountsData },
    { data: resourcesCountsData },
    { data: announcementsCountsData },
  ] = await Promise.all([
    supabase
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("teacher_user_id", profile.user_id)
      .eq("status", "PUBLISHED")
      .is("deleted_at", null),
    supabase
      .from("assignment_submissions")
      .select("id, assignments!inner(teacher_user_id)", { count: "exact", head: true })
      .eq("assignments.teacher_user_id", profile.user_id)
      .is("score", null)
      .is("deleted_at", null)
      .is("assignments.deleted_at", null),
    supabase
      .from("classroom_resources")
      .select("id", { count: "exact", head: true })
      .eq("teacher_user_id", profile.user_id)
      .is("deleted_at", null),
    supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("teacher_user_id", profile.user_id)
      .is("deleted_at", null),
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
  ]);

  // 2. Today's Snapshot metrics (last 24 hours)
  const oneDayAgo = getOneDayAgo();

  const [
    { data: activeStudentsTodayData },
    { count: assignmentsSubmittedTodayCount },
    { count: assignmentsGradedTodayCount },
    { count: announcementsPostedTodayCount },
  ] = await Promise.all([
    supabase
      .from("activity_events")
      .select("actor_user_id")
      .eq("actor_role", "kid")
      .gte("created_at", oneDayAgo),
    supabase
      .from("assignment_submissions")
      .select("id, assignments!inner(teacher_user_id)", { count: "exact", head: true })
      .eq("assignments.teacher_user_id", profile.user_id)
      .gte("submitted_at", oneDayAgo)
      .is("deleted_at", null)
      .is("assignments.deleted_at", null),
    supabase
      .from("assignment_submissions")
      .select("id, assignments!inner(teacher_user_id)", { count: "exact", head: true })
      .eq("assignments.teacher_user_id", profile.user_id)
      .gte("graded_at", oneDayAgo)
      .is("deleted_at", null)
      .is("assignments.deleted_at", null),
    supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("teacher_user_id", profile.user_id)
      .gte("created_at", oneDayAgo)
      .is("deleted_at", null),
  ]);

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
  const activeStudentsTodayCount = new Set(
    (activeStudentsTodayData || [])
      .map((e) => e.actor_user_id)
      .filter((id) => teacherStudentIds.has(id))
  ).size;

  // Needs Attention logic
  const emptyAnnouncementClassroomsCount = enrichedClassrooms.filter(
    (c) => c.announcements_count === 0
  ).length;

  // 4. Fetch activity events feed (using our new RPC) with fallback to raw query
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
      emptyAnnouncementClassroomsCount={emptyAnnouncementClassroomsCount}
      activityEvents={activityEvents}
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
