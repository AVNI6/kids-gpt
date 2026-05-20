"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Clock,
  MonitorSmartphone,
  Brain,
  PauseCircle,
  Focus,
  Settings2,
} from "lucide-react";
import type { LinkedChildProfile, ChildSafetyAndUsageResult } from "@/types/dashboard.types";

export default function ChildMonitoring({
  linkedChildren,
  childSafety,
}: {
  linkedChildren: LinkedChildProfile[];
  childSafety: ChildSafetyAndUsageResult | null;
}) {
  const activeChild = linkedChildren[0];

  if (!activeChild) return null;

  const safetyScore = childSafety?.safety_score ?? 100;
  const contentFilterStatus = childSafety?.content_filter_status ?? "Safe Mode (Standard)";
  const isFocusModeActive = childSafety?.focus_mode_active ?? true;

  const screenTimeMins = childSafety?.daily_screen_time_mins ?? 25;
  const screenTimeHrs = Math.floor(screenTimeMins / 60);
  const screenTimeMinsRemaining = screenTimeMins % 60;
  const screenTimeStr =
    screenTimeHrs > 0
      ? `${screenTimeHrs}h ${screenTimeMinsRemaining}m`
      : `${screenTimeMinsRemaining}m`;

  const weeklyInteractions = childSafety?.weekly_ai_interactions ?? 42;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Child Monitoring & Safety
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Keep {activeChild.first_name} safe and focused during their learning sessions.
        </p>
      </div>

      {/* Safety Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[28px] border-emerald-200/60 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-700/80 dark:text-emerald-400/80 uppercase tracking-wider mb-1">
                Safety Score
              </p>
              <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-50">
                {safetyScore} / 100
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-blue-200/60 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-700/80 dark:text-blue-400/80 uppercase tracking-wider mb-1">
                Content Filter
              </p>
              <h3
                className="text-lg font-black text-blue-900 dark:text-blue-50 leading-tight truncate max-w-[200px]"
                title={contentFilterStatus}
              >
                {contentFilterStatus}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-purple-200/60 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
              <Focus className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-purple-700/80 dark:text-purple-400/80 uppercase tracking-wider mb-1">
                Focus Mode
              </p>
              <h3 className="text-2xl font-black text-purple-900 dark:text-purple-50">
                {isFocusModeActive ? "Active" : "Inactive"}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Usage Analytics */}
        <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 shadow-sm">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MonitorSmartphone className="w-6 h-6 text-slate-500" /> Usage Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Daily Screen Time
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Limit: 2 hours
                  </p>
                </div>
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {screenTimeStr}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm">
                  <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Weekly AI Interactions
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Questions asked to ChatGPT Kid
                  </p>
                </div>
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {weeklyInteractions}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                Most Explored Subjects
              </h4>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">
                  Science (45%)
                </span>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full">
                  Math (30%)
                </span>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-full">
                  Space (15%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parent Controls */}
        <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 shadow-sm">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-slate-500" /> Real-time Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start h-14 rounded-2xl px-4 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold group"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-3 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                <Clock className="w-4 h-4" />
              </div>
              Set Screen Time Limit
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-14 rounded-2xl px-4 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold group"
            >
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                <Focus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              Disable Focus Mode
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-14 rounded-2xl px-4 border-orange-200 dark:border-orange-900/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-bold group"
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center mr-3 group-hover:bg-white dark:group-hover:bg-orange-900/30 transition-colors">
                <PauseCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              Pause Learning Session
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
