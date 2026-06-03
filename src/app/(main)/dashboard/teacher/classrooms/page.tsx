import { Suspense } from "react";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getCurrentDashboardProfile } from "@/actions/dashboard.actions";
import { getTeacherDashboardData } from "@/actions/classroom.actions";
import { createClient } from "@/lib/supabase/server";
import TeacherClassrooms from "@/components/dashboard/teacher/TeacherClassrooms";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { School } from "lucide-react";

function ClassroomsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48 bg-slate-100" />
        <Skeleton className="h-10 w-32 bg-slate-100 rounded-full" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-[32px] border-indigo-100/50 bg-white shadow-sm">
            <CardContent className="p-6 flex flex-col gap-4">
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

async function ClassroomsPageContent() {
  const profile = await getCurrentDashboardProfile();
  const { classrooms, students } = await getTeacherDashboardData();
  const supabase = await createClient();

  // Fetch counts for classroom enrichment
  const [
    { data: assignmentsCountsData },
    { data: resourcesCountsData },
    { data: announcementsCountsData },
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

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Classrooms Component */}
      <TeacherClassrooms classrooms={enrichedClassrooms} />
    </div>
  );
}

export default async function TeacherClassroomsPage() {
  await checkDashboardAccess(["teacher"]);

  return (
    <Suspense fallback={<ClassroomsSkeleton />}>
      <ClassroomsPageContent />
    </Suspense>
  );
}
