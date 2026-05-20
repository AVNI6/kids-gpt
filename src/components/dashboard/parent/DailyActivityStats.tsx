import { Card, CardContent } from "@/components/ui/card";
import { Flame, Trophy, Crown } from "lucide-react";
import type { LinkedChildProfile } from "@/types/dashboard.types";

type DailyActivityStatsProps = {
  child: LinkedChildProfile | null;
};

export default async function DailyActivityStats({ child }: DailyActivityStatsProps) {
  if (!child) {
    return (
      <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
        <CardContent className="p-6 text-center text-slate-500">
          Select a child to view activity.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      {/* Activity Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Today&apos;s Activity
        </h3>
        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Flame className="w-4 h-4 text-orange-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 h-full">
        {/* Current Streak */}
        <Card className="rounded-[24px] border-orange-200/50 dark:border-orange-500/20 bg-linear-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-slate-900/40 shadow-sm overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="rounded-xl bg-orange-100 dark:bg-orange-900/40 p-2.5">
                <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-[10px] font-black text-orange-600/80 dark:text-orange-400/80 uppercase tracking-widest">
                Active
              </p>
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 relative z-10">
              Current Streak
            </p>
            <div className="flex items-baseline gap-1.5 relative z-10">
              <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                {child.current_streak || 0}
              </p>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">days</span>
            </div>
          </CardContent>
        </Card>

        {/* Longest Streak */}
        <Card className="rounded-[24px] border-rose-200/50 dark:border-rose-500/20 bg-linear-to-br from-rose-50 to-white dark:from-rose-950/30 dark:to-slate-900/40 shadow-sm overflow-hidden group">
          <CardContent className="p-6 relative">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-colors" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="rounded-xl bg-rose-100 dark:bg-rose-900/40 p-2.5">
                <Crown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <p className="text-[10px] font-black text-rose-600/80 dark:text-rose-400/80 uppercase tracking-widest">
                Best
              </p>
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 relative z-10">
              Longest Streak
            </p>
            <div className="flex items-baseline gap-1.5 relative z-10">
              <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                {child.longest_streak || 0}
              </p>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">all time</span>
            </div>
          </CardContent>
        </Card>

        {/* Total XP */}
        <Card className="rounded-[24px] border-amber-200/50 dark:border-amber-500/20 bg-linear-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900/40 shadow-sm overflow-hidden group sm:col-span-2 lg:col-span-1">
          <CardContent className="p-6 relative">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="rounded-xl bg-amber-100 dark:bg-amber-900/40 p-2.5">
                <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-[10px] font-black text-amber-600/80 dark:text-amber-400/80 uppercase tracking-widest">
                Lifetime
              </p>
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 relative z-10">
              Total Experience
            </p>
            <div className="flex items-baseline gap-1.5 relative z-10">
              <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                {child.total_experience_points || 0}
              </p>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">xp</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
