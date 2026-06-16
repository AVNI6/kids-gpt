import { ReactNode } from "react";
import { checkDashboardAccess } from "@/lib/dashboard-auth";

export default async function ActivitiesLayout({ children }: { children: ReactNode }) {
  await checkDashboardAccess(["kid"]);
  return <>{children}</>;
}
