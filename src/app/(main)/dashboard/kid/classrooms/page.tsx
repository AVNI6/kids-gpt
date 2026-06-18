import { Suspense } from "react";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getKidClassroomData } from "@/lib/services/kid/classroom.actions";
import { ClassroomOverview, ClassroomOverviewSkeleton } from "@/components/kid/dashboard";

async function ClassroomsListLoader() {
  const classroomData = await getKidClassroomData();
  const memberships = classroomData.memberships || [];

  return <ClassroomOverview memberships={memberships} />;
}

export default async function KidClassroomsIndexPage() {
  await checkDashboardAccess(["kid"]);

  return (
    <main className="min-h-full bg-background px-4 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8 dark:text-slate-50 animate-in fade-in duration-500">
      <div className="flex-col gap-6">
        <Suspense fallback={<ClassroomOverviewSkeleton />}>
          <ClassroomsListLoader />
        </Suspense>
      </div>
    </main>
  );
}
