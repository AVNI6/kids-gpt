"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    router.replace(newUrl);
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
                <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                  {selectedChild.first_name} {selectedChild.last_name}
                </h1>
                <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] shrink-0 border border-sky-100 dark:border-sky-900/30">
                  Level {getLevel(selectedChild.total_experience_points ?? 0)}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                <span className="text-sky-600 dark:text-sky-400 font-extrabold">{gradeStr}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                <span>{ageStr}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-black/30 p-3 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 shrink-0">
          <Award className="w-5 h-5 text-amber-500" />
          <div className="text-left leading-none">
            <span className="text-sm font-black block">{totalXP}</span>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">
              Total XP
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4 items-start justify-between">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-900/40 border border-sky-100/30 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-sky-500" />
                  </div>
                  <div>
                    <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">
                      Time Spent Today
                    </h3>
                    <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mt-1">
                      {isLoadingChildData ? "..." : dailyTimeStr}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                  {isLimitEnabled ? `${usedMinutes} / ${limitMinutes} min` : "Unlimited"}
                </span>
              </div>

              {/* Visual Progress Bar (Only visible if limit is enabled) */}
              {isLimitEnabled && (
                <div className="space-y-1 pt-2 animate-in fade-in duration-200">
                  <div className="h-2 w-full bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden">
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
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-900/40 border border-sky-100/30 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-sky-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">
                  Weekly Spent Time
                </h3>
                <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mt-1">
                  {isLoadingChildData ? "..." : weeklyTimeStr}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/30 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">
                  Completed Activities
                </h3>
                <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mt-1">
                  {isLoadingChildData ? "..." : totalCompleted}
                </p>
              </div>
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
        <TabsList className="flex gap-1.5 py-6 px-1 bg-slate-100 dark:bg-black/40 rounded-2xl border border-slate-200/30 dark:border-slate-800/60 max-w-2xl mx-auto w-full h-auto">
          <TabsTrigger
            value="history"
            className="flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer data-active:bg-white data-active:dark:bg-slate-900 data-active:text-sky-600 data-active:dark:text-white data-active:shadow-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-white/40 dark:hover:bg-black/20 border-none"
          >
            <Search className="w-4.5 h-4.5" /> AI Search History
          </TabsTrigger>
          <TabsTrigger
            value="activities"
            className="flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer data-active:bg-white data-active:dark:bg-slate-900 data-active:text-sky-600 data-active:dark:text-white data-active:shadow-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-white/40 dark:hover:bg-black/20 border-none"
          >
            <BookOpen className="w-4.5 h-4.5" /> Completed Activities & Rewards
          </TabsTrigger>
          <TabsTrigger
            value="progress"
            className="flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer data-active:bg-white data-active:dark:bg-slate-900 data-active:text-sky-600 data-active:dark:text-white data-active:shadow-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-white/40 dark:hover:bg-black/20 border-none"
          >
            <School className="w-4.5 h-4.5" /> Classroom & Progress
          </TabsTrigger>
        </TabsList>

        {/* Main Tab Render view */}
        {isLoadingChildData && !activeChildCachedData ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white dark:bg-black/30 rounded-[32px] border border-slate-200/60 dark:border-slate-800/60">
            <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* SUB TAB 1: AI Search History */}
            <TabsContent value="history" className="mt-6">
              <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 p-8 shadow-sm">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
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
                          className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="p-3 bg-sky-50 dark:bg-sky-950/20 rounded-xl text-sky-500 border border-sky-100/50 dark:border-sky-900/20 shrink-0">
                              <Search className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-base font-bold text-slate-850 dark:text-slate-200 truncate leading-snug">
                                {session.title || "Curiosity Search Session"}
                              </p>
                              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mt-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
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
                            </div>
                          </div>
                          <Button
                            onClick={() => router.push(`/chat/parent?id=${session.id}`)}
                            className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold h-10 px-5 text-xs flex items-center gap-1.5 cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600 transition-all shadow-sm shrink-0"
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
                            className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-black/20 hover:bg-slate-50/40 dark:hover:bg-black/40 transition-colors overflow-hidden"
                          >
                            <CardContent className="p-5 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div
                                  className={`p-3 rounded-xl shrink-0 ${
                                    isHigh
                                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 border border-emerald-100/30"
                                      : "bg-amber-50 dark:bg-amber-900/20 text-amber-500 border border-amber-100/30"
                                  }`}
                                >
                                  <Award className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-extrabold text-slate-850 dark:text-slate-200 truncate leading-snug">
                                    {act.activity_settings?.title ||
                                      (act.description
                                        ? act.description.split(" (Score:")[0]
                                        : "Completed Activity")}
                                  </p>
                                  {act.description &&
                                    act.description !==
                                      (act.activity_settings?.title ||
                                        act.description.split(" (Score:")[0]) && (
                                      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                        {act.description}
                                      </p>
                                    )}
                                  <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 flex items-center gap-1.5 mt-1.5">
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
                              </div>

                              <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                                <Badge className="bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 font-extrabold px-2 py-0.5 rounded text-[10px] border border-sky-100/50 dark:border-sky-900/30">
                                  +{act.rewards_amount || 20} XP
                                </Badge>
                                {act.score !== null && act.score !== undefined ? (
                                  <span
                                    className={`text-xs font-black ${
                                      isHigh
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-amber-500"
                                    }`}
                                  >
                                    Score: {act.score}%
                                  </span>
                                ) : scoreMatch ? (
                                  <span
                                    className={`text-xs font-black ${
                                      isHigh
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-amber-500"
                                    }`}
                                  >
                                    Score: {scoreMatch[1]}%
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">
                                    Completed
                                  </span>
                                )}
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
