"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Award } from "lucide-react";
import type { DashboardUserProfile } from "@/types/kid";

type Props = {
  profile: DashboardUserProfile;
  totalClassrooms: number;
  totalStudents: number;
  pendingRequests: number;
  pendingReviews: number;
  onCreateClick: () => void;
  onInboxClick: () => void;
};

export default function TeacherHeroBanner({
  profile,
  totalClassrooms,
  totalStudents,
  pendingRequests,
  pendingReviews,
  // onCreateClick,
  // onInboxClick,
}: Props) {
  const school = profile.standard || "School / Organization not set";

  // Dynamic status message
  let summaryMessage =
    "Your digital classrooms are ready for teaching! Manage student enrollment and monitor homework activity.";
  if (pendingRequests > 0 || pendingReviews > 0) {
    const tasks = [];
    if (pendingRequests > 0) tasks.push(`${pendingRequests} join request(s)`);
    if (pendingReviews > 0) tasks.push(`${pendingReviews} homework submission(s) to grade`);
    summaryMessage = `You have pending tasks today: ${tasks.join(" and ")}. Select them below to take action.`;
  }

  return (
    <Card className="rounded-[32px] overflow-hidden border-0 relative shadow-md bg-white dark:bg-black/30 transition-colors duration-300">
      {/* Premium Gradient Overlays matching Sky-Blue / Indigo style */}
      <div className="absolute inset-0 bg-gradient-to-r from-sky-100/50 via-white to-sky-50/30 dark:from-black/80 dark:via-black/90 dark:to-black pointer-events-none" />

      {/* Decorative Spheres */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <CardContent className="p-8 md:p-10 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Welcome greeting left */}
        <div className="flex-1 space-y-5 text-center lg:text-left">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center lg:justify-start gap-3">
              Welcome back, {profile.first_name || "Educator"}{" "}
              <span className="inline-block animate-wave">👋</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm md:text-base">
              {school}
            </p>
            <p className="text-slate-650 dark:text-slate-300 text-xs md:text-sm font-semibold max-w-2xl leading-relaxed">
              {summaryMessage}
            </p>
          </div>

          {/* <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
            <Button
              onClick={onCreateClick}
              className="rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-md hover:shadow-lg transition-all h-11 px-6 font-bold cursor-pointer"
            >
              <School className="mr-2 h-4 w-4 shrink-0" />
              <span>Create Classroom</span>
            </Button>

            <Button
              onClick={onInboxClick}
              variant="outline"
              className="rounded-full border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-black/30 hover:bg-slate-50 dark:hover:bg-black text-slate-700 dark:text-slate-300 h-11 px-6 font-bold backdrop-blur-sm cursor-pointer"
            >
              <Inbox className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Review Requests</span>
            </Button>
          </div> */}
        </div>

        {/* Classroom Summary Card right */}
        <div className="shrink-0 flex flex-col items-stretch gap-4 bg-slate-50/50 dark:bg-black/30 border border-slate-100 dark:border-slate-850 p-6 rounded-[28px] shadow-sm backdrop-blur-md min-w-[280px]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-900/30 self-start">
            <Award className="w-3.5 h-3.5" /> Classroom Summary
          </span>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Active Classes
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {totalClassrooms}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Total Students
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {totalStudents}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Pending Requests
              </span>
              <span
                className={`text-xl font-black ${pendingRequests > 0 ? "text-amber-500" : "text-slate-900 dark:text-white"}`}
              >
                {pendingRequests}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Pending Reviews
              </span>
              <span
                className={`text-xl font-black ${pendingReviews > 0 ? "text-rose-500 animate-pulse" : "text-slate-900 dark:text-white"}`}
              >
                {pendingReviews}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
