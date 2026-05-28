"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldCheck,
  Clock,
  MonitorSmartphone,
  Brain,
  Focus,
  Search,
  AlertTriangle,
} from "lucide-react";
import type { LinkedChildProfile, ChildSafetyAndUsageResult } from "@/types/dashboard.types";
import { getParentSearchHistory } from "@/actions/dashboard.actions";

interface SearchHistoryItem {
  id: string;
  title: string | null;
  created_at: string | null;
}

export default function ChildMonitoring({
  linkedChildren,
  childSafety,
}: {
  linkedChildren: LinkedChildProfile[];
  childSafety: ChildSafetyAndUsageResult | null;
}) {
  const searchParams = useSearchParams();
  const childId = searchParams?.get("childId");
  const activeChild = linkedChildren.find((c) => c.user_id === childId) || linkedChildren[0];

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(true);

  useEffect(() => {
    let active = true;
    if (!activeChild) return;

    const timer = setTimeout(async () => {
      if (!active) return;
      setLoadingSearch(true);
      try {
        const data = await getParentSearchHistory(activeChild.user_id);
        const items: SearchHistoryItem[] = (data || []).map((h: Record<string, unknown>) => ({
          id: String(h.id ?? ""),
          title: h.title ? String(h.title) : null,
          created_at: h.created_at ? String(h.created_at) : null,
        }));
        if (active) {
          setSearchHistory(items);
        }
      } catch (err) {
        console.error("Error fetching search history:", err);
      } finally {
        if (active) {
          setLoadingSearch(false);
        }
      }
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [activeChild]);

  if (!activeChild) return null;

  const safetyScore = childSafety?.safety_score ?? 100;
  const contentFilterStatus = childSafety?.content_filter_status ?? "Safe Mode (Standard)";
  const isFocusModeActive = childSafety?.focus_mode_active ?? true;

  const screenTimeMins = childSafety?.daily_screen_time_mins ?? 25;
  const screenTimeHrs = Math.floor(screenTimeMins / 60);
  const screenTimeMinsRemaining = screenTimeMins % 60;
  const screenTimeStr =
    screenTimeHrs > 0
      ? `${screenTimeHrs}h ${screenTimeMinsRemaining}m`
      : `${screenTimeMinsRemaining}m`;

  const weeklyInteractions = childSafety?.weekly_ai_interactions ?? 42;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Safety Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[28px] border-emerald-200/60 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-700/80 dark:text-emerald-400/80 uppercase tracking-wider mb-1">
                Safety Score
              </p>
              <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-50">
                {safetyScore} / 100
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-sky-200/60 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <CardContent className="p-6 flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-sky-700/80 dark:text-sky-400/80 uppercase tracking-wider mb-1">
                Content Filter
              </p>
              <h3
                className="text-sm font-black text-sky-900 dark:text-sky-50 leading-tight truncate max-w-[200px]"
                title={contentFilterStatus}
              >
                {contentFilterStatus}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-sky-200/60 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <CardContent className="p-6 flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center shrink-0">
              <Focus className="w-7 h-7 text-sky-600 dark:text-sky-450" />
            </div>
            <div>
              <p className="text-sm font-bold text-sky-700/80 dark:text-sky-400/85 uppercase tracking-wider mb-1">
                Focus Mode
              </p>
              <h3 className="text-2xl font-black text-sky-900 dark:text-sky-50">
                {isFocusModeActive ? "Active" : "Inactive"}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Usage Analytics */}
        <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MonitorSmartphone className="w-6 h-6 text-sky-500" /> Usage Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-black/20 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 shrink-0">
                  <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Daily Screen Time
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {(childSafety?.is_screen_time_limit_enabled ?? false)
                      ? `Limit: ${
                          (childSafety?.daily_limit_minutes ?? 120) >= 60
                            ? `${Math.floor((childSafety?.daily_limit_minutes ?? 120) / 60)} hour${
                                Math.floor((childSafety?.daily_limit_minutes ?? 120) / 60) > 1
                                  ? "s"
                                  : ""
                              }${
                                (childSafety?.daily_limit_minutes ?? 120) % 60 > 0
                                  ? ` ${(childSafety?.daily_limit_minutes ?? 120) % 60}m`
                                  : ""
                              }`
                            : `${childSafety?.daily_limit_minutes ?? 120}m`
                        }`
                      : "Limit: Disabled"}
                  </p>
                </div>
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {screenTimeStr}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-black/20 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 shrink-0">
                  <Brain className="w-5 h-5 text-sky-655 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Weekly AI Interactions
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Questions asked to ChatGPT Kid
                  </p>
                </div>
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {weeklyInteractions}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Search History Monitoring */}
        <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm flex flex-col justify-between">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-6 h-6 text-sky-500" /> Search & Topic Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 flex-1 flex flex-col justify-between">
            <div className="space-y-4 mb-4">
              {loadingSearch ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                </div>
              ) : searchHistory.length === 0 ? (
                <div className="text-center py-8 text-sm font-medium text-slate-450 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-[24px] p-6 bg-slate-50/20 dark:bg-black/20">
                  No learning sessions logged yet
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-450 block mb-1">
                    Recently Searched & Explored Topics
                  </span>
                  <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                    {searchHistory.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-black/45 border border-slate-100/80 dark:border-slate-800/60"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 bg-sky-50 dark:bg-sky-955/40 rounded-lg flex items-center justify-center shrink-0">
                            <Search className="w-3.5 h-3.5 text-sky-655" />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-350 truncate">
                            {item.title || "Exploring..."}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-2">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })
                            : "Recently"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Unsafe attempts count */}
            {safetyScore < 100 && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="text-xs font-extrabold text-rose-700 dark:text-rose-400 leading-tight">
                  Flagged attempts detected. Please review Notifications for details.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
