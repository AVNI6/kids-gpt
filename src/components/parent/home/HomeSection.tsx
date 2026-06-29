"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MdFamilyRestroom } from "react-icons/md";
import { Trophy, Clock, Activity, Users, CheckCircle2 } from "lucide-react";
import { useParentDashboard } from "@/hooks/parent/useParentDashboard";
import { getSafeXP, getLevel } from "@/hooks/kid/useChildXP";
import type { ChildDetailsResult } from "@/types/parent";
import WelcomeBanner from "@/components/parent/home/WelcomeBanner";

interface FamilyTimelineItem {
  id: string;
  childName: string;
  childAvatar: string | null;
  title: string;
  description: string;
  created_at: string | null;
  rewards_amount: number;
}

export default function HomeSection() {
  const { profile, linkedChildren, cache, isLoadingChildData } = useParentDashboard();

  // 1. Dynamic family metrics aggregation from client cache
  const familyMetrics = useMemo(() => {
    let totalXP = 0;
    let totalMins = 0;
    let totalCompleted = 0;

    linkedChildren.forEach((child) => {
      totalXP += getSafeXP(child.total_experience_points);
      const childData = cache[child.user_id];
      if (childData?.details) {
        totalMins += childData.details.learning_time_mins;
        totalCompleted += childData.details.total_completed;
      }
    });

    const timeStr =
      totalMins > 60 ? `${Math.floor(totalMins / 60)}h ${totalMins % 60}m` : `${totalMins}m`;

    return {
      totalXP,
      totalMins,
      timeStr,
      totalCompleted,
    };
  }, [linkedChildren, cache]);

  // 2. Aggregate recent activity feed across all cached children
  const familyTimeline = useMemo(() => {
    const timeline: FamilyTimelineItem[] = [];

    linkedChildren.forEach((child) => {
      const childData = cache[child.user_id];
      if (childData?.details?.timeline) {
        childData.details.timeline.forEach((item) => {
          timeline.push({
            id: item.id,
            title:
              item.activity_settings?.title ||
              item.description
                ?.replace(/^Completed\s+/i, "")
                .replace(/\s*\(Score:\s*\d+%\)/i, "") ||
              "Completed Activity",
            description: item.description ?? "Completed activity",
            created_at: item.created_at,
            rewards_amount: item.rewards_amount ?? 0,
            childName: child.first_name || "Child",
            childAvatar: child.avatar_url,
          });
        });
      }
    });

    // Sort chronologically descending with safe NaN/null handling
    return timeline.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [linkedChildren, cache]);

  // Create childDetailsMap fallback for WelcomeBanner compatibility
  const childDetailsMap = useMemo(() => {
    const map: Record<string, ChildDetailsResult> = {};
    linkedChildren.forEach((child) => {
      if (cache[child.user_id]?.details) {
        map[child.user_id] = cache[child.user_id].details!;
      }
    });
    return map;
  }, [linkedChildren, cache]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-900 dark:text-slate-100">
      <WelcomeBanner
        profile={profile}
        linkedChildren={linkedChildren}
        childDetailsMap={childDetailsMap}
      />

      {/* Unified Family Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 card-gap">
        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="card-padding relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-slate-500 dark:text-slate-400 font-bold text-body-xs uppercase tracking-wider mb-0.5">
                Family Total XP
              </h3>
              <p className="text-2xl sm:text-3xl font-black tracking-tight">
                {familyMetrics.totalXP}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="card-padding relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-sky-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-slate-500 dark:text-slate-400 font-bold text-body-xs uppercase tracking-wider mb-0.5">
                Total Study Time
              </h3>
              <p className="text-2xl sm:text-3xl font-black tracking-tight">
                {isLoadingChildData ? "..." : familyMetrics.timeStr}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="card-padding relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-slate-500 dark:text-slate-400 font-bold text-body-xs uppercase tracking-wider mb-0.5">
                Completed Activities
              </h3>
              <p className="text-2xl sm:text-3xl font-black tracking-tight">
                {isLoadingChildData ? "..." : familyMetrics.totalCompleted}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="card-padding relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-sky-500" />
            </div>
            <div>
              <h3 className="text-slate-500 dark:text-slate-400 font-bold text-body-xs uppercase tracking-wider mb-0.5">
                Active Children
              </h3>
              <p className="text-2xl sm:text-3xl font-black tracking-tight">
                {linkedChildren.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Unified Chronological Activity Feed and Family recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_0.9fr] card-gap">
        <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm overflow-hidden flex flex-col h-[580px]">
          <div className="card-padding py-4 md:py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <h3 className="text-card-title flex items-center gap-2">
              <Activity className="icon-sm text-sky-600 animate-pulse" /> Recent Family Activity
            </h3>
          </div>
          <CardContent className="flex-1 min-h-0 card-padding pt-0">
            <ScrollArea className="h-full pr-4 -mr-4">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/40 pr-2">
                {isLoadingChildData && familyTimeline.length === 0 ? (
                  <div className="space-y-6 py-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex gap-4 items-start py-5 first:pt-0 border-b last:border-0 border-slate-100 dark:border-slate-800/40 animate-pulse"
                      >
                        <Skeleton className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                        <div className="flex-1 space-y-2.5">
                          <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                            <Skeleton className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                          </div>
                          <Skeleton className="h-3 w-56 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                        <Skeleton className="h-5 w-14 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : familyTimeline.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 font-bold text-sm">
                    Your children haven&apos;t played any learning games yet!
                  </div>
                ) : (
                  familyTimeline.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex gap-4 items-start py-5 first:pt-0 last:pb-0"
                    >
                      <Avatar className="w-10 h-10 border-2 border-white dark:border-slate-800 rounded-full shrink-0 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800">
                        <AvatarImage src={item.childAvatar ?? undefined} className="object-cover" />
                        <AvatarFallback className="text-body-xs font-black bg-gradient-to-br from-sky-400 to-sky-600 text-white">
                          {item.childName?.[0] || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="text-body-sm font-extrabold">{item.childName}</span>
                          <span
                            className="text-body-xs font-bold text-slate-400 shrink-0 ml-2"
                            suppressHydrationWarning
                          >
                            {item.created_at
                              ? new Date(item.created_at).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                              : "Recently"}
                          </span>
                        </div>
                        <p className="text-body-sm font-semibold text-slate-700 dark:text-slate-300">
                          {item.title}
                        </p>
                        {item.description && item.description !== item.title && (
                          <p className="text-body-xs text-slate-400 dark:text-slate-500 font-medium leading-relaxed mt-0.5 animate-in fade-in">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-lg text-body-xs shrink-0 border border-emerald-100 dark:border-emerald-900/30">
                        +{item.rewards_amount || 20} XP
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Family AI Onboarding & Recommendations */}
        <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm flex flex-col card-padding relative overflow-hidden h-[580px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="flex flex-col h-full justify-between gap-6 min-h-0">
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-10 h-10 bg-sky-50 dark:bg-sky-950/40 rounded-xl flex items-center justify-center">
                  <MdFamilyRestroom className="icon-sm text-sky-500" />
                </div>
                <h3 className="text-card-title">Family AI Insights</h3>
              </div>

              {linkedChildren.length === 0 ? (
                <div className="space-y-4 text-center py-6">
                  <p className="text-body-sm font-semibold text-slate-500">No linked kids</p>
                  <p className="text-body-xs text-slate-400 font-medium leading-relaxed">
                    Add your child&apos;s account in &quot;My Children&quot; to start generating AI
                    insights and recommendations.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col flex-1 min-h-0 gap-3">
                  <p className="text-body-sm font-semibold text-slate-500 shrink-0">
                    This Week&apos;s Highlight
                  </p>
                  <ScrollArea className="flex-1 min-h-0 pr-4 -mr-4">
                    <div className="space-y-3 pr-2 pb-2">
                      {linkedChildren.map((child) => {
                        const childData = cache[child.user_id];
                        const accuracy = childData?.details?.quiz_accuracy ?? 0;
                        return (
                          <div
                            key={child.user_id}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between animate-in fade-in duration-300"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="w-8 h-8 border border-white dark:border-slate-800 rounded-full shrink-0">
                                <AvatarImage
                                  src={child.avatar_url ?? undefined}
                                  className="object-cover"
                                />
                                <AvatarFallback className="text-body-xs font-black bg-sky-500 text-white">
                                  {child.first_name?.[0] || "C"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <span className="text-body-sm font-extrabold block truncate">
                                  {child.first_name}
                                </span>
                                <span className="text-body-xs font-bold text-slate-400">
                                  {accuracy > 0 ? `${accuracy}% Accuracy` : "Started Journey"}
                                </span>
                              </div>
                            </div>
                            <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 font-bold px-2 py-0.5 rounded-lg text-body-xs shrink-0 border border-sky-100 dark:border-sky-900/30">
                              Level {getLevel(child.total_experience_points)}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            {linkedChildren.length > 0 && (
              <p className="text-body-xs font-semibold text-slate-600 dark:text-slate-300 bg-sky-50/50 dark:bg-sky-950/20 p-4 rounded-2xl border border-sky-100/60 dark:border-sky-900/20 leading-relaxed shrink-0">
                Your family dashboard aggregates learning habits across all linked children. Use the
                &quot;My Children&quot; tab to monitor specific histories, or head to &quot;Learning
                Progress&quot; for subject mastery details.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
