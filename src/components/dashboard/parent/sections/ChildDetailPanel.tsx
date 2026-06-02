"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Award, Clock, BookOpen, Search, School, ShieldCheck, Mail } from "lucide-react";
import type { LinkedChildProfile } from "@/types/parent-dashboard/dashboard.types";
import { usePagination } from "@/hooks/use-pagination";
import { useParentDashboard } from "@/hooks/parent-dashboard/useParentDashboard";
import { useParentAnalytics } from "@/hooks/parent-dashboard/useParentAnalytics";
import { displayAge } from "@/utils/childAge";
import { displayGrade } from "@/utils/childGrade";
import { getLevel, getSafeXP } from "@/hooks/useChildXP";

export default function ChildDetailPanel({
  selectedChild,
  handleSelectChild,
}: {
  selectedChild: LinkedChildProfile;
  handleSelectChild: (id: string | null) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    isLoadingChildData,
    activeChildCachedData,
    details,
    safety,
    searchHistory,
    activities,
    screenTime,
  } = useParentDashboard();

  // Retrieve standardized subject analytics using parent analytics hook
  useParentAnalytics(details?.timeline ?? []);

  // URL state tab managers
  const subTabFromUrl = searchParams?.get("subTab") as "history" | "activities" | "progress" | null;
  const activeSubTab =
    subTabFromUrl === "history" || subTabFromUrl === "activities" || subTabFromUrl === "progress"
      ? subTabFromUrl
      : "history";

  const handleSubTabChange = (subTab: "history" | "activities" | "progress") => {
    const params = new URLSearchParams(window.location.search);
    params.set("subTab", subTab);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  };

  const searchHistoryPagination = usePagination(searchHistory);
  const { setPage: setSearchHistoryPage } = searchHistoryPagination;
  const activitiesPagination = usePagination(activities);
  const { setPage: setActivitiesPage } = activitiesPagination;

  useEffect(() => {
    setSearchHistoryPage(1);
  }, [selectedChild.user_id, searchHistory.length, setSearchHistoryPage]);

  useEffect(() => {
    setActivitiesPage(1);
  }, [selectedChild.user_id, activities.length, setActivitiesPage]);

  const gradeStr = displayGrade(selectedChild.standard);
  const ageStr = displayAge(selectedChild.date_of_birth);
  const totalXP = getSafeXP(selectedChild.total_experience_points);

  const totalCompleted = details?.total_completed ?? activities.length ?? 0;
  const usedMinutes = screenTime
    ? Math.floor(screenTime.screenTimeSeconds / 60)
    : (safety?.daily_screen_time_mins ?? 25);
  const limitMinutes = screenTime ? screenTime.dailyLimitMinutes : 60;
  const isLimitEnabled = screenTime
    ? screenTime.isLimitEnabled
    : (safety?.is_screen_time_limit_enabled ?? false);
  const usagePercentage = isLimitEnabled
    ? Math.min(100, Math.round((usedMinutes / limitMinutes) * 100))
    : 0;

  const usedHrs = Math.floor(usedMinutes / 60);
  const usedMinsRemaining = usedMinutes % 60;
  const dailyTimeStr = usedHrs > 0 ? `${usedHrs}h ${usedMinsRemaining}m` : `${usedMinsRemaining}m`;

  const weeklyTimeMins = (safety?.weekly_ai_interactions ?? 42) * 3;
  const weeklyTimeHrs = Math.floor(weeklyTimeMins / 60);
  const weeklyTimeMinsRemaining = weeklyTimeMins % 60;
  const weeklyTimeStr =
    weeklyTimeHrs > 0
      ? `${weeklyTimeHrs}h ${weeklyTimeMinsRemaining}m`
      : `${weeklyTimeMinsRemaining}m`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
      {/* Back Arrow & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-6">
        <div className="space-y-3">
          <button
            onClick={() => handleSelectChild(null)}
            className="group flex items-center gap-2 text-sm font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to My Children</span>
          </button>
          <div className="flex items-center gap-4.5">
            <Avatar className="w-16 h-16 border-4 border-white dark:border-slate-800 shadow-md ring-2 ring-sky-100 dark:ring-sky-950/20 shrink-0">
              <AvatarImage src={selectedChild.avatar_url ?? undefined} className="object-cover" />
              <AvatarFallback className="text-xl font-black bg-gradient-to-br from-sky-400 to-sky-600 text-white">
                {selectedChild.first_name?.[0] || "C"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                  {selectedChild.first_name} {selectedChild.last_name}
                </h1>
                <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 font-extrabold px-3.5 py-1.5 rounded-full text-sm shrink-0 border border-sky-100 dark:border-sky-900/30">
                  Level {getLevel(selectedChild.total_experience_points ?? 0)}
                </Badge>
              </div>
              <p className="text-lg font-bold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-3">
                <span className="text-sky-600 dark:text-sky-400 font-black">{gradeStr}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                <span>{ageStr}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 bg-white dark:bg-black/30 p-3.5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 shrink-0">
          <Award className="w-6 h-6 text-amber-500" />
          <div className="text-left leading-none">
            <span className="text-lg sm:text-xl font-black block">{totalXP}</span>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">
              Total XP
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/40 border border-sky-100/30 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-sky-500" />
              </div>
              <Badge
                variant="secondary"
                className="font-bold text-[9px] uppercase tracking-wider bg-slate-100 dark:bg-slate-800/60 text-slate-505 dark:text-slate-400 border border-slate-200/40 dark:border-slate-800/60 shrink-0"
              >
                {isLimitEnabled ? `${usedMinutes} / ${limitMinutes} min` : "Unlimited"}
              </Badge>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-slate-400 dark:text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-wider">
                Time Spent Today
              </h3>
              <p className="text-4xl font-black text-slate-900 dark:text-white leading-none whitespace-nowrap">
                {isLoadingChildData ? "..." : dailyTimeStr}
              </p>
            </div>

            {/* Visual Progress Bar (Only visible if limit is enabled) */}
            {isLimitEnabled && (
              <div className="space-y-1 pt-3 animate-in fade-in duration-200 w-full">
                <div className="h-1.5 w-full bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${
                      usagePercentage >= 90
                        ? "from-rose-500 to-red-500"
                        : usagePercentage >= 70
                          ? "from-amber-500 to-orange-500"
                          : "from-sky-400 to-indigo-500"
                    }`}
                    style={{
                      width: `${isLoadingChildData ? 0 : usagePercentage}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                  <span>{usagePercentage}% used</span>
                  <span>{limitMinutes} min limit</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/40 border border-sky-100/30 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-sky-500 animate-pulse" />
              </div>
              <Badge
                variant="secondary"
                className="font-bold text-[9px] uppercase tracking-wider bg-slate-100 dark:bg-slate-800/60 text-slate-505 dark:text-slate-400 border border-slate-200/40 dark:border-slate-800/60 shrink-0"
              >
                7 Days Active
              </Badge>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-slate-400 dark:text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-wider">
                Weekly Spent Time
              </h3>
              <p className="text-4xl font-black text-slate-900 dark:text-white leading-none whitespace-nowrap">
                {isLoadingChildData ? "..." : weeklyTimeStr}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/30 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-emerald-500" />
              </div>
              <Badge
                variant="secondary"
                className="font-bold text-[9px] uppercase tracking-wider bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/25 shrink-0"
              >
                Total Completed
              </Badge>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-slate-400 dark:text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-wider">
                Completed Activities
              </h3>
              <p className="text-4xl font-black text-slate-900 dark:text-white leading-none whitespace-nowrap">
                {isLoadingChildData ? "..." : totalCompleted}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* shadcn/base-ui Tabs Selector */}
      <Tabs
        value={activeSubTab}
        onValueChange={(val) => {
          if (val && typeof val === "string")
            handleSubTabChange(val as "history" | "activities" | "progress");
        }}
        className="w-full"
      >
        <TabsList className="flex flex-row flex-nowrap overflow-x-auto no-scrollbar justify-start sm:justify-center gap-2 sm:gap-1.5 py-1.5 sm:py-4 px-1.5 bg-slate-100 dark:bg-black/40 rounded-full border border-slate-200/30 dark:border-slate-800/60 max-w-2xl mx-auto w-full! h-auto! group-data-horizontal/tabs:h-auto!">
          <TabsTrigger
            value="history"
            className="shrink-0 sm:flex-1 py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer border-none bg-transparent data-active:bg-sky-600 data-active:text-white sm:data-active:bg-white sm:data-active:dark:bg-slate-900 sm:data-active:text-sky-600 sm:data-active:dark:text-white sm:data-active:shadow-sm text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 whitespace-nowrap"
          >
            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span className="hidden sm:inline">AI Search History</span>
            <span className="inline sm:hidden">Search</span>
          </TabsTrigger>
          <TabsTrigger
            value="activities"
            className="shrink-0 sm:flex-1 py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer border-none bg-transparent data-active:bg-sky-600 data-active:text-white sm:data-active:bg-white sm:data-active:dark:bg-slate-900 sm:data-active:text-sky-600 sm:data-active:dark:text-white sm:data-active:shadow-sm text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span className="hidden sm:inline">Completed Activities & Rewards</span>
            <span className="inline sm:hidden">Activities</span>
          </TabsTrigger>
          <TabsTrigger
            value="progress"
            className="shrink-0 sm:flex-1 py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer border-none bg-transparent data-active:bg-sky-600 data-active:text-white sm:data-active:bg-white sm:data-active:dark:bg-slate-900 sm:data-active:text-sky-600 sm:data-active:dark:text-white sm:data-active:shadow-sm text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 whitespace-nowrap"
          >
            <School className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span className="hidden sm:inline">Classroom & Progress</span>
            <span className="inline sm:hidden">Classroom</span>
          </TabsTrigger>
        </TabsList>

        {/* Main Tab Render view */}
        {isLoadingChildData && !activeChildCachedData ? (
          <>
            {activeSubTab === "history" && (
              <div className="space-y-6 bg-white dark:bg-black/30 p-8 rounded-[32px] border border-slate-200/60 dark:border-slate-800/60 animate-pulse mt-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4">
                  <Skeleton className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <Skeleton className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-5 border border-slate-200/60 dark:border-slate-800 rounded-[24px] flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Skeleton className="w-11 h-11 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4.5 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
                          <Skeleton className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                      </div>
                      <Skeleton className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubTab === "activities" && (
              <div className="space-y-6 bg-white dark:bg-black/30 p-8 rounded-[32px] border border-slate-200/60 dark:border-slate-800/60 animate-pulse mt-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4">
                  <Skeleton className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <Skeleton className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card
                      key={i}
                      className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/45 dark:bg-black/20 overflow-hidden"
                    >
                      <CardContent className="p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <Skeleton className="w-11 h-11 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                            <Skeleton className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                          </div>
                        </div>
                        <div className="space-y-2 items-end flex flex-col shrink-0">
                          <Skeleton className="h-5 w-14 bg-slate-200 dark:bg-slate-800 rounded" />
                          <Skeleton className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeSubTab === "progress" && (
              <div className="space-y-6 bg-white dark:bg-black/30 p-8 rounded-[32px] border border-slate-200/60 dark:border-slate-800/60 animate-pulse mt-6">
                <div className="bg-slate-50/50 dark:bg-black/40 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                  <div className="flex items-center gap-4.5 flex-1">
                    <Skeleton className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
                      <Skeleton className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                      <Skeleton className="h-3.5 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* SUB TAB 1: AI Search History */}
            <TabsContent value="history" className="mt-6">
              <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 p-4 sm:p-8 shadow-sm">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                      <span className="text-sky-500">✨</span> Curious AI Topic Searches
                    </h3>
                    <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 font-extrabold px-3 py-1 rounded-full text-xs shrink-0 border border-sky-100/50">
                      {searchHistory.length} Sessions Found
                    </Badge>
                  </div>

                  {searchHistory.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50/50 dark:bg-black/20 rounded-[24px] border border-slate-100 dark:border-slate-900 border-dashed">
                      <Search className="w-10 h-10 text-slate-350 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-400">
                        No AI search topics tracked yet
                      </p>
                      <p className="text-xs text-slate-400/80 mt-1 max-w-xs mx-auto">
                        When {selectedChild.first_name} queries visual topics on their kid
                        dashboard, the subjects will show up here.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white/40 dark:bg-black/25 rounded-[24px] border border-slate-200/60 dark:border-slate-800 overflow-hidden shadow-sm">
                      {searchHistoryPagination.currentItems.map((session, index) => (
                        <div
                          key={session.id || index}
                          className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="p-2.5 sm:p-3 bg-sky-50 dark:bg-sky-950/20 rounded-xl text-sky-500 border border-sky-100/50 dark:border-sky-900/20 shrink-0">
                              <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm sm:text-base font-bold text-slate-850 dark:text-slate-200 truncate leading-snug">
                                {session.title || "Curiosity Search Session"}
                              </p>
                              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mt-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">
                                  {session.created_at
                                    ? new Date(session.created_at).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "Recent Topic"}
                                </span>
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => router.push(`/chat/parent?id=${session.id}`)}
                            className="w-full sm:w-auto rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold h-9 sm:h-10 px-4 sm:px-5 text-xs flex items-center justify-center gap-1.5 cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600 transition-all shadow-sm shrink-0"
                          >
                            Open in Chat
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchHistory.length > 0 && searchHistoryPagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Showing {searchHistoryPagination.startIndex + 1}-
                        {searchHistoryPagination.endIndex} of {searchHistoryPagination.totalItems}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!searchHistoryPagination.hasPrevPage}
                          onClick={searchHistoryPagination.prevPage}
                          className="rounded-lg px-3 h-9 text-xs font-bold"
                        >
                          Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!searchHistoryPagination.hasNextPage}
                          onClick={searchHistoryPagination.nextPage}
                          className="rounded-lg px-3 h-9 text-xs font-bold"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* SUB TAB 2: Completed Activities & Rewards */}
            <TabsContent value="activities" className="mt-6">
              <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 p-8 shadow-sm">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-5.5 h-5.5 text-emerald-500" /> Dynamic Completed
                      Activities
                    </h3>
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-extrabold px-3 py-1 rounded-full text-xs shrink-0 border border-emerald-100/30">
                      {activities.length} Completed
                    </Badge>
                  </div>

                  {activities.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50/50 dark:bg-black/20 rounded-[24px] border border-slate-100 dark:border-slate-900 border-dashed">
                      <Award className="w-10 h-10 text-slate-350 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-400">
                        No completed activities yet
                      </p>
                      <p className="text-xs text-slate-400/80 mt-1 max-w-xs mx-auto">
                        Completed quizzes, math games, and puzzles with earned XP will show up here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activitiesPagination.currentItems.map((act, index) => {
                        const scoreMatch = act.description
                          ? act.description.match(/Score:\s*(\d+)/i)
                          : null;
                        const scoreVal =
                          act.score !== null && act.score !== undefined
                            ? act.score
                            : scoreMatch
                              ? parseInt(scoreMatch[1], 10)
                              : 100;
                        const isHigh = scoreVal >= 80;

                        return (
                          <Card
                            key={act.id || index}
                            className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-black/20 hover:bg-slate-50/40 dark:hover:bg-black/40 transition-colors overflow-hidden flex flex-col h-full justify-between"
                          >
                            <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                              <div>
                                <div className="flex justify-between items-center mb-3">
                                  <div
                                    className={`p-2.5 rounded-xl shrink-0 ${
                                      isHigh
                                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 border border-emerald-100/30"
                                        : "bg-amber-50 dark:bg-amber-900/20 text-amber-500 border border-amber-100/30"
                                    }`}
                                  >
                                    <Award className="w-5 h-5" />
                                  </div>
                                  <Badge className="bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 font-extrabold px-2 py-0.5 rounded text-[10px] border border-sky-100/50 dark:border-sky-900/30 shrink-0">
                                    +{act.rewards_amount || 20} XP
                                  </Badge>
                                </div>

                                <div className="space-y-1 mb-3">
                                  <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 line-clamp-1 leading-snug">
                                    {act.activity_settings?.title ||
                                      (act.description
                                        ? act.description.split(" (Score:")[0]
                                        : "Completed Activity")}
                                  </h4>
                                  {act.description &&
                                    act.description !==
                                      (act.activity_settings?.title ||
                                        act.description.split(" (Score:")[0]) && (
                                      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 line-clamp-2">
                                        {act.description}
                                      </p>
                                    )}
                                </div>
                              </div>

                              <div className="space-y-3 mt-auto">
                                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-450 dark:text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                    {act.created_at
                                      ? new Date(act.created_at).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "Recently"}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 dark:bg-black/40 border border-slate-100/60 dark:border-slate-800/80">
                                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                                    Performance Score
                                  </span>
                                  {act.score !== null && act.score !== undefined ? (
                                    <span
                                      className={`text-xs font-black ${
                                        isHigh
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : "text-amber-500"
                                      }`}
                                    >
                                      {act.score}%
                                    </span>
                                  ) : scoreMatch ? (
                                    <span
                                      className={`text-xs font-black ${
                                        isHigh
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : "text-amber-500"
                                      }`}
                                    >
                                      {scoreMatch[1]}%
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">
                                      Completed
                                    </span>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {activities.length > 0 && activitiesPagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Showing {activitiesPagination.startIndex + 1}-
                        {activitiesPagination.endIndex} of {activitiesPagination.totalItems}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!activitiesPagination.hasPrevPage}
                          onClick={activitiesPagination.prevPage}
                          className="rounded-lg px-3 h-9 text-xs font-bold"
                        >
                          Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!activitiesPagination.hasNextPage}
                          onClick={activitiesPagination.nextPage}
                          className="rounded-lg px-3 h-9 text-xs font-bold"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* SUB TAB 3: Progress & Classroom */}
            <TabsContent value="progress" className="mt-6">
              <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 p-8 shadow-sm">
                <div className="space-y-8">
                  {/* Classroom & Teacher Section */}
                  <div className="bg-slate-50/50 dark:bg-black/40 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6">
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-4">
                      <School className="w-4 h-4 text-sky-500" /> Active School Enrollment
                    </h4>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                      <div className="flex items-center gap-4.5">
                        <div className="w-12 h-12 bg-white dark:bg-black rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 shrink-0">
                          <School className="w-6 h-6 text-slate-500" />
                        </div>
                        <div className="text-left">
                          <h5 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                            Science Explorers Classroom
                          </h5>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                            Teacher:{" "}
                            <span className="text-slate-850 dark:text-slate-200">
                              Mr. Arthur Smith
                            </span>
                          </p>
                          <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 mt-1 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" /> Approved parent-teacher
                            monitoring link active
                          </p>
                        </div>
                      </div>

                      <Button className="rounded-xl bg-white hover:bg-slate-50 border border-slate-200 dark:bg-black dark:border-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs h-10 px-4 flex items-center gap-2 cursor-pointer shrink-0 transition-colors shadow-sm">
                        <Mail className="w-3.5 h-3.5 text-slate-500" /> Contact Mr. Smith
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
