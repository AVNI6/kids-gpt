import { Suspense } from "react";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import type {
  CacheData,
  ParentActivityItem,
  SearchHistoryItem,
  LinkedChildProfile,
} from "@/types/parent";
import {
  getChildAiInsights,
  getChildDetails,
  getChildSafetyAndUsage,
  getCurrentDashboardProfile,
  getLinkedChildren,
  getParentActivities,
  getParentSearchHistory,
} from "@/lib/services/parent/parent-dashboard.actions";
import { getDailyScreenTime } from "@/lib/services/shared/screentime.actions";
import { DashboardProvider } from "@/context/parent-dashboard/DashboardContext";
import ParentTopNav from "@/components/parent/layout/ParentTopNav";

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

            const formattedHistory: SearchHistoryItem[] = (historyData || []).map(
              (h: {
                id?: string | number | null;
                title?: string | null;
                created_at?: string | null;
              }) => ({
                id: String(h.id ?? ""),
                title: h.title ? String(h.title) : null,
                created_at: h.created_at ? String(h.created_at) : null,
              })
            );

            const formattedActivities: ParentActivityItem[] = (activitiesData || []).map(
              (act: {
                id?: string | number | null;
                rewards_amount?: number | null;
                description?: string | null;
                created_at?: string | null;
                source_type?: string | null;
                score?: number | null;
                activity_settings?: ParentActivityItem["activity_settings"];
              }) => ({
                id: String(act.id ?? ""),
                rewards_amount: act.rewards_amount ?? 0,
                description: act.description ?? null,
                created_at: act.created_at ?? null,
                source_type: act.source_type ?? "",
                score: act.score ?? null,
                activity_settings: act.activity_settings ?? null,
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
