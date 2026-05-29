import { useDashboard } from "@/context/parent-dashboard/DashboardContext";

export function useParentDashboard() {
  const {
    profile,
    linkedChildren,
    activeChildId,
    setActiveChildId,
    activeChild,
    cache,
    isLoadingChildData,
    fetchChildData,
    prefetchChildData,
  } = useDashboard();

  // Retrieve current active child cached data safely
  const activeChildCachedData = activeChildId ? cache[activeChildId] : null;

  return {
    profile,
    linkedChildren,
    activeChildId,
    setActiveChildId,
    activeChild,
    cache,
    isLoadingChildData,
    fetchChildData,
    prefetchChildData,
    activeChildCachedData,
    details: activeChildCachedData?.details ?? null,
    safety: activeChildCachedData?.safety ?? null,
    searchHistory: activeChildCachedData?.history ?? [],
    activities: activeChildCachedData?.activities ?? [],
    screenTime: activeChildCachedData?.screenTime ?? null,
    aiInsights: activeChildCachedData?.aiInsights ?? null,
  };
}
