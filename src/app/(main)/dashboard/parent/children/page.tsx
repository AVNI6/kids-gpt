"use client";

import MyChildrenManagement from "@/components/dashboard/parent/sections/MyChildrenManagement";
import { useDashboard } from "@/context/parent-dashboard/DashboardContext";

export default function ChildrenPage() {
  const { linkedChildren } = useDashboard();
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <MyChildrenManagement linkedChildren={linkedChildren} />
    </div>
  );
}
