import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getKidClassroomData } from "@/lib/services/kid/classroom.actions";
import { ClassroomOverview } from "@/components/kid/dashboard";

async function ClassroomsListLoader() {
  const classroomData = await getKidClassroomData();
  const memberships = classroomData.memberships || [];

  return <ClassroomOverview memberships={memberships} />;
}

export default async function KidClassroomsIndexPage() {
  await checkDashboardAccess(["kid"]);

  return (
    <main className="min-h-full bg-background px-4 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8 dark:text-slate-50 animate-in fade-in duration-500">
      <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-6">
        <ClassroomsListLoader />
      </div>
    </main>
  );
}
