"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, Award } from "lucide-react";
import { getSafeXP } from "@/hooks/useChildXP";
import type {
  DashboardUserProfile,
  LinkedChildProfile,
  ChildDetailsResult,
} from "@/types/dashboard.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParentDashboard } from "@/hooks/parent-dashboard/useParentDashboard";

export default function WelcomeBanner({
  profile,
  linkedChildren,
  childDetailsMap,
}: {
  profile: DashboardUserProfile;
  linkedChildren: LinkedChildProfile[];
  childDetailsMap: Record<string, ChildDetailsResult>;
}) {
  const { activeChildId } = useParentDashboard();

  // Aggregate stats across all kids
  let totalXP = 0;
  let totalCompleted = 0;
  let completedToday = 0;

  linkedChildren.forEach((child) => {
    totalXP += getSafeXP(child.total_experience_points);
    const details = childDetailsMap[child.user_id];
    if (details) {
      totalCompleted += details.total_completed;

      const today = new Date().toDateString();
      const todayCount =
        details.timeline?.filter((item) => {
          if (!item.created_at) return false;
          return new Date(item.created_at).toDateString() === today;
        }).length ?? 0;

      completedToday += todayCount;
    }
  });

  // Dynamic header message
  let summaryMessage = "Your children are ready to explore their learning adventure today!";
  if (linkedChildren.length > 0) {
    if (completedToday > 0) {
      summaryMessage = `Today, your children completed ${completedToday} learning ${completedToday === 1 ? "activity" : "activities"} and earned double XP milestones!`;
    } else if (totalCompleted > 0) {
      summaryMessage = `Your family has completed a total of ${totalCompleted} educational activities with excellent mastery. Let's keep the streak active!`;
    }
  }

  return (
    <Card className="rounded-[32px] overflow-hidden border-0 relative shadow-md bg-white dark:bg-black/30 transition-colors duration-300">
      {/* Dynamic gradients matched to Sky-Blue Theme */}
      <div className="absolute inset-0 bg-gradient-to-r from-sky-100/50 via-white to-sky-50/30 dark:from-black/80 dark:via-black/90 dark:to-black pointer-events-none" />

      {/* Decorative Blur Spheres */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <CardContent className="p-8 md:p-10 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex-1 space-y-5 text-center lg:text-left">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center lg:justify-start gap-3">
              Welcome back, {profile.first_name || "Parent"}{" "}
              <span className="inline-block animate-wave">👋</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base font-semibold max-w-2xl leading-relaxed">
              {summaryMessage}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
            <Button
              asChild
              className="rounded-full bg-sky-600 hover:bg-sky-700 text-white shadow-md hover:shadow-lg transition-all h-11 px-6 font-bold cursor-pointer dark:bg-sky-500 dark:hover:bg-sky-600"
            >
              <Link href="/dashboard/parent/children">
                Manage Children <Users className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-sky-200 dark:border-slate-800 bg-white/50 dark:bg-black/30 hover:bg-sky-50 dark:hover:bg-black text-sky-700 dark:text-sky-300 h-11 px-6 font-bold backdrop-blur-sm cursor-pointer"
            >
              <Link
                href={
                  activeChildId
                    ? `/dashboard/parent/progress?childId=${activeChildId}`
                    : "/dashboard/parent/progress"
                }
              >
                <Sparkles className="mr-2 w-4 h-4 text-sky-500" /> View Family Progress
              </Link>
            </Button>
          </div>
        </div>

        {linkedChildren.length > 0 && (
          <div className="shrink-0 flex flex-col items-center lg:items-end gap-3 bg-slate-50/50 dark:bg-black/30 border border-slate-100 dark:border-slate-800 p-6 rounded-[28px] shadow-sm backdrop-blur-md">
            <div className="flex -space-x-4 overflow-hidden mb-2">
              {linkedChildren.slice(0, 4).map((child) => (
                <Avatar
                  key={child.user_id}
                  className="inline-block w-14 h-14 border-4 border-white dark:border-black rounded-full ring-2 ring-slate-100 dark:ring-slate-800"
                >
                  <AvatarImage src={child.avatar_url ?? undefined} className="object-cover" />
                  <AvatarFallback className="text-base font-black bg-gradient-to-br from-sky-400 to-sky-600 text-white">
                    {child.first_name?.[0] || "C"}
                  </AvatarFallback>
                </Avatar>
              ))}
              {linkedChildren.length > 4 && (
                <div className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-white dark:border-black bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-sm font-black ring-2 ring-slate-100 dark:ring-slate-800">
                  +{linkedChildren.length - 4}
                </div>
              )}
            </div>

            <div className="text-center lg:text-right space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                <Award className="w-3.5 h-3.5" /> {totalXP} Family XP
              </span>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                {linkedChildren.length === 1
                  ? "1 Linked Explorer"
                  : `${linkedChildren.length} Linked Explorers`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
