import { Suspense } from "react";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import type {
  CacheData,
  ParentActivityItem,
  SearchHistoryItem,
} from "@/types/parent-dashboard/dashboard.types";
import {
  getChildAiInsights,
  getChildDetails,
  getChildSafetyAndUsage,
  getCurrentDashboardProfile,
  getLinkedChildren,
  getParentActivities,
  getParentSearchHistory,
} from "@/actions/parent-dashboard.actions";
import { getDailyScreenTime } from "@/actions/screentime.actions";
import { DashboardProvider } from "@/context/parent-dashboard/DashboardContext";
import ParentTopNav from "@/components/dashboard/parent/ParentTopNav";

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
        linkedChildren.map(async (child) => {
          const childId = child.user_id;
          try {
            const [detailsData, safetyData, historyData, activitiesData, screenTimeData] =
              await Promise.all([
                getChildDetails(childId),
                getChildSafetyAndUsage(childId),
                getParentSearchHistory(childId),
                getParentActivities(childId),
                getDailyScreenTime(childId).catch(() => ({
                  success: false,
                  screenTimeSeconds: 0,
                  dailyLimitMinutes: 60,
                  isLimitEnabled: false,
                })),
              ]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formattedHistory: SearchHistoryItem[] = (historyData || []).map((h: any) => ({
              id: String(h.id ?? ""),
              title: h.title ? String(h.title) : null,
              created_at: h.created_at ? String(h.created_at) : null,
            }));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formattedActivities: ParentActivityItem[] = (activitiesData || []).map(
              (act: any) => ({
                id: act.id,
                rewards_amount: act.rewards_amount ?? 0,
                description: act.description,
                created_at: act.created_at,
                source_type: act.source_type ?? "",
                score: act.score,
                activity_settings: act.activity_settings,
              })
            );

            const cachedScreenTime = screenTimeData.success
              ? {
                  screenTimeSeconds: screenTimeData.screenTimeSeconds,
                  dailyLimitMinutes: screenTimeData.dailyLimitMinutes,
                  isLimitEnabled: screenTimeData.isLimitEnabled,
                }
              : null;

            let aiInsightsData = null;
            try {
              aiInsightsData = await getChildAiInsights(childId, detailsData);
            } catch {
              aiInsightsData = null;
            }

            initialCache[childId] = {
              details: detailsData,
              safety: safetyData,
              history: formattedHistory,
              activities: formattedActivities,
              screenTime: cachedScreenTime,
              aiInsights: aiInsightsData,
            };
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-background font-sans flex flex-col justify-center items-center">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardProvider
        initialProfile={profile}
        initialLinkedChildren={linkedChildren}
        initialCache={initialCache}
      >
        <div className="min-h-screen bg-background font-sans flex flex-col transition-colors duration-300">
          <ParentTopNav />
          <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
            {children}
          </div>
        </div>
      </DashboardProvider>
    </Suspense>
  );
}
