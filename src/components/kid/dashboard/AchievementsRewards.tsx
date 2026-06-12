import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Medal, Lock, Zap } from "lucide-react";

export function AchievementsRewardsSkeleton() {
  return (
    <Card className="rounded-[32px] border-amber-100 bg-white shadow-sm h-full">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-8 w-48 bg-slate-100" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl bg-slate-100" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AchievementsRewards({ xp }: { xp: number }) {
  const level = Math.floor(xp / 1000) + 1;
  const badges = [
    {
      name: "Fast Learner",
      icon: Zap,
      unlocked: true,
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-950/40",
    },
    {
      name: "Quiz Master",
      icon: Trophy,
      unlocked: true,
      color: "text-rose-500 dark:text-rose-400",
      bg: "bg-rose-100 dark:bg-rose-950/40",
    },
    {
      name: "Science Pro",
      icon: Medal,
      unlocked: false,
      color: "text-slate-400 dark:text-slate-500",
      bg: "bg-slate-100 dark:bg-slate-800",
    },
    {
      name: "Code Star",
      icon: Star,
      unlocked: false,
      color: "text-slate-400 dark:text-slate-500",
      bg: "bg-slate-100 dark:bg-slate-800",
    },
  ];

  return (
    <section className="space-y-4 h-full flex flex-col">
      <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
        Achievements 🏆
      </h2>
      <Card className="rounded-[32px] border-amber-200 bg-linear-to-br from-amber-50 to-orange-50 shadow-sm flex-1 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-orange-950/20">
        <CardContent className="p-6 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-inner text-white">
                <Star className="w-6 h-6 fill-white" />
              </div>
              <div>
                <h3 className="font-black text-xl text-slate-900 dark:text-slate-50">
                  Level {level}
                </h3>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {xp} / {level * 1000} XP
                </p>
              </div>
            </div>
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-full dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-950/60">
              4 Badges
            </Badge>
          </div>

          <Progress
            value={(xp % 1000) / 10}
            className="h-3 mb-6 bg-amber-200/50 dark:bg-amber-950/30"
            indicatorClassName="bg-gradient-to-r from-amber-400 to-orange-500"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {badges.map((badge, i) => {
              const Icon = badge.unlocked ? badge.icon : Lock;
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${badge.unlocked ? "bg-white border-amber-100 shadow-sm dark:bg-slate-800 dark:border-slate-700" : "bg-slate-50 border-slate-100 opacity-70 dark:bg-slate-900 dark:border-slate-850"} text-center group`}
                >
                  <div
                    className={`p-3 rounded-full ${badge.bg} ${badge.color} mb-2 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
                    {badge.name}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
