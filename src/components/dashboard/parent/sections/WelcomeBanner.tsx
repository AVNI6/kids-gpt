"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, ArrowRight, Sparkles } from "lucide-react";
import type {
  DashboardUserProfile,
  LinkedChildProfile,
  ChildDetailsResult,
} from "@/types/dashboard.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function WelcomeBanner({
  profile,
  linkedChildren,
  activeChildDetails,
}: {
  profile: DashboardUserProfile;
  linkedChildren: LinkedChildProfile[];
  activeChildDetails: ChildDetailsResult | null;
}) {
  const activeChild = linkedChildren[0];
  const childName = activeChild?.first_name || "Your child";

  const totalCompleted = activeChildDetails?.total_completed ?? 0;
  const quizAccuracy = activeChildDetails?.quiz_accuracy ?? 0;
  const currentStreak = activeChildDetails?.current_streak ?? activeChild?.current_streak ?? 0;

  // Determine completed today
  const completedToday =
    activeChildDetails?.timeline?.filter((item) => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at).toDateString();
      const today = new Date().toDateString();
      return itemDate === today;
    }).length ?? 0;

  let subtitleMessage = `${childName} is ready to start their learning adventure today!`;
  if (totalCompleted > 0) {
    if (completedToday > 0) {
      subtitleMessage = `${childName} completed ${completedToday} learning ${completedToday === 1 ? "activity" : "activities"} today and maintains a ${quizAccuracy}% accuracy score.`;
    } else {
      subtitleMessage = `${childName} has completed ${totalCompleted} learning ${totalCompleted === 1 ? "activity" : "activities"} in total with a fantastic ${quizAccuracy}% accuracy score!`;
    }
  }

  return (
    <Card className="rounded-[32px] overflow-hidden border-0 relative shadow-md">
      {/* Soft Gradients Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-emerald-50 dark:from-blue-950/40 dark:via-purple-900/30 dark:to-emerald-950/40" />

      {/* Decorative Blobs */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-400/20 dark:bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 dark:bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      <CardContent className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, {profile.first_name}{" "}
              <span className="inline-block animate-wave">👋</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium max-w-2xl">
              {subtitleMessage}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
            <Button className="rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all h-12 px-6 text-base font-bold">
              View Full Report <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-slate-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 h-12 px-6 text-base font-bold backdrop-blur-sm"
            >
              <Sparkles className="mr-2 w-5 h-5 text-purple-500" /> Quick AI Summary
            </Button>
          </div>
        </div>

        {activeChild && (
          <div className="shrink-0 relative group">
            {/* Streak Badge positioned overlapping the avatar */}
            <div className="absolute -top-4 -right-4 z-20 bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-lg shadow-orange-500/20 border border-orange-100 dark:border-orange-900">
              <div className="bg-orange-100 dark:bg-orange-950/50 rounded-full px-3 py-1.5 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                <span className="font-black text-orange-600 dark:text-orange-400 text-sm">
                  {currentStreak}
                </span>
              </div>
            </div>

            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white dark:border-slate-800 shadow-xl ring-4 ring-purple-500/10 transition-transform duration-500 group-hover:scale-105">
              <AvatarImage src={activeChild.avatar_url ?? undefined} className="object-cover" />
              <AvatarFallback className="text-4xl font-black bg-gradient-to-br from-purple-400 to-indigo-500 text-white">
                {childName[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
