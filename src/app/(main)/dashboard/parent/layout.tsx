import React from "react";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import type { CacheData, LinkedChildProfile } from "@/types/parent";
import {
  getChildComprehensiveData,
  getCurrentDashboardProfile,
  getLinkedChildren,
} from "@/lib/services/parent/parent-dashboard.actions";
import { DashboardProvider } from "@/context/parent-dashboard/DashboardContext";
import DashboardShell from "@/components/shared/dashboard/DashboardShell";

export default async function ParentDashboardLayout({ children }: { children: React.ReactNode }) {
  // 1. Verify dashboard access
  await checkDashboardAccess(["parent"]);

  // 2. Server-side initial fetches
  const profile = await getCurrentDashboardProfile();

  if (!profile) {
    return (
      <div className="p-8 text-center font-bold text-slate-500">
        Profile not found. Please complete onboarding.
      </div>
    );
  }

  const linkedChildren = await getLinkedChildren();
  const initialCache: Record<string, CacheData> = {};

  // Prefetch details for ALL linked children to seed the query cache on initial mount
  // so that the home page (Recent Family Activity, Family total stats) displays all kids' details instantly.
  if (linkedChildren.length > 0) {
    try {
      await Promise.all(
        linkedChildren.map(async (child: LinkedChildProfile) => {
          const childId = child.user_id;
          try {
            const childData = await getChildComprehensiveData(childId);
            initialCache[childId] = childData;
          } catch (childErr) {
            console.warn(`Failed to prefetch details for child ${childId}:`, childErr);
          }
        })
      );
    } catch (err) {
      console.warn("Failed to prefetch children details inside layout:", err);
    }
  }

  return (
    <DashboardProvider
      initialProfile={profile}
      initialLinkedChildren={linkedChildren}
      initialCache={initialCache}
    >
      <DashboardShell role="parent">
        <Suspense
          fallback={
            <div className="flex justify-center items-center py-12">
              <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          {children}
        </Suspense>
      </DashboardShell>
    </DashboardProvider>
  );
}
