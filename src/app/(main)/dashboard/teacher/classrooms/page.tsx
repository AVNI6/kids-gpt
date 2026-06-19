import { Suspense } from "react";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getCurrentDashboardProfile } from "@/lib/services/kid/dashboard.actions";
import { getTeacherDashboardData } from "@/lib/services/kid/classroom.actions";
import { createClient } from "@/lib/supabase/server";
import TeacherClassrooms from "@/components/teacher/classrooms/TeacherClassrooms";
import NeedsAttention from "@/components/teacher/home/NeedsAttention";
import TeacherActivityFeed from "@/components/teacher/home/TeacherActivityFeed";
import { ClassroomsListSkeleton } from "@/components/shared/skeletonLoading";

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
    <Suspense fallback={<ClassroomsListSkeleton />}>
      <ClassroomsPageContent createOpen={shouldOpenCreate} />
    </Suspense>
  );
}
