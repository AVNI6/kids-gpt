"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  ShieldAlert,
  AlertCircle,
  Save,
  TrendingUp,
  Calendar,
  BarChart2,
} from "lucide-react";
import type { LinkedChildProfile } from "@/types/kid";
import { getScreenTimeAnalytics, updateDailyLimit } from "@/lib/services/shared/screentime.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function ScreenTimeTab({ child }: { child: LinkedChildProfile }) {
  const [dailySeconds, setDailySeconds] = useState(0);
  const [weeklySeconds, setWeeklySeconds] = useState(0);
  const [monthlySeconds, setMonthlySeconds] = useState(0);
  const [dailyLimitMinutes, setDailyLimitMinutes] = useState(60);
  const [isLimitEnabled, setIsLimitEnabled] = useState(false);
  const [initialIsLimitEnabled, setInitialIsLimitEnabled] = useState(false);
  const [inputLimitMinutes, setInputLimitMinutes] = useState("60");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  // Fetch usage analytics and limit in a single optimized server action
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
      const data = await getScreenTimeAnalytics(child.user_id, tz);
      if (data.success) {
        setDailySeconds(data.dailySeconds);
        setWeeklySeconds(data.weeklySeconds);
        setMonthlySeconds(data.monthlySeconds);
        setDailyLimitMinutes(data.dailyLimitMinutes);
        setIsLimitEnabled(data.isLimitEnabled);
        setInitialIsLimitEnabled(data.isLimitEnabled);
        setInputLimitMinutes(String(data.dailyLimitMinutes));
      } else {
        toast.error("Failed to load screen time analytics", {
          description: data.error || "Please try again later.",
        });
      }
    } catch {
      toast.error("Connection error", {
        description: "Could not retrieve screen time statistics.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [child.user_id]);

  useEffect(() => {
    // Defer the stateful async call outside the synchronous effect body.
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadData]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseInt(inputLimitMinutes, 10);

    if (isLimitEnabled && (isNaN(limit) || limit <= 0)) {
      toast.error("Validation error", {
        description: "Please enter a valid limit greater than 0 minutes.",
      });
      return;
    }

    setIsPending(true);
    try {
      const result = await updateDailyLimit(child.user_id, limit, isLimitEnabled);
      if (result.success) {
        setDailyLimitMinutes(limit);
        setInitialIsLimitEnabled(isLimitEnabled);
        toast.success("Settings updated successfully!", {
          description: isLimitEnabled
            ? `Daily limit is set to ${limit} minutes for ${child.first_name}.`
            : `Daily limit disabled. Screen time is unlimited for ${child.first_name}.`,
        });
      } else {
        toast.error("Failed to update limit", {
          description: result.error || "Please try again.",
        });
      }
    } catch (err) {
      toast.error("Error occurred", {
        description: err instanceof Error ? err.message : "Failed to execute.",
      });
    } finally {
      setIsPending(false);
    }
  };

  // Convert seconds into human-friendly strings (e.g. 90 minutes -> "1 hr 30 mins")
  const formatDuration = (totalSeconds: number): string => {
    if (totalSeconds <= 0) return "0 mins";

    const minutes = Math.floor(totalSeconds / 60);
    if (minutes < 1) return "< 1 min";

    if (minutes < 60) {
      return `${minutes} min${minutes > 1 ? "s" : ""}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;

    return remainingMins > 0
      ? `${hours} hr${hours > 1 ? "s" : ""} ${remainingMins} min${remainingMins > 1 ? "s" : ""}`
      : `${hours} hr${hours > 1 ? "s" : ""}`;
  };

  const dailyMinutes = Math.floor(dailySeconds / 60);
  const dailyUsagePercentage = initialIsLimitEnabled
    ? Math.min(100, Math.round((dailyMinutes / dailyLimitMinutes) * 100))
    : 0;

  // Determine progress bar theme based on daily usage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "from-rose-500 to-red-650";
    if (percentage >= 70) return "from-amber-500 to-orange-550";
    return "from-sky-400 to-indigo-550";
  };

  return (
    <div className="w-full">
      <div className="space-y-8">
        {/* Title */}
        <div className="space-y-1">
          <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-500" /> Screen Time & Boundaries
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            Monitor active session statistics, analyze historical metrics, and adjust daily
            constraints for {child.first_name}.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6 animate-pulse pr-2">
            {/* Top card skeleton */}
            <div className="bg-slate-50/50 dark:bg-black/30 border border-slate-200/60 dark:border-slate-800 p-6 rounded-[28px] space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                    <Skeleton className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
            </div>
            {/* Analytics grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-50/30 dark:bg-black/20 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4.5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                    <Skeleton className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                    <Skeleton className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Today's Active Limit Card */}
            <div className="bg-slate-50/50 dark:bg-black/30 border border-slate-200/60 dark:border-slate-800 p-6 rounded-[28px] space-y-4 shadow-xs">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100/10 flex items-center justify-center text-sky-550 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="leading-tight">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                      Today&apos;s Active Time
                    </span>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white">
                      {formatDuration(dailySeconds)}{" "}
                      {initialIsLimitEnabled && (
                        <span className="text-xs font-bold text-slate-400">
                          / {dailyLimitMinutes} min limit
                        </span>
                      )}
                    </h4>
                  </div>
                </div>

                {initialIsLimitEnabled ? (
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      dailyUsagePercentage >= 100
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100/20"
                        : "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-100/20"
                    }`}
                  >
                    {dailyUsagePercentage}% Used
                  </span>
                ) : (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/20">
                    Unlimited
                  </span>
                )}
              </div>

              {/* Progress Bar (Only visible if limit is enabled) */}
              {initialIsLimitEnabled && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  <div className="h-3 w-full bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden border border-slate-200/10 shadow-inner">
                    <div
                      className={`h-full bg-gradient-to-r ${getProgressColor(dailyUsagePercentage)} rounded-full transition-all duration-500`}
                      style={{ width: `${dailyUsagePercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-455">
                    <span>0 mins</span>
                    <span>{Math.round(dailyLimitMinutes / 2)} mins</span>
                    <span>{dailyLimitMinutes} mins</span>
                  </div>
                </div>
              )}

              {initialIsLimitEnabled && dailyUsagePercentage >= 100 && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/30 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-semibold leading-relaxed animate-pulse">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                  <span>
                    Safe Lock is currently active! Access is blocked for {child.first_name} until
                    you extend their limit or the calendar date resets tomorrow.
                  </span>
                </div>
              )}
            </div>

            {/* New Screen Time Analytics Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-sky-500" /> Usage Analytics History
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Daily Stat */}
                <div className="bg-slate-50/30 dark:bg-black/20 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Daily Usage
                    </span>
                    <Clock className="w-4 h-4 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white truncate">
                      {formatDuration(dailySeconds)}
                    </p>
                  </div>
                </div>

                {/* Weekly Stat */}
                <div className="bg-slate-50/30 dark:bg-black/20 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Weekly
                    </span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white truncate">
                      {formatDuration(weeklySeconds)}
                    </p>
                  </div>
                </div>

                {/* Monthly Stat */}
                <div className="bg-slate-50/30 dark:bg-black/20 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Monthly
                    </span>
                    <Calendar className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white truncate">
                      {formatDuration(monthlySeconds)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration Form */}
            <form
              onSubmit={handleSaveSettings}
              className="space-y-5 border-t border-slate-100 dark:border-slate-800/60 pt-6"
            >
              {/* The Unlimited Toggle Switch */}
              <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 dark:bg-black/20 border border-slate-200/50 dark:border-slate-800/80">
                <div className="space-y-0.5 text-left">
                  <Label
                    htmlFor="limit-toggle"
                    className="font-bold text-xs uppercase tracking-wider text-slate-650 dark:text-slate-350"
                  >
                    Enable Daily Screen Time Limit
                  </Label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Automatically lock playground access once daily limit is exceeded.
                  </p>
                </div>
                <Switch
                  id="limit-toggle"
                  checked={isLimitEnabled}
                  onCheckedChange={setIsLimitEnabled}
                />
              </div>

              {/* Conditional Input Fields */}
              {isLimitEnabled ? (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <Label
                    htmlFor="limitMinutes"
                    className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  >
                    Adjust Daily Screen Time Limit (Minutes)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="limitMinutes"
                      type="number"
                      min="1"
                      required
                      value={inputLimitMinutes}
                      onChange={(e) => setInputLimitMinutes(e.target.value)}
                      placeholder="e.g. 60"
                      className="h-11 rounded-xl bg-slate-50 border-slate-200 dark:bg-black/40 dark:border-slate-800 text-slate-900 dark:text-white focus-visible:ring-sky-500 font-extrabold"
                    />
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold h-11 px-5 flex items-center gap-2 cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600 shadow-sm transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isPending ? "Saving..." : "Save Limit"}</span>
                    </Button>
                  </div>
                </div>
              ) : (
                isLimitEnabled !== initialIsLimitEnabled && (
                  <div className="flex justify-end pt-1 animate-in fade-in duration-200">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold h-11 px-5 flex items-center gap-2 cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600 shadow-sm transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isPending ? "Saving..." : "Save Settings"}</span>
                    </Button>
                  </div>
                )
              )}

              {/* Warning Details */}
              <div className="flex gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800/50">
                <AlertCircle className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 dark:text-slate-455 leading-relaxed font-semibold">
                  Adjustments to screen limits will apply instantly to all active kid sessions.
                  Enabling boundaries will auto-lock sessions that currently exceed the set minutes.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
