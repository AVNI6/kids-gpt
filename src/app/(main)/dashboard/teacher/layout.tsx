import { checkDashboardAccess } from "@/lib/dashboard-auth";
import TeacherNavBar from "@/components/teacher/dashboard/TeacherNavBar";

export default async function TeacherDashboardLayout({ children }: { children: React.ReactNode }) {
  await checkDashboardAccess(["teacher"]);

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col transition-colors duration-300">
      <TeacherNavBar />
      <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">{children}</div>
    </div>
  );
}
