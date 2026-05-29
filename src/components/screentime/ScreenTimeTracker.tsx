"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { getDailyScreenTime, logScreenTimeSession } from "@/actions/screentime.actions";
import { Clock, Sun, Sparkles, Moon, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ScreenTimeContextType {
  screenTimeSeconds: number;
  dailyLimitMinutes: number;
  isLocked: boolean;
}

const ScreenTimeContext = createContext<ScreenTimeContextType>({
  screenTimeSeconds: 0,
  dailyLimitMinutes: 60,
  isLocked: false,
});

export const useScreenTime = () => useContext(ScreenTimeContext);

export default function ScreenTimeTracker({ children }: { children: React.ReactNode }) {
  const [dbScreenTimeSeconds, setDbScreenTimeSeconds] = useState(0);
  const [dailyLimitMinutes, setDailyLimitMinutes] = useState(60);
  const [localElapsedSeconds, setLocalElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const startTimeRef = useRef<number | null>(null);
  const elapsedAccumulatedRef = useRef<number>(0);

  // Helper to save tracked seconds to DB
  const saveScreenTime = async (seconds: number) => {
    if (seconds <= 0) return;
    try {
      await logScreenTimeSession("", seconds);
    } catch (err) {
      console.error("Failed to log screen time session:", err);
    }
  };

  // Effect 1: Fetch limit on mount & set up timers/listeners
  useEffect(() => {
    let isActive = true;
    startTimeRef.current = Date.now();
    elapsedAccumulatedRef.current = 0;

    const loadScreenTime = async () => {
      try {
        const data = await getDailyScreenTime("");
        if (!isActive) return;
        if (data.success) {
          setDbScreenTimeSeconds(data.screenTimeSeconds);
          setDailyLimitMinutes(data.dailyLimitMinutes);
        }
      } catch (err) {
        console.error("Failed to fetch daily screen time limit:", err);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadScreenTime();

    // A minute-by-minute interval to increment local elapsed time
    const interval = setInterval(() => {
      const startTime = startTimeRef.current ?? Date.now();
      const currentElapsed =
        Math.round((Date.now() - startTime) / 1000) + elapsedAccumulatedRef.current;
      setLocalElapsedSeconds(currentElapsed);
    }, 1000); // Check every second for super smooth timer updates

    // Tab visibility change logic
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Tab hidden -> Save accumulated time, update ref
        const startTime = startTimeRef.current ?? Date.now();
        const sessionElapsed = Math.round((Date.now() - startTime) / 1000);
        if (sessionElapsed > 0) {
          elapsedAccumulatedRef.current += sessionElapsed;
          saveScreenTime(sessionElapsed);
        }
      } else {
        // Tab visible again -> Reset start time
        startTimeRef.current = Date.now();
        void loadScreenTime(); // Refresh DB stats
      }
    };

    // Beforeunload fallback (tab close/refresh)
    const handleBeforeUnload = () => {
      const startTime = startTimeRef.current ?? Date.now();
      const finalSessionElapsed = Math.round((Date.now() - startTime) / 1000);
      if (finalSessionElapsed > 0) {
        // We trigger an asynchronous save
        saveScreenTime(finalSessionElapsed);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Unmount cleanup
    return () => {
      isActive = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      const startTime = startTimeRef.current ?? Date.now();
      const finalElapsed = Math.round((Date.now() - startTime) / 1000);
      if (finalElapsed > 0) {
        saveScreenTime(finalElapsed);
      }
    };
  }, []);

  const totalTimeSeconds = dbScreenTimeSeconds + localElapsedSeconds;
  const isLocked = totalTimeSeconds / 60 >= dailyLimitMinutes;

  // Loading state placeholder (very subtle)
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Loading your playground...
          </p>
        </div>
      </div>
    );
  }

  // SafeLock Overlay screen
  if (isLocked) {
    return (
      <div className="fixed inset-0 z-9999 flex h-screen w-screen items-center justify-center bg-linear-to-br from-sky-400 via-indigo-500 to-purple-650 dark:from-[#0B0F19] dark:via-[#111827] dark:to-[#1F1F35] overflow-hidden p-6 animate-in fade-in duration-500">
        {/* Playful Floating Stars/Blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-sky-300/10 dark:bg-sky-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-300/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-700" />

        <div className="relative w-full max-w-xl text-center space-y-8 animate-in zoom-in-95 duration-500">
          <Card className="rounded-[40px] border-4 border-white/60 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-2xl backdrop-blur-xl overflow-hidden p-8 sm:p-12 relative">
            <div className="absolute top-4 right-4 text-sky-400/25 dark:text-sky-500/15">
              <Sparkles className="w-12 h-12 animate-spin-slow" />
            </div>

            <CardContent className="p-0 flex flex-col items-center space-y-6">
              {/* Playful Icon Badge */}
              <div className="w-24 h-24 rounded-[36px] bg-linear-to-tr from-amber-400 to-orange-555 dark:from-amber-500 dark:to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 relative">
                <Sun className="w-12 h-12 animate-spin-slow" />
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-indigo-550 flex items-center justify-center text-white border-2 border-white dark:border-slate-900 animate-bounce">
                  <Moon className="w-3 h-3" />
                </div>
              </div>

              {/* Locked Header Title */}
              <div className="space-y-2">
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5 pt-1">
                  <Clock className="w-4 h-4 text-amber-500" /> Screen Time Limit Reached
                </p>
              </div>

              <div className="h-0.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />

              {/* Message */}
              <p className="text-base sm:text-lg font-bold text-slate-650 dark:text-slate-300 leading-relaxed max-w-md">
                Your screen time is up for today. It&apos;s time to rest your eyes, step away from
                the screen, and play outside! 🤸‍♂️🌱
              </p>

              {/* Eye Care Tip Card */}
              <div className="w-full flex items-center gap-4 p-4.5 rounded-3xl bg-slate-50 dark:bg-black/30 border border-slate-100 dark:border-slate-800 text-left">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-sky-550 border border-sky-100/10 shrink-0">
                  <EyeOff className="w-5 h-5 animate-pulse" />
                </div>
                <div className="leading-tight">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-0.5">
                    Try the 20-20-20 Rule
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Look at something 20 feet away for 20 seconds to relax your eyes.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs font-extrabold text-white/70 dark:text-slate-500 tracking-wider">
            Ask your parent if you need more time.
          </p>
        </div>
      </div>
    );
  }

  // Under limit -> Render standard application context
  return (
    <ScreenTimeContext.Provider
      value={{
        screenTimeSeconds: dbScreenTimeSeconds + localElapsedSeconds,
        dailyLimitMinutes,
        isLocked,
      }}
    >
      {children}
    </ScreenTimeContext.Provider>
  );
}
