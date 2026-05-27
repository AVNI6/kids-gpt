"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Settings2,
  GraduationCap,
  School,
  Mail,
  Target,
  BarChart2,
  Link2,
  Search,
  Sparkles,
  Clock,
  BookOpen,
  Award,
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import type {
  LinkedChildProfile,
  ChildDetailsResult,
  ChildSafetyAndUsageResult,
  ParentActivityItem,
} from "@/types/dashboard.types";
import { usePagination } from "@/hooks/use-pagination";

interface SearchHistoryItem {
  id: string;
  title: string | null;
  created_at: string | null;
}
import {
  linkByEmail,
  getParentSearchHistory,
  getParentActivities,
  getChildDetails,
  getChildSafetyAndUsage,
} from "@/actions/dashboard.actions";
import { getDailyScreenTime } from "@/actions/screentime.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ChildSettingsModal from "../modals/ChildSettingsModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

function getAge(dob: string | null): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function getGradeFromAge(age: number | null): string {
  if (age === null) return "N/A";
  if (age < 5) return "Pre-K";
  if (age > 18) return "Graduated";
  return `Grade ${age - 5}`;
}

export default function MyChildrenManagement({
  linkedChildren,
}: {
  linkedChildren: LinkedChildProfile[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [linkEmail, setLinkEmail] = useState("");
  const [linkMessage, setLinkMessage] = useState<string | null>(null);

  const [activeSettingsChild, setActiveSettingsChild] = useState<LinkedChildProfile | null>(null);

  // Read state from URL search params to ensure persistence across page refreshes
  const selectedChildId = searchParams?.get("selectedChildId") || null;
  const activeSubTab =
    (searchParams?.get("subTab") as "history" | "activities" | "progress") || "history";

  // URL State handlers to push/replace parameters
  const handleSelectChild = (
    childId: string | null,
    subTab: "history" | "activities" | "progress" = "history"
  ) => {
    const params = new URLSearchParams(window.location.search);
    if (childId) {
      params.set("selectedChildId", childId);
      params.set("subTab", subTab);
    } else {
      params.delete("selectedChildId");
      params.delete("subTab");
    }
    router.replace(`/dashboard/parent?${params.toString()}`);
  };

  const handleSubTabChange = (subTab: "history" | "activities" | "progress") => {
    const params = new URLSearchParams(window.location.search);
    params.set("subTab", subTab);
    router.replace(`/dashboard/parent?${params.toString()}`);
  };

  // Dynamic loaded details for selected child
  const [childDetails, setChildDetails] = useState<ChildDetailsResult | null>(null);
  const [childSafety, setChildSafety] = useState<ChildSafetyAndUsageResult | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [activities, setActivities] = useState<ParentActivityItem[]>([]);
  const [dailyScreenTime, setDailyScreenTime] = useState<{
    screenTimeSeconds: number;
    dailyLimitMinutes: number;
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const searchHistoryPagination = usePagination(searchHistory);
  const { setPage: setSearchHistoryPage } = searchHistoryPagination;
  const activitiesPagination = usePagination(activities);
  const { setPage: setActivitiesPage } = activitiesPagination;

  const selectedChild = linkedChildren.find((c) => c.user_id === selectedChildId);

  const handleLinkSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setLinkMessage(null);
      const target = linkEmail.trim();

      if (!target) {
        setLinkMessage("Please enter an email address.");
        return;
      }

      const result = await linkByEmail(target);
      setLinkMessage(result.message);
      if (result.status === "success" || result.status === "pending") {
        setLinkEmail("");
      }
    } catch (error) {
      setLinkMessage(error instanceof Error ? error.message : "Failed to create link request.");
    }
  };

  useEffect(() => {
    const childId = selectedChildId;
    if (!childId) return;

    let isMounted = true;

    async function fetchChildData() {
      if (isMounted) {
        setIsLoadingDetails(true);
      }
      try {
        const [detailsData, safetyData, historyData, activitiesData, screenTimeData] =
          await Promise.all([
            getChildDetails(childId as string),
            getChildSafetyAndUsage(childId as string),
            getParentSearchHistory(childId as string),
            getParentActivities(childId as string),
            getDailyScreenTime(childId as string),
          ]);

        if (isMounted) {
          setChildDetails(detailsData);
          setChildSafety(safetyData);
          setSearchHistory(historyData || []);
          setActivities(activitiesData || []);
          if (screenTimeData.success) {
            setDailyScreenTime({
              screenTimeSeconds: screenTimeData.screenTimeSeconds,
              dailyLimitMinutes: screenTimeData.dailyLimitMinutes,
            });
          } else {
            setDailyScreenTime(null);
          }
        }
      } catch (err) {
        console.error("Error fetching child details:", err);
      } finally {
        if (isMounted) {
          setIsLoadingDetails(false);
        }
      }
    }

    fetchChildData();

    return () => {
      isMounted = false;
    };
  }, [selectedChildId]);

  useEffect(() => {
    setSearchHistoryPage(1);
  }, [selectedChildId, searchHistory.length, setSearchHistoryPage]);

  useEffect(() => {
    setActivitiesPage(1);
  }, [selectedChildId, activities.length, setActivitiesPage]);

  // Calculate dynamic Subject Mastery based on completed activities from Supabase
  const getSubjectMastery = () => {
    let mathCount = 0,
      mathSum = 0;
    let wordCount = 0,
      wordSum = 0;
    let scienceCount = 0,
      scienceSum = 0;
    let logicCount = 0,
      logicSum = 0;
    let memoryCount = 0,
      memorySum = 0;

    activities.forEach((act) => {
      const slug = act.activity_settings?.slug || "";
      const desc = (act.description || "").toLowerCase();
      const scoreVal = act.score !== null && act.score !== undefined ? act.score : 100;

      if (
        slug === "math-challenges" ||
        (!slug &&
          (desc.includes("math") ||
            desc.includes("arithmetic") ||
            desc.includes("number") ||
            desc.includes("fraction")))
      ) {
        mathCount++;
        mathSum += scoreVal;
      } else if (
        slug === "word-scrambles" ||
        (!slug &&
          (desc.includes("scramble") ||
            desc.includes("word") ||
            desc.includes("spell") ||
            desc.includes("english") ||
            desc.includes("vocabulary")))
      ) {
        wordCount++;
        wordSum += scoreVal;
      } else if (
        slug === "science-lab" ||
        (!slug &&
          (desc.includes("science") ||
            desc.includes("lab") ||
            desc.includes("experiment") ||
            desc.includes("volcano") ||
            desc.includes("magnet") ||
            desc.includes("planet") ||
            desc.includes("space")))
      ) {
        scienceCount++;
        scienceSum += scoreVal;
      } else if (
        slug === "logic-puzzles" ||
        (!slug &&
          (desc.includes("puzzle") ||
            desc.includes("logic") ||
            desc.includes("maze") ||
            desc.includes("coding") ||
            desc.includes("programming")))
      ) {
        logicCount++;
        logicSum += scoreVal;
      } else if (
        slug === "memory-match" ||
        slug === "match-following" ||
        slug === "flashcards" ||
        slug === "quizzes" ||
        slug === "jigsaw-puzzle" ||
        slug === "color-mixer" ||
        (!slug &&
          (desc.includes("memory") ||
            desc.includes("match") ||
            desc.includes("pair") ||
            desc.includes("flashcard")))
      ) {
        memoryCount++;
        memorySum += scoreVal;
      }
    });

    return [
      {
        name: "Math Challenges 🧮",
        value: mathCount > 0 ? Math.round(mathSum / mathCount) : 0,
        count: mathCount,
      },
      {
        name: "Word Scrambles 🔠",
        value: wordCount > 0 ? Math.round(wordSum / wordCount) : 0,
        count: wordCount,
      },
      {
        name: "Science Lab 🧪",
        value: scienceCount > 0 ? Math.round(scienceSum / scienceCount) : 0,
        count: scienceCount,
      },
      {
        name: "Logic Puzzles 🧩",
        value: logicCount > 0 ? Math.round(logicSum / logicCount) : 0,
        count: logicCount,
      },
      {
        name: "Memory & Matching 🎴",
        value: memoryCount > 0 ? Math.round(memorySum / memoryCount) : 0,
        count: memoryCount,
      },
    ];
  };

  // If a child is selected, show their full-page Detail Panel directly in place of children grid
  if (selectedChildId && selectedChild) {
    const age = getAge(selectedChild.date_of_birth);
    const gradeStr = getGradeFromAge(age);
    const ageStr = age !== null ? `Age ${age}` : "Age N/A";
    const totalXP = selectedChild.total_experience_points ?? 0;
    const totalCompleted = childDetails?.total_completed ?? activities.length ?? 0;
    const usedMinutes = dailyScreenTime
      ? Math.floor(dailyScreenTime.screenTimeSeconds / 60)
      : (childSafety?.daily_screen_time_mins ?? 25);
    const limitMinutes = dailyScreenTime ? dailyScreenTime.dailyLimitMinutes : 60;
    const usagePercentage = Math.min(100, Math.round((usedMinutes / limitMinutes) * 100));

    const usedHrs = Math.floor(usedMinutes / 60);
    const usedMinsRemaining = usedMinutes % 60;
    const dailyTimeStr =
      usedHrs > 0 ? `${usedHrs}h ${usedMinsRemaining}m` : `${usedMinsRemaining}m`;

    const weeklyTimeMins = (childSafety?.weekly_ai_interactions ?? 42) * 3;
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
              <Avatar className="w-16 h-16 border-4 border-white dark:border-slate-800 shadow-md ring-2 ring-sky-100 dark:ring-sky-950 shrink-0">
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
                    Level {Math.floor((selectedChild.total_experience_points ?? 0) / 100) + 1}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                  <span className="text-sky-600 dark:text-sky-400 font-extrabold">{gradeStr}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
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
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100/30 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-sky-550" />
                    </div>
                    <div>
                      <h3 className="text-slate-500 dark:text-slate-450 font-bold text-xs uppercase tracking-wider mb-1">
                        Time Spent Today
                      </h3>
                      <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mt-1">
                        {isLoadingDetails ? "..." : dailyTimeStr}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                    {usedMinutes} / {limitMinutes} min
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-1">
                  <div className="h-2 w-full bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${
                        usagePercentage >= 90
                          ? "from-rose-400 to-red-500"
                          : usagePercentage >= 70
                            ? "from-amber-450 to-orange-500"
                            : "from-sky-400 to-indigo-500"
                      }`}
                      style={{ width: `${isLoadingDetails ? 0 : usagePercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>{usagePercentage}% used</span>
                    <span>{limitMinutes} min limit</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100/30 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-sky-550 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-slate-500 dark:text-slate-455 font-bold text-xs uppercase tracking-wider mb-1">
                    Weekly Spent Time
                  </h3>
                  <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mt-1">
                    {isLoadingDetails ? "..." : weeklyTimeStr}
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
                  <h3 className="text-slate-505 dark:text-slate-450 font-bold text-xs uppercase tracking-wider mb-1">
                    Completed Activities
                  </h3>
                  <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mt-1">
                    {isLoadingDetails ? "..." : totalCompleted}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Custom Tab Selector */}
        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-black/40 rounded-2xl border border-slate-200/30 dark:border-slate-800/60 max-w-2xl mx-auto w-full">
          <button
            onClick={() => handleSubTabChange("history")}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === "history"
                ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-white/40 dark:hover:bg-black/20"
            }`}
          >
            <Search className="w-4.5 h-4.5" /> AI Search History
          </button>
          <button
            onClick={() => handleSubTabChange("activities")}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === "activities"
                ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-white shadow-sm"
                : "text-slate-550 dark:text-slate-400 hover:text-slate-800 hover:bg-white/40 dark:hover:bg-black/20"
            }`}
          >
            <BookOpen className="w-4.5 h-4.5" /> Completed Activities & Rewards
          </button>
          <button
            onClick={() => handleSubTabChange("progress")}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === "progress"
                ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-white shadow-sm"
                : "text-slate-550 dark:text-slate-400 hover:text-slate-800 hover:bg-white/40 dark:hover:bg-black/20"
            }`}
          >
            <School className="w-4.5 h-4.5" /> Classroom & Progress
          </button>
        </div>

        {/* Loading details or main sub view */}
        {isLoadingDetails ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white dark:bg-black/30 rounded-[32px] border border-slate-200/60 dark:border-slate-800/60">
            <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* SUB TAB 1: AI Search History */}
            {activeSubTab === "history" && (
              <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 p-8 shadow-sm">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-5.5 h-5.5 text-sky-500" /> Curious AI Topic Searches
                    </h3>
                    <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-955/40 dark:text-sky-300 font-extrabold px-3 py-1 rounded-full text-xs shrink-0 border border-sky-100/50">
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
                            <div className="p-3 bg-sky-50 dark:bg-sky-955/20 rounded-xl text-sky-500 border border-sky-100/50 dark:border-sky-900/20 shrink-0">
                              <Search className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-base font-bold text-slate-850 dark:text-slate-200 truncate leading-snug">
                                {session.title || "Curiosity Search Session"}
                              </p>
                              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mt-1">
                                <Clock className="w-3.5 h-3.5 text-slate-455" />
                                {session.created_at
                                  ? new Date(session.created_at).toLocaleDateString(undefined, {
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
            )}

            {/* SUB TAB 2: Completed Activities & Rewards */}
            {activeSubTab === "activities" && (
              <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 p-8 shadow-sm">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-5.5 h-5.5 text-emerald-500" /> Dynamic Completed
                      Activities
                    </h3>
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-955/40 dark:text-emerald-300 font-extrabold px-3 py-1 rounded-full text-xs shrink-0 border border-emerald-100/30">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
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
                                      ? "bg-emerald-50 dark:bg-emerald-955/20 text-emerald-500 border border-emerald-100/30"
                                      : "bg-amber-50 dark:bg-amber-955/20 text-amber-500 border border-amber-100/30"
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
                                      ? new Date(act.created_at).toLocaleDateString(undefined, {
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
                                <Badge className="bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-955/30 dark:text-sky-300 font-extrabold px-2 py-0.5 rounded text-[10px] border border-sky-100/50 dark:border-sky-900/30">
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
                                  <span className="text-[10px] font-black text-slate-455 dark:text-slate-550">
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
                        {activitiesPagination.endIndex}
                        of {activitiesPagination.totalItems}
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
            )}

            {/* SUB TAB 3: Progress & Classroom */}
            {activeSubTab === "progress" && (
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
                          <p className="text-xs font-semibold text-slate-550 dark:text-slate-400 mt-0.5">
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

                      <Button className="rounded-xl bg-white hover:bg-slate-50 border border-slate-205 dark:bg-black dark:border-slate-800 text-slate-850 dark:text-slate-100 font-bold text-xs h-10 px-4 flex items-center gap-2 cursor-pointer shrink-0 transition-colors shadow-sm">
                        <Mail className="w-3.5 h-3.5 text-slate-500" /> Contact Mr. Smith
                      </Button>
                    </div>
                  </div>

                  {/* Subject Mastery Progress Bars */}
                  <div>
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-4">
                      <TrendingUp className="w-4 h-4 text-sky-500" /> Dynamic Subject Mastery
                      Breakdown (Supabase Records)
                    </h4>

                    <div className="space-y-4 bg-white/40 dark:bg-black/20 p-6 rounded-[28px] border border-slate-200/60 dark:border-slate-800">
                      {getSubjectMastery().map((sub, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-350">
                              {sub.name}
                            </span>
                            <span className="text-xs font-black text-sky-600 dark:text-sky-400">
                              {sub.value}% Mastery ({sub.count} played)
                            </span>
                          </div>
                          <div className="h-3 w-full bg-slate-100 dark:bg-black rounded-full overflow-hidden border border-slate-200/20 shadow-inner">
                            <div
                              className="h-full bg-gradient-to-r from-sky-400 to-sky-500 dark:from-sky-500 dark:to-sky-600 rounded-full transition-all duration-500"
                              style={{ width: `${sub.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }

  // Otherwise, render list of child cards grid
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            My Children
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Manage your children&apos;s profiles, track reports, and audit their educational logs.
          </p>
        </div>
        <Dialog>
          <DialogTrigger
            render={
              <Button className="rounded-full bg-sky-600 hover:bg-sky-700 text-white shadow-sm h-11 px-6 font-bold cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600">
                <Plus className="w-5 h-5 mr-2" /> Add Child
              </Button>
            }
          />
          <DialogContent className="max-w-md rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-lg font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
                <Link2 className="h-5 w-5 text-sky-600" /> Link a Child
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 dark:text-slate-450">
                Invite a child by email. If they haven&apos;t signed up yet, we&apos;ll send a
                pending invite.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleLinkSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label
                  htmlFor="childEmail"
                  className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  Child&apos;s Email
                </Label>
                <Input
                  id="childEmail"
                  name="childEmail"
                  type="email"
                  value={linkEmail}
                  onChange={(event) => setLinkEmail(event.target.value)}
                  placeholder="child@example.com"
                  className="h-11 rounded-xl bg-slate-55 border-slate-205 dark:bg-black/40 dark:border-slate-800 text-slate-900 dark:text-white focus-visible:ring-sky-500 focus-visible:ring-2"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl bg-sky-600 text-white hover:bg-sky-700 h-11 font-bold cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600"
              >
                Send Link Invite
              </Button>

              {linkMessage ? (
                <p className="rounded-xl bg-sky-50 dark:bg-sky-950/30 px-4 py-3 text-sm font-semibold text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/30">
                  {linkMessage}
                </p>
              ) : null}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Children Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {linkedChildren.length === 0 ? (
          <Card className="col-span-full rounded-[32px] border-dashed border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-black/30 p-12 text-center">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 bg-sky-50 dark:bg-sky-950/40 rounded-2xl flex items-center justify-center mx-auto text-sky-500">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  No Linked Children Yet
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Link a child using their registered email above to start monitoring their dynamic
                  activities, search logs, and milestones.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          linkedChildren.map((child) => {
            const age = getAge(child.date_of_birth);
            const gradeStr = getGradeFromAge(age);
            const ageStr = age !== null ? `Age ${age}` : "Age N/A";

            return (
              <Card
                key={child.user_id}
                className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
              >
                {/* Accent sky blue blob */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-sky-400/5 to-indigo-500/5 dark:from-sky-500/10 dark:to-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <CardContent className="p-8 relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <Avatar className="w-20 h-20 border-4 border-white dark:border-slate-800 shadow-sm ring-2 ring-slate-100 dark:ring-slate-800 shrink-0">
                        <AvatarImage src={child.avatar_url ?? undefined} className="object-cover" />
                        <AvatarFallback className="text-2xl font-black bg-gradient-to-br from-sky-400 to-sky-600 text-white">
                          {child.first_name?.[0] || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setActiveSettingsChild(child)}
                        className="text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:text-sky-400 dark:hover:bg-slate-900 rounded-full h-10 w-10 cursor-pointer transition-colors"
                      >
                        <Settings2 className="w-5 h-5" />
                      </Button>
                    </div>
                    <div className="space-y-1.5 mb-6">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                        {child.first_name} {child.last_name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-extrabold">
                          <GraduationCap className="w-4 h-4" /> {gradeStr}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <span>{ageStr}</span>
                      </div>
                    </div>
                    <div className="space-y-3 mb-8">
                      {/* Classroom Row */}
                      <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-slate-800/50">
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 shrink-0">
                          <School className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider mb-0.5">
                            Classroom
                          </p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-250 truncate">
                            {child.standard
                              ? `Grade ${child.standard} Section A`
                              : "Science Explorers (Mr. Smith)"}
                          </p>
                        </div>
                      </div>

                      {/* Learning Level Row */}
                      <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-slate-800/50">
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 shrink-0">
                          <Target className="w-4 h-4 text-sky-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider mb-0.5">
                            Learning Level
                          </p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-250 truncate">
                            {(child.total_experience_points ?? 0) > 500
                              ? "Advanced Mastery"
                              : "Curious Explorer"}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Actions Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleSelectChild(child.user_id, "activities"); // pre-selected to completed activities & report progress
                        }}
                        className="w-full rounded-2xl border-slate-205 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-black/50 font-bold h-11 text-sm cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                      >
                        <BarChart2 className="w-4 h-4 mr-2" /> Reports
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleSelectChild(child.user_id, "progress"); // pre-selected to classroom details
                        }}
                        className="w-full rounded-2xl border-slate-205 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-black/50 font-bold h-11 text-sm cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                      >
                        <Mail className="w-4 h-4 mr-2" /> Teacher
                      </Button>
                      <Button
                        onClick={() => {
                          handleSelectChild(child.user_id, "history"); // pre-selected to AI search history & chat sessions
                        }}
                        className="w-full col-span-2 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold h-11 text-sm cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600 shadow-md hover:shadow-lg transition-all"
                      >
                        Manage Learning
                      </Button>
                    </div>{" "}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Settings Modal */}
      {activeSettingsChild && (
        <ChildSettingsModal
          child={activeSettingsChild}
          isOpen={activeSettingsChild !== null}
          onOpenChange={(open) => {
            if (!open) setActiveSettingsChild(null);
          }}
        />
      )}
    </div>
  );
}
