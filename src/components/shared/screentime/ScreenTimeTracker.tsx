"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import {
  getDailyScreenTime,
  logScreenTimeSession,
  notifyParentLimitReached,
} from "@/lib/services/shared/screentime.actions";
import { Clock, Sun, Sparkles, Moon, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getLocalDateString } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import {
  SCREENTIME_HEARTBEAT_INTERVALS,
  SCREENTIME_THRESHOLDS,
  FEATURE_FLAGS,
} from "@/lib/constants/screentime";

interface ScreenTimeContextType {
  screenTimeSeconds: number;
  dailyLimitMinutes: number;
  isLimitEnabled: boolean;
  isLocked: boolean;
}

const ScreenTimeContext = createContext<ScreenTimeContextType>({
  screenTimeSeconds: 0,
  dailyLimitMinutes: 60,
  isLimitEnabled: false,
  isLocked: false,
});

export const useScreenTime = () => useContext(ScreenTimeContext);

export default function ScreenTimeTracker({ children }: { children: React.ReactNode }) {
  const { userProfile } = useAuth();
  const childId = userProfile?.user_id || "";

  const [dbScreenTimeSeconds, setDbScreenTimeSeconds] = useState(0);
  const [dailyLimitMinutes, setDailyLimitMinutes] = useState(60);
  const [isLimitEnabled, setIsLimitEnabled] = useState(false);
  const [localElapsedSeconds, setLocalElapsedSeconds] = useState(0);
  const [isLeader, setIsLeader] = useState(false);
  const isLeaderRef = useRef(false);

  // keep ref in sync with state (update ref outside of render)
  useEffect(() => {
    isLeaderRef.current = isLeader;
  }, [isLeader]);

  // Stable per-instance identifier for cross-tab coordination
  const tabIdRef = useRef(crypto.randomUUID());

  // Refs for tracking timestamps, drift, activity, and midnight rollover
  const lastTickRef = useRef<number>(0);
  const elapsedAccumulatedRef = useRef<number>(0);
  const lastActivityRef = useRef<number>(0);
  const activeDateRef = useRef<string>("");
  const currentDayRef = useRef<string>(""); // For midnight rollover check
  const syncTimerRef = useRef<number>(0);

  // BroadcastChannel for cross-tab state synchronization
  const syncChannelRef = useRef<BroadcastChannel | null>(null);

  // Helper to fetch the latest screen time details from the DB
  const fetchScreenTime = useCallback(
    async (tz: string) => {
      if (!childId) return;
      try {
        const data = await getDailyScreenTime(childId, tz);
        if (data.success) {
          setDbScreenTimeSeconds(data.screenTimeSeconds);
          setDailyLimitMinutes(data.dailyLimitMinutes);
          setIsLimitEnabled(data.isLimitEnabled);

          // Broadcast to observer tabs
          if (syncChannelRef.current) {
            try {
              syncChannelRef.current.postMessage({
                type: "db_sync",
                dbScreenTimeSeconds: data.screenTimeSeconds,
                dailyLimitMinutes: data.dailyLimitMinutes,
                isLimitEnabled: data.isLimitEnabled,
                sourceTab: tabIdRef.current,
              });
            } catch (err) {
              console.warn(
                "[ScreenTimeTracker] Broadcast sync failed (channel might be closed):",
                err
              );
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch daily screen time limit:", err);
      }
    },
    [childId]
  );

  // Helper to save tracked seconds to DB with offline queuing
  const saveScreenTime = useCallback(
    async (seconds: number, tz: string) => {
      if (!childId || seconds <= 0) return;

      // Read any pending unsynced queue from localStorage
      let unsynced = 0;
      try {
        unsynced = parseInt(localStorage.getItem("screen_time_unsynced") || "0", 10);
        if (isNaN(unsynced)) unsynced = 0;
      } catch {
        unsynced = 0;
      }

      const totalToSync = seconds + unsynced;

      try {
        if (process.env.NODE_ENV !== "production") {
          console.log(
            `[ScreenTimeTracker] Dev Monitor - Attempting sync: ${seconds}s (total with unsynced: ${totalToSync}s)`
          );
        }
        const result = await logScreenTimeSession(childId, totalToSync, tz);
        if (result.success) {
          // Success -> Clear unsynced queue
          localStorage.removeItem("screen_time_unsynced");
          if (process.env.NODE_ENV !== "production") {
            console.log(
              `[ScreenTimeTracker] Dev Monitor - Sync successful. Unsynced queue cleared.`
            );
          }
        } else {
          // Failure -> Queue it locally
          localStorage.setItem("screen_time_unsynced", String(totalToSync));
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `[ScreenTimeTracker] Dev Monitor - Sync failed: ${result.error}. Queued offline.`
            );
          }
        }
      } catch (err) {
        console.warn("[ScreenTimeTracker] Network error, queuing screen time offline:", err);
        localStorage.setItem("screen_time_unsynced", String(totalToSync));
      }
    },
    [childId]
  );

  // NEW: Store latest state to prevent stale closures and dependency loops
  const stateRefs = useRef({
    dbScreenTimeSeconds,
    dailyLimitMinutes,
    isLimitEnabled,
    isLeader,
  });

  useEffect(() => {
    stateRefs.current = {
      dbScreenTimeSeconds,
      dailyLimitMinutes,
      isLimitEnabled,
      isLeader,
    };
  }, [dbScreenTimeSeconds, dailyLimitMinutes, isLimitEnabled, isLeader]);

  // Dedicated Mount-Only initial fetch guarded by hasFetchedRef
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (hasFetchedRef.current || !childId) return;
    hasFetchedRef.current = true;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    void fetchScreenTime(tz);
  }, [fetchScreenTime, childId]);

  // Effect: Listen to real-time updates for parent limit settings (Task 8 & 9)
  useEffect(() => {
    if (!childId) return;

    const supabase = createClient();
    const channelName = `screentime-limit-sync-${childId}`;

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[ScreenTimeTracker] Dev Monitor - Subscribing to real-time parent_child_link for child: ${childId}`
      );
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "parent_child_link",
          filter: `child_user_id=eq.${childId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (process.env.NODE_ENV !== "production") {
            console.log(
              "[ScreenTimeTracker] Dev Monitor - Real-time link update payload:",
              payload
            );
          }
          const record = payload.new as {
            daily_limit_minutes?: number;
            is_screen_time_limit_enabled?: boolean;
            is_active?: boolean;
            deleted_at?: string | null;
          };

          // Update local state reactively if it is an active approved connection
          if (record && record.is_active !== false && !record.deleted_at) {
            if (record.daily_limit_minutes !== undefined) {
              setDailyLimitMinutes(record.daily_limit_minutes);
            }
            if (record.is_screen_time_limit_enabled !== undefined) {
              setIsLimitEnabled(record.is_screen_time_limit_enabled);
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [childId]);

  // Effect 1: Core Lifecycle Tracking, Multi-Tab Election, Inactivity & Drift Safety
  // Core lifecycle effect: runs once on mount. Uses refs for mutable values.

  useEffect(() => {
    const myTabId = tabIdRef.current;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    activeDateRef.current = getLocalDateString(new Date(), tz);
    currentDayRef.current = new Date().toDateString(); // Midnight rollover initialization

    // Initialize cross-tab sync channel
    if (typeof window !== "undefined") {
      try {
        syncChannelRef.current = new BroadcastChannel("screen_time_sync");
        syncChannelRef.current.onmessage = (event) => {
          if (event.data.type === "db_sync") {
            setDbScreenTimeSeconds(event.data.dbScreenTimeSeconds);
            setDailyLimitMinutes(event.data.dailyLimitMinutes);
            setIsLimitEnabled(event.data.isLimitEnabled);
            setLocalElapsedSeconds(0); // Reset local count since DB sync refreshed it
            elapsedAccumulatedRef.current = 0;
            lastTickRef.current = Date.now();
          } else if (event.data.type === "leader_heartbeat") {
            // If another tab holds a fresh leader lease, this tab stays or becomes observer
            if (event.data.leaderTab !== myTabId) {
              setIsLeader(false);
            }
          }
        };
      } catch {
        console.warn("BroadcastChannel not supported, running tab-isolated sync.");
      }
    }

    lastTickRef.current = Date.now();
    lastActivityRef.current = Date.now();
    elapsedAccumulatedRef.current = 0;

    // Track user input to detect idle state (5 minutes threshold)
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("mousedown", handleActivity, { passive: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });
    window.addEventListener("scroll", handleActivity, { passive: true });

    // Main robust interval loop running every second
    const intervalId = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - lastTickRef.current;

      // Prevent interval double-firing or running ahead of 1s bounds
      if (elapsedMs < 1000) return;

      const elapsedSecs = Math.floor(elapsedMs / 1000);
      lastTickRef.current = now;

      // Pause tracking if tab is hidden (Task 3 & 7 requirement)
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      // Midnight Day Rollover (The "Tab Left Open" Edge Case)
      const todayString = new Date().toDateString();
      if (todayString !== currentDayRef.current) {
        // Reset local unsynced seconds
        elapsedAccumulatedRef.current = 0;
        setLocalElapsedSeconds(0);
        syncTimerRef.current = 0;

        // Re-fetch server state to reset syncedTotal to 0
        void fetchScreenTime(tz);

        // Update currentDay to the new day
        currentDayRef.current = todayString;
        activeDateRef.current = getLocalDateString(new Date(), tz);
        return;
      }

      // 1. Extra Midnight Day Rollover protection via calendar calculation
      const currentLocalDate = getLocalDateString(new Date(), tz);
      if (currentLocalDate !== activeDateRef.current) {
        activeDateRef.current = currentLocalDate;
        setDbScreenTimeSeconds(0);
        setLocalElapsedSeconds(0);
        elapsedAccumulatedRef.current = 0;
        void fetchScreenTime(tz);
        return;
      }

      // 2. Lock & Notification Check: If screen is already locked, return early to halt the heartbeat timer.
      // Use refs to prevent dependency loop and stale closures
      const currentTotalMins =
        (stateRefs.current.dbScreenTimeSeconds + elapsedAccumulatedRef.current) / 60;
      const currentLimit = stateRefs.current.dailyLimitMinutes;
      const currentLocked = stateRefs.current.isLimitEnabled && currentTotalMins >= currentLimit;

      if (currentLocked) {
        // Immediate flush of any remaining unsynced seconds on screen lock activation (Task 3)
        if (stateRefs.current.isLeader && syncTimerRef.current > 0) {
          const finalSession = syncTimerRef.current;
          syncTimerRef.current = 0;
          if (process.env.NODE_ENV !== "production") {
            console.log(
              `[ScreenTimeTracker] Dev Monitor - Limit reached! Flushing final ${finalSession}s immediately.`
            );
          }
          void saveScreenTime(finalSession, tz);
        }

        if (childId && typeof window !== "undefined") {
          const todayString = new Date().toDateString();
          const storageKey = `notified_limit_${childId}`;
          const lastNotifiedValue = localStorage.getItem(storageKey);

          const currentNotifiedValue = `${todayString}_${currentLimit}`;

          if (lastNotifiedValue !== currentNotifiedValue) {
            notifyParentLimitReached(childId, currentLimit)
              .then(() => localStorage.setItem(storageKey, currentNotifiedValue))
              .catch(console.error);
          }
        }
        return;
      }

      // 3. Idle State Detection: Pause tracking if idle > 5 mins
      const isIdle = now - lastActivityRef.current > 300000;
      if (isIdle) {
        return;
      }

      // 4. Multi-Tab Leader Election Lease Check
      let electedLeader = false;
      try {
        const leaderDataRaw = localStorage.getItem("screen_time_leader");
        if (leaderDataRaw) {
          const leader = JSON.parse(leaderDataRaw);
          if (leader.tabId === myTabId) {
            // Keep lease active
            localStorage.setItem(
              "screen_time_leader",
              JSON.stringify({ tabId: myTabId, timestamp: now })
            );
            electedLeader = true;
          } else if (now - leader.timestamp > 3000) {
            // Lease expired -> Claim leadership
            localStorage.setItem(
              "screen_time_leader",
              JSON.stringify({ tabId: myTabId, timestamp: now })
            );
            electedLeader = true;
          }
        } else {
          // No leader exists -> Claim leadership
          localStorage.setItem(
            "screen_time_leader",
            JSON.stringify({ tabId: myTabId, timestamp: now })
          );
          electedLeader = true;
        }
      } catch {
        // LocalStorage blocked or error -> Fallback to isolated leader
        electedLeader = true;
      }

      setIsLeader(electedLeader);

      // Broadcast heartbeat if leader
      if (electedLeader) {
        if (syncChannelRef.current) {
          try {
            syncChannelRef.current.postMessage({
              type: "leader_heartbeat",
              leaderTab: myTabId,
            });
          } catch (err) {
            console.warn(
              "[ScreenTimeTracker] Heartbeat broadcast failed (channel might be closed):",
              err
            );
          }
        }

        // Accumulate active seconds
        elapsedAccumulatedRef.current += elapsedSecs;
        if (elapsedAccumulatedRef.current % 5 === 0) {
          setLocalElapsedSeconds(elapsedAccumulatedRef.current);
        }

        // Calculate dynamic/adaptive heartbeat interval using configuration (Task 2 & 9)
        let targetInterval = SCREENTIME_HEARTBEAT_INTERVALS.DEFAULT;

        if (FEATURE_FLAGS.ENABLE_ADAPTIVE_HEARTBEAT) {
          if (!stateRefs.current.isLimitEnabled) {
            targetInterval = SCREENTIME_HEARTBEAT_INTERVALS.SAFE;
          } else {
            const totalElapsedSecs =
              stateRefs.current.dbScreenTimeSeconds + elapsedAccumulatedRef.current;
            const limitSecs = stateRefs.current.dailyLimitMinutes * 60;
            const remainingSecs = Math.max(0, limitSecs - totalElapsedSecs);
            const remainingMins = remainingSecs / 60;

            if (remainingMins <= SCREENTIME_THRESHOLDS.WARNING_MINUTES) {
              targetInterval = SCREENTIME_HEARTBEAT_INTERVALS.DANGER; // <= 5 mins -> 15s
            } else if (remainingMins <= SCREENTIME_THRESHOLDS.MEDIUM_MINUTES) {
              targetInterval = SCREENTIME_HEARTBEAT_INTERVALS.WARNING; // 5-10 mins -> 30s
            } else if (remainingMins <= SCREENTIME_THRESHOLDS.SAFE_MINUTES) {
              targetInterval = SCREENTIME_HEARTBEAT_INTERVALS.MEDIUM; // 10-20 mins -> 45s
            } else {
              targetInterval = SCREENTIME_HEARTBEAT_INTERVALS.SAFE; // > 20 mins -> 90s
            }
          }
        }

        if (process.env.NODE_ENV !== "production" && syncTimerRef.current === 0) {
          console.log(
            `[ScreenTimeTracker] Dev Monitor - Leader active. Selected dynamic interval: ${targetInterval}s.`
          );
        }

        // Periodically sync heartbeat log to database
        syncTimerRef.current += elapsedSecs;
        if (syncTimerRef.current >= targetInterval) {
          const secondsToSync = syncTimerRef.current;
          syncTimerRef.current = 0;
          void saveScreenTime(secondsToSync, tz);
        }
      }
    }, 1000);

    // Tab visibility change logic
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (stateRefs.current.isLeader) {
          // Use ref, not closure state
          const sessionElapsed = syncTimerRef.current;
          syncTimerRef.current = 0;
          if (sessionElapsed > 0) {
            if (process.env.NODE_ENV !== "production") {
              console.log(
                `[ScreenTimeTracker] Dev Monitor - Tab hidden. Flushing unsynced ${sessionElapsed}s.`
              );
            }
            void saveScreenTime(sessionElapsed, tz);
          }
        }
      } else {
        lastTickRef.current = Date.now();
        void fetchScreenTime(tz);
      }
    };

    // Beforeunload fallback (tab close/refresh)
    const handleBeforeUnload = () => {
      if (stateRefs.current.isLeader) {
        // Use ref, not closure state
        const finalSessionElapsed = syncTimerRef.current;
        syncTimerRef.current = 0;
        if (finalSessionElapsed > 0) {
          if (process.env.NODE_ENV !== "production") {
            console.log(
              `[ScreenTimeTracker] Dev Monitor - Tab closing/refreshing. Flushing final ${finalSessionElapsed}s.`
            );
          }
          void saveScreenTime(finalSessionElapsed, tz);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanups
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("scroll", handleActivity);

      // Sync remaining seconds on unmount if leader
      if (stateRefs.current.isLeader && syncTimerRef.current > 0) {
        const finalSession = syncTimerRef.current;
        syncTimerRef.current = 0;
        if (process.env.NODE_ENV !== "production") {
          console.log(
            `[ScreenTimeTracker] Dev Monitor - Tracker unmounting. Flushing final ${finalSession}s.`
          );
        }
        void saveScreenTime(finalSession, tz);
      }

      // Close BroadcastChannel
      try {
        syncChannelRef.current?.close();
      } catch (err) {
        console.warn("[ScreenTimeTracker] Error closing sync channel on unmount:", err);
      }
      syncChannelRef.current = null;

      // Clean leadership key if unmounting leader
      try {
        const leaderRaw = localStorage.getItem("screen_time_leader");
        if (leaderRaw) {
          const leader = JSON.parse(leaderRaw);
          if (leader.tabId === myTabId) {
            localStorage.removeItem("screen_time_leader");
          }
        }
      } catch {
        // Ignore errors on cleanup
      }
    };
  }, [fetchScreenTime, saveScreenTime, childId]); // Strict exhaustive stable dependencies

  const isLocked =
    isLimitEnabled && (dbScreenTimeSeconds + localElapsedSeconds) / 60 >= dailyLimitMinutes;

  // Trigger parent notification once when lock state is reached with persistent localStorage lock.
  useEffect(() => {
    if (isLocked && childId) {
      if (typeof window !== "undefined") {
        const today = new Date().toDateString();
        const storageKey = `notified_limit_${childId}`;
        const lastNotifiedValue = localStorage.getItem(storageKey);
        const currentNotifiedValue = `${today}_${dailyLimitMinutes}`;

        if (lastNotifiedValue !== currentNotifiedValue) {
          notifyParentLimitReached(childId, dailyLimitMinutes)
            .then(() => {
              localStorage.setItem(storageKey, currentNotifiedValue);
            })
            .catch((err) => {
              console.error("Failed to notify parent about screen limit:", err);
            });
        }
      }
    }
  }, [isLocked, childId, dailyLimitMinutes]);

  // SafeLock Overlay screen
  if (isLocked) {
    return (
      <div className="fixed inset-0 z-9999 flex h-screen w-screen items-center justify-center bg-linear-to-br from-sky-400 via-indigo-500 to-purple-650 dark:from-[#0B0F19] dark:via-[#111827] dark:to-[#1F1F35] overflow-hidden p-6 animate-in fade-in duration-500">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-sky-300/10 dark:bg-sky-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-300/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-700" />

        <div className="relative w-full max-w-xl text-center space-y-8 animate-in zoom-in-95 duration-500">
          <Card className="rounded-[40px] border-4 border-white/60 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-2xl backdrop-blur-xl overflow-hidden p-8 sm:p-12 relative">
            <div className="absolute top-4 right-4 text-sky-400/25 dark:text-sky-500/15">
              <Sparkles className="w-12 h-12 animate-spin-slow" />
            </div>

            <CardContent className="p-0 flex flex-col items-center space-y-6">
              <div className="w-24 h-24 rounded-[36px] bg-linear-to-tr from-amber-400 to-orange-555 dark:from-amber-500 dark:to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 relative">
                <Sun className="w-12 h-12 animate-spin-slow" />
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-indigo-550 flex items-center justify-center text-white border-2 border-white dark:border-slate-900 animate-bounce">
                  <Moon className="w-3 h-3" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-linear-to-r from-sky-600 via-indigo-600 to-purple-650 dark:from-sky-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent leading-none">
                  Great job today! 🎉
                </h1>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5 pt-1">
                  <Clock className="w-4 h-4 text-amber-500" /> Screen Time Limit Reached
                </p>
              </div>

              <div className="h-0.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />

              <p className="text-base sm:text-lg font-bold text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
                Your screen time is up for today. It&apos;s time to rest your eyes, step away from
                the screen, and play outside! 🤸‍♂️🌱
              </p>

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

  return (
    <ScreenTimeContext.Provider
      value={{
        screenTimeSeconds: dbScreenTimeSeconds + localElapsedSeconds,
        dailyLimitMinutes,
        isLimitEnabled,
        isLocked,
      }}
    >
      {children}
    </ScreenTimeContext.Provider>
  );
}
