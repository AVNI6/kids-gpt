"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Progress } from "@/components/shared/ui/progress";
import { BrainCircuit, Target, Clock, CheckCircle2, Sparkles } from "lucide-react";
import { useParentDashboard } from "@/hooks/parent/useParentDashboard";
import { useParentAnalytics } from "@/hooks/parent/useParentAnalytics";
import StreakDisplay from "@/components/shared/ui/StreakDisplay";

interface Recommendation {
  subject: string;
  text: string;
  priority: string;
}

export default function LearningProgress() {
  const { activeChild, details, aiInsights, isLoadingChildData } = useParentDashboard();

  // Retrieve standardized subject analytics using parent analytics hook
  const { subjectPerformance, quizAccuracy } = useParentAnalytics(details?.timeline ?? []);

  if (!activeChild) return null;

  // Derive dynamic stats from details
  const totalCompleted = details?.total_completed ?? 0;
  const currentStreak = details?.current_streak ?? activeChild.current_streak;

  const totalMins = details?.learning_time_mins ?? 0;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const learningTimeStr = totalMins > 0 ? `${hrs}h ${mins}m` : "0h";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/30 flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">
              Overall Progress
            </h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              {isLoadingChildData ? "..." : `${quizAccuracy}%`}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-sky-500" />
              </div>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">
              Learning Time
            </h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              {isLoadingChildData ? "..." : learningTimeStr}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100/30 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-sky-500" />
              </div>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">
              Completed Activities
            </h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              {isLoadingChildData ? "..." : totalCompleted}
            </p>
          </CardContent>
        </Card>

        <StreakDisplay streak={currentStreak} variant="parent-card" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject Mastery */}
        <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-sky-500" /> Subject Mastery
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            {subjectPerformance.map((subject) => (
              <div key={subject.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-350">
                      {subject.name}
                    </span>
                  </div>
                  <span className="text-xs font-black text-sky-600 dark:text-sky-400">
                    {subject.progress}% Mastery ({subject.count} played)
                  </span>
                </div>
                <Progress
                  value={subject.progress}
                  className="h-3 bg-slate-105 dark:bg-black/60 rounded-full"
                  indicatorClassName={subject.color}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm flex flex-col p-8 justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-sky-50 dark:bg-sky-950/40 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-sky-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                AI Learning Insights
              </h3>
            </div>

            {isLoadingChildData && !aiInsights ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg w-3/4" />
                <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              </div>
            ) : aiInsights ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-650 dark:text-slate-300 bg-sky-50/50 dark:bg-black/20 p-4 rounded-2xl border border-sky-100/60 dark:border-sky-900/20 leading-relaxed">
                  {aiInsights.summary}
                </p>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Recommendations
                  </h4>
                  {aiInsights.recommendations.map((rec: Recommendation, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-slate-800 flex gap-3 items-start"
                    >
                      <span className="text-lg shrink-0 mt-0.5">
                        {rec.subject === "Math"
                          ? "📐"
                          : rec.subject === "Science"
                            ? "🔬"
                            : rec.subject === "Coding"
                              ? "💻"
                              : rec.subject === "English"
                                ? "📚"
                                : "💡"}
                      </span>
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white block mb-0.5">
                          {rec.subject}
                        </span>
                        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                          {rec.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No recommendations available.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
