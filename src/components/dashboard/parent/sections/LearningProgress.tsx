"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BrainCircuit, Target, Clock, Trophy, CheckCircle2, Sparkles } from "lucide-react";
import type { LinkedChildProfile, ChildDetailsResult } from "@/types/dashboard.types";
import { getChildAiInsights } from "@/actions/dashboard.actions";

interface Recommendation {
  subject: string;
  text: string;
  priority: string;
}

interface AiInsightsResult {
  child_name: string;
  summary: string;
  recommendations: Recommendation[];
}

export default function LearningProgress({
  linkedChildren,
  childDetails,
}: {
  linkedChildren: LinkedChildProfile[];
  childDetails: ChildDetailsResult | null;
}) {
  const searchParams = useSearchParams();
  const childId = searchParams?.get("childId");
  const activeChild = linkedChildren.find((c) => c.user_id === childId) || linkedChildren[0];

  const [aiInsights, setAiInsights] = useState<AiInsightsResult | null>(null);
  const [loadingAi, setLoadingAi] = useState(true);

  useEffect(() => {
    let active = true;
    if (!activeChild) return;

    const timer = setTimeout(async () => {
      if (!active) return;
      setLoadingAi(true);
      try {
        const data = await getChildAiInsights(activeChild.user_id);
        if (active) {
          setAiInsights(data);
        }
      } catch (err) {
        console.error("Error loading AI insights:", err);
      } finally {
        if (active) {
          setLoadingAi(false);
        }
      }
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [activeChild]);

  if (!activeChild) return null;

  // Derive dynamic stats from childDetails or use realistic defaults
  const accuracy = childDetails?.quiz_accuracy ?? 0;
  const totalCompleted = childDetails?.total_completed ?? 0;
  const currentStreak = childDetails?.current_streak ?? activeChild.current_streak ?? 0;

  const totalMins = childDetails?.learning_time_mins ?? 0;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const learningTimeStr = totalMins > 0 ? `${hrs}h ${mins}m` : "0h";

  // Compute actual dynamic subject progress based on the child's timeline of completed activities
  const timeline = childDetails?.timeline || [];

  let mathCount = 0,
    mathSum = 0;
  let wordCount = 0,
    wordSum = 0;
  let scienceCount = 0,
    scienceSum = 0;
  let logicCount = 0,
    logicSum = 0;
  let memoryCount = 0,
    memorySum = 0;

  timeline.forEach((item) => {
    const desc = (item.description ?? "").toLowerCase();
    const scoreMatch = (item.description ?? "").match(/Score:\s*(\d+)/i);
    const scoreVal = scoreMatch ? parseInt(scoreMatch[1], 10) : 100; // default to 100 if completed without score

    if (
      desc.includes("math") ||
      desc.includes("arithmetic") ||
      desc.includes("number") ||
      desc.includes("fraction")
    ) {
      mathCount++;
      mathSum += scoreVal;
    } else if (
      desc.includes("scramble") ||
      desc.includes("word") ||
      desc.includes("spell") ||
      desc.includes("english") ||
      desc.includes("vocabulary")
    ) {
      wordCount++;
      wordSum += scoreVal;
    } else if (
      desc.includes("science") ||
      desc.includes("lab") ||
      desc.includes("experiment") ||
      desc.includes("volcano") ||
      desc.includes("magnet") ||
      desc.includes("planet") ||
      desc.includes("space")
    ) {
      scienceCount++;
      scienceSum += scoreVal;
    } else if (
      desc.includes("puzzle") ||
      desc.includes("logic") ||
      desc.includes("maze") ||
      desc.includes("coding") ||
      desc.includes("programming")
    ) {
      logicCount++;
      logicSum += scoreVal;
    } else if (
      desc.includes("memory") ||
      desc.includes("match") ||
      desc.includes("pair") ||
      desc.includes("flashcard")
    ) {
      memoryCount++;
      memorySum += scoreVal;
    } else {
      logicCount++;
      logicSum += scoreVal;
    }
  });

  const mathProgress = mathCount > 0 ? Math.round(mathSum / mathCount) : 0;
  const wordProgress = wordCount > 0 ? Math.round(wordSum / wordCount) : 0;
  const scienceProgress = scienceCount > 0 ? Math.round(scienceSum / scienceCount) : 0;
  const logicProgress = logicCount > 0 ? Math.round(logicSum / logicCount) : 0;
  const memoryProgress = memoryCount > 0 ? Math.round(memorySum / memoryCount) : 0;

  const subjects = [
    { name: "Math Challenges 🧮", progress: mathProgress, color: "bg-sky-500", count: mathCount },
    { name: "Word Scrambles 🔠", progress: wordProgress, color: "bg-sky-500", count: wordCount },
    { name: "Science Lab 🧪", progress: scienceProgress, color: "bg-sky-500", count: scienceCount },
    { name: "Logic Puzzles 🧩", progress: logicProgress, color: "bg-sky-500", count: logicCount },
    {
      name: "Memory & Matching 🎴",
      progress: memoryProgress,
      color: "bg-sky-500",
      count: memoryCount,
    },
  ];

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
            <h3 className="text-slate-550 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">
              Quiz Accuracy
            </h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{accuracy}%</p>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-sky-550" />
              </div>
            </div>
            <h3 className="text-slate-550 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">
              Learning Time
            </h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{learningTimeStr}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100/30 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-sky-550" />
              </div>
            </div>
            <h3 className="text-slate-550 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">
              Completed Activities
            </h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{totalCompleted}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100/30 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <h3 className="text-slate-550 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">
              Current Streak
            </h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              {currentStreak} <span className="text-base font-bold text-slate-400">days</span>
            </p>
          </CardContent>
        </Card>
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
            {subjects.map((subject) => (
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
                <Sparkles className="w-5 h-5 text-sky-550" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                AI Learning Insights
              </h3>
            </div>

            {loadingAi ? (
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
