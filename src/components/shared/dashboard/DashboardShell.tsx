import { ReactNode } from "react";
import DashboardNavbar from "./DashboardNavbar";

interface DashboardShellProps {
  children: ReactNode;
  role: "kid" | "parent" | "teacher";
}

export default function DashboardShell({ children, role }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col transition-colors duration-300">
      <DashboardNavbar role={role} />
      <div className="flex-1 w-full max-w-400 mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {children}
      </div>
    </div>
  );
}
