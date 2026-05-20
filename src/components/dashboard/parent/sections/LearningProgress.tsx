"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BrainCircuit,
  Target,
  Clock,
  Activity,
  Trophy,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import type { LinkedChildProfile, ChildDetailsResult } from "@/types/dashboard.types";

export default function LearningProgress({
  linkedChildren,
  childDetails,
}: {
  linkedChildren: LinkedChildProfile[];
  childDetails: ChildDetailsResult | null;
}) {
  const activeChild = linkedChildren[0];

  if (!activeChild) return null;

  // Derive dynamic stats from childDetails or use realistic defaults
  const accuracy = childDetails?.quiz_accuracy ?? 0;
  const totalCompleted = childDetails?.total_completed ?? 0;
  const currentStreak = childDetails?.current_streak ?? activeChild.current_streak ?? 0;

  const totalMins = childDetails?.learning_time_mins ?? 0;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const learningTimeStr = totalMins > 0 ? `${hrs}h ${mins}m` : "0h";

  const mathProgress = childDetails?.subject_mastery?.math ?? 20;
  const scienceProgress = childDetails?.subject_mastery?.science ?? 20;
  const englishProgress = childDetails?.subject_mastery?.english ?? 20;
  const codingProgress = childDetails?.subject_mastery?.coding ?? 20;

  const subjects = [
    { name: "Science", progress: scienceProgress, color: "bg-emerald-500", icon: "🔬" },
    { name: "Math", progress: mathProgress, color: "bg-blue-500", icon: "📐" },
    { name: "English", progress: englishProgress, color: "bg-purple-500", icon: "📚" },
    { name: "Coding", progress: codingProgress, color: "bg-orange-500", icon: "💻" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Learning Progress
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Analytics and insights for {activeChild.first_name}&apos;s learning journey.
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg">
                <ArrowUpRight className="w-4 h-4 mr-1" /> 12%
              </span>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">
              Quiz Accuracy
            </h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{accuracy}%</p>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-bold bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded-lg">
                <ArrowUpRight className="w-4 h-4 mr-1" /> Live
              </span>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">
              Learning Time
            </h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{learningTimeStr}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">
              Completed Activities
            </h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{totalCompleted}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">
              Current Streak
            </h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              {currentStreak} <span className="text-base font-bold text-slate-400">days</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Mastery */}
        <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 shadow-sm">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-purple-500" /> Subject Mastery
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            {subjects.map((subject) => (
              <div key={subject.name} className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{subject.icon}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {subject.name}
                    </span>
                  </div>
                  <span className="font-black text-slate-900 dark:text-white">
                    {subject.progress}%
                  </span>
                </div>
                <Progress
                  value={subject.progress}
                  className="h-3 bg-slate-100 dark:bg-slate-800"
                  indicatorClassName={subject.color}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Learning Sessions Placeholder */}
        <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 shadow-sm flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-6">
            <Activity className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Weekly Improvement Chart
          </h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
            Interactive chart rendering will appear here, showing {activeChild.first_name}&apos;s
            week-over-week growth across all subjects.
          </p>
        </Card>
      </div>
    </div>
  );
}
