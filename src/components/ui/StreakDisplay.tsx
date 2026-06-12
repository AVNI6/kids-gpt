import React from "react";
import { Flame, Trophy, WandSparkles } from "lucide-react";
import { getSafeStreak } from "@/hooks/kid/useChildStreak";

export interface StreakDisplayProps {
  streak: number | null | undefined;
  variant:
    | "badge"
    | "glass-badge"
    | "kid-card"
    | "parent-card"
    | "profile-section"
    | "overview-block"
    | "simple-text";
  className?: string;
}

export default function StreakDisplay({ streak, variant, className = "" }: StreakDisplayProps) {
  const activeStreak = getSafeStreak(streak);

  switch (variant) {
    case "badge":
      // Elegant small badge (Parent WelcomeBanner.tsx)
      if (activeStreak <= 0) return null;
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/30 ${className}`}
        >
          <Flame className="w-3.5 h-3.5 fill-current animate-pulse text-amber-500" />
          {activeStreak} Day Streak
        </span>
      );

    case "glass-badge":
      // Translucent glassmorphism badge (Kid WelcomeHub.tsx)
      return (
        <div
          className={`flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 shadow-inner ${className}`}
        >
          <Flame className="w-6 h-6 text-orange-400 fill-orange-400 animate-pulse" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold uppercase text-sky-100 leading-tight">Streak</span>
            <span className="font-black leading-none text-white">{activeStreak} days</span>
          </div>
        </div>
      );

    case "kid-card":
      // Golden themed block inside kid dash (KidStreakBanner.tsx)
      return (
        <div
          className={`rounded-[28px] border border-slate-200/60 bg-white/90 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40 dark:shadow-none ${className}`}
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-400">
            <Flame className="h-4 w-4 text-sky-700 dark:text-sky-400 animate-pulse" />
            Learning streak
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-black leading-none text-slate-950 dark:text-slate-50">
              {activeStreak}
            </span>
            <span className="pb-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              days straight!
            </span>
          </div>
        </div>
      );

    case "parent-card":
      // Stat grid item for parent child view (LearningProgress.tsx)
      return (
        <div
          className={`rounded-[28px] border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100/30 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-500 fill-amber-500/20" />
            </div>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">
            Current Streak
          </h3>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {activeStreak} <span className="text-base font-bold text-slate-400">days</span>
          </p>
        </div>
      );

    case "profile-section":
      // Gradient box inside kid profile (KidProfileManager.tsx)
      return (
        <div
          className={`rounded-3xl bg-linear-to-br from-sky-50 to-emerald-50 p-4 ring-1 ring-sky-100 dark:from-sky-950/20 dark:to-emerald-950/20 dark:ring-slate-800 ${className}`}
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-400">
            <WandSparkles className="h-4 w-4" />
            Learning streak
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-black leading-none text-slate-950 dark:text-slate-50">
              {activeStreak}
            </span>
            <span className="pb-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              days straight
            </span>
          </div>
        </div>
      );

    case "overview-block":
      // Micro-stats panel card inside parent children grid (ChildOverviewCard.tsx)
      return (
        <div
          className={`flex-1 md:flex-none flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 border border-orange-200/50 dark:border-orange-500/20 rounded-3xl p-5 md:px-8 shadow-sm backdrop-blur-md relative overflow-hidden group ${className}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400 font-black text-[11px] uppercase tracking-widest relative z-10">
            <Flame className="w-5 h-5 fill-orange-500 text-orange-500 animate-pulse" />
            <span>Streak</span>
          </div>
          <div className="flex items-baseline gap-1.5 relative z-10">
            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
              {activeStreak}
            </span>
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500">days</span>
          </div>
        </div>
      );

    case "simple-text":
    default:
      // Simplified inline representation (ActiveStudentsList.tsx)
      return (
        <span className={`text-orange-500 dark:text-orange-400 font-bold ${className}`}>
          {activeStreak} days
        </span>
      );
  }
}
