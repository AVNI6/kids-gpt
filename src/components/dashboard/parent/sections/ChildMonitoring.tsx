"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MonitorSmartphone, Brain, Search, AlertTriangle } from "lucide-react";
import { useParentDashboard } from "@/hooks/parent-dashboard/useParentDashboard";

export default function ChildMonitoring() {
  const { activeChild, safety, searchHistory, isLoadingChildData } = useParentDashboard();

  if (!activeChild) return null;

  const safetyScore = safety?.safety_score ?? 100;

  const screenTimeMins = safety?.daily_screen_time_mins ?? 25;
  const screenTimeHrs = Math.floor(screenTimeMins / 60);
  const screenTimeMinsRemaining = screenTimeMins % 60;
  const screenTimeStr =
    screenTimeHrs > 0
      ? `${screenTimeHrs}h ${screenTimeMinsRemaining}m`
      : `${screenTimeMinsRemaining}m`;

  const weeklyInteractions = safety?.weekly_ai_interactions ?? 42;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
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
                    Limit: 2 hours
                  </p>
                </div>
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {isLoadingChildData ? "..." : screenTimeStr}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-black/20 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 shrink-0">
                  <Brain className="w-5 h-5 text-sky-600 dark:text-sky-400" />
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
                {isLoadingChildData ? "..." : weeklyInteractions}
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
              {isLoadingChildData && searchHistory.length === 0 ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                </div>
              ) : searchHistory.length === 0 ? (
                <div className="text-center py-8 text-sm font-medium text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-[24px] p-6 bg-slate-50/20 dark:bg-black/20">
                  No learning sessions logged yet
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                    Recently Searched & Explored Topics
                  </span>
                  <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                    {searchHistory.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-black/45 border border-slate-100/80 dark:border-slate-800/60"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 bg-sky-50 dark:bg-sky-900/40 rounded-lg flex items-center justify-center shrink-0">
                            <Search className="w-3.5 h-3.5 text-sky-500" />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-350 truncate">
                            {item.title || "Exploring..."}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-2">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString("en-US", {
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
