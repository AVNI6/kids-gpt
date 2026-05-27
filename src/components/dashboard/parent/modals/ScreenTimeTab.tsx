"use client";

import { useState, useEffect } from "react";
import { Clock, ShieldAlert, AlertCircle, Save } from "lucide-react";
import type { LinkedChildProfile } from "@/types/dashboard.types";
import { getDailyScreenTime, updateDailyLimit } from "@/actions/screentime.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ScreenTimeTab({ child }: { child: LinkedChildProfile }) {
  const [screenTimeSeconds, setScreenTimeSeconds] = useState(0);
  const [dailyLimitMinutes, setDailyLimitMinutes] = useState(60);
  const [inputLimitMinutes, setInputLimitMinutes] = useState("60");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const data = await getDailyScreenTime(child.user_id);
        if (!isMounted) return;

        if (data.success) {
          setScreenTimeSeconds(data.screenTimeSeconds);
          setDailyLimitMinutes(data.dailyLimitMinutes);
          setInputLimitMinutes(String(data.dailyLimitMinutes));
        } else {
          toast.error("Failed to load screen time", {
            description: data.error || "Please try again later.",
          });
        }
      } catch {
        if (isMounted) {
          toast.error("Connection error", { description: "Could not retrieve screen time." });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [child.user_id]);

  const handleSaveLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseInt(inputLimitMinutes, 10);

    if (isNaN(limit) || limit <= 0) {
      toast.error("Validation error", {
        description: "Please enter a valid limit greater than 0 minutes.",
      });
      return;
    }

    setIsPending(true);
    try {
      const result = await updateDailyLimit(child.user_id, limit);
      if (result.success) {
        setDailyLimitMinutes(limit);
        toast.success("Limit updated successfully!", {
          description: `Daily limit is now set to ${limit} minutes for ${child.first_name}.`,
        });
      } else {
        toast.error("Failed to update limit", { description: result.error || "Please try again." });
      }
    } catch (err) {
      toast.error("Error occurred", {
        description: err instanceof Error ? err.message : "Failed to execute.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const usageMinutes = Math.floor(screenTimeSeconds / 60);
  const usagePercentage = Math.min(100, Math.round((usageMinutes / dailyLimitMinutes) * 100));

  // Determine progress bar theme based on usage
  const getProgressColor = () => {
    if (usagePercentage >= 90) return "bg-gradient-to-r from-rose-500 to-red-650";
    if (usagePercentage >= 70) return "bg-gradient-to-r from-amber-500 to-orange-550";
    return "bg-gradient-to-r from-sky-400 to-indigo-550";
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
          Screen Time Controls
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Monitor real-time stats and adjust daily playground access limits for {child.first_name}.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-slate-50/50 dark:bg-black/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400">Loading limits...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Real-time Usage Progress Card */}
          <div className="bg-slate-50/50 dark:bg-black/30 border border-slate-200/60 dark:border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100/10 flex items-center justify-center text-sky-550 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                    Today&apos;s Active Time
                  </span>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">
                    {usageMinutes}{" "}
                    <span className="text-xs font-bold text-slate-400">
                      / {dailyLimitMinutes} min used
                    </span>
                  </h4>
                </div>
              </div>

              <span
                className={`text-xs font-black px-2.5 py-1 rounded-full ${
                  usagePercentage >= 100
                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100/20"
                    : "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-100/20"
                }`}
              >
                {usagePercentage}% Limit
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-3.5 w-full bg-slate-100 dark:bg-black rounded-full overflow-hidden border border-slate-200/20 shadow-inner">
                <div
                  className={`h-full ${getProgressColor()} rounded-full transition-all duration-500`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-extrabold text-slate-400">
                <span>0 min</span>
                <span>{Math.round(dailyLimitMinutes / 2)} min</span>
                <span>{dailyLimitMinutes} min</span>
              </div>
            </div>

            {usagePercentage >= 100 && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/30 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-semibold leading-relaxed animate-pulse">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  Safe Lock is currently active! Child access is locked until tomorrow or until you
                  extend their limit.
                </span>
              </div>
            )}
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSaveLimit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="limitMinutes"
                className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Set Daily Screen Time Limit (Minutes)
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

            {/* Warning Details */}
            <div className="flex gap-3 p-4 rounded-3xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-850/50">
              <AlertCircle className="w-4.5 h-4.5 text-slate-455 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Changes to the daily limit will update instantaneously across all connected kid
                sessions. If the active session exceeds the new duration, their layout will
                auto-lock.
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
