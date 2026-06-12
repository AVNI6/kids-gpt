import { checkDashboardAccess } from "@/lib/dashboard-auth";
import DashboardShell from "@/components/shared/dashboard/DashboardShell";

export default async function TeacherDashboardLayout({ children }: { children: React.ReactNode }) {
  await checkDashboardAccess(["teacher"]);

  return <DashboardShell role="teacher">{children}</DashboardShell>;
}
