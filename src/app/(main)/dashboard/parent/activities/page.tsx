"use client";

import ActivitiesGrid from "@/components/parent/progress/ActivitiesGrid";
import ChildSelectorTabs from "@/components/parent/children/ChildSelectorTabs";
import { useDashboard } from "@/context/parent-dashboard/DashboardContext";

export default function ActivitiesPage() {
  const { linkedChildren, activeChild } = useDashboard();
  return (
    <div className="space-y-6">
      {linkedChildren.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-6 animate-in fade-in duration-300">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Completed Activities
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mt-1">
              View all educational milestones and activities completed by {activeChild?.first_name}.
            </p>
          </div>
          <ChildSelectorTabs linkedChildren={linkedChildren} />
        </div>
      )}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <ActivitiesGrid />
      </div>
    </div>
  );
}
