"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Puzzle, FileQuestion, Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { LinkedChildProfile, ChildDetailsResult } from "@/types/dashboard.types";

// Dynamic preset filters matching ActivityTopicModal
const FILTERS = [
  "All",
  "Math Challenges",
  "Word Scrambles",
  "Science Lab",
  "Logic Puzzles",
  "Memory & Matching",
];

const MOCK_ACTIVITIES = [
  {
    id: "mock-2",
    title: "Basic Fractions Worksheet",
    type: "Math Challenges",
    status: "Completed",
    difficulty: "Easy",
    dueDate: "Yesterday",
    score: "95%",
    icon: <BookOpen className="w-6 h-6 text-sky-500" />,
    color: "bg-sky-100 dark:bg-sky-950/40",
  },
];

export default function ActivitiesGrid({
  linkedChildren,
  childDetails,
}: {
  linkedChildren: LinkedChildProfile[];
  childDetails: ChildDetailsResult | null;
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const searchParams = useSearchParams();
  const childId = searchParams?.get("childId");

  // Parse actual Supabase database timeline logs into completed activities matching ActivityTopicModal presets
  const dbActivities = (childDetails?.timeline ?? []).map((log) => {
    const desc = log.description || "Completed Activity";

    // Extract score if present
    const scoreMatch = desc.match(/Score:\s*(\d+)%/i);
    const score = scoreMatch ? `${scoreMatch[1]}%` : "100%";

    // Determine type and details based on preset keywords
    let type = "Logic Puzzles";
    let icon = <Puzzle className="w-6 h-6 text-orange-500" />;
    let color = "bg-orange-100 dark:bg-sky-950/30";

    const lowerDesc = desc.toLowerCase();
    if (
      lowerDesc.includes("math") ||
      lowerDesc.includes("arithmetic") ||
      lowerDesc.includes("number") ||
      lowerDesc.includes("fraction")
    ) {
      type = "Math Challenges";
      icon = <BookOpen className="w-6 h-6 text-sky-500" />;
      color = "bg-sky-100 dark:bg-sky-955/40";
    } else if (
      lowerDesc.includes("scramble") ||
      lowerDesc.includes("word") ||
      lowerDesc.includes("spell") ||
      lowerDesc.includes("english") ||
      lowerDesc.includes("vocabulary")
    ) {
      type = "Word Scrambles";
      icon = <BookOpen className="w-6 h-6 text-sky-500" />;
      color = "bg-sky-100 dark:bg-sky-955/40";
    } else if (
      lowerDesc.includes("science") ||
      lowerDesc.includes("lab") ||
      lowerDesc.includes("experiment") ||
      lowerDesc.includes("volcano") ||
      lowerDesc.includes("magnet") ||
      lowerDesc.includes("space") ||
      lowerDesc.includes("planet")
    ) {
      type = "Science Lab";
      icon = <Puzzle className="w-6 h-6 text-sky-500" />;
      color = "bg-sky-100 dark:bg-sky-955/40";
    } else if (
      lowerDesc.includes("puzzle") ||
      lowerDesc.includes("logic") ||
      lowerDesc.includes("maze") ||
      lowerDesc.includes("coding") ||
      lowerDesc.includes("programming")
    ) {
      type = "Logic Puzzles";
      icon = <Puzzle className="w-6 h-6 text-orange-500" />;
      color = "bg-orange-100 dark:bg-sky-955/30";
    } else if (
      lowerDesc.includes("memory") ||
      lowerDesc.includes("match") ||
      lowerDesc.includes("pair") ||
      lowerDesc.includes("flashcard") ||
      lowerDesc.includes("quiz")
    ) {
      type = "Memory & Matching";
      icon = <FileQuestion className="w-6 h-6 text-sky-500" />;
      color = "bg-sky-100 dark:bg-sky-955/40";
    }

    // Clean up title
    let title = desc.replace(/^Completed\s+/i, "");
    title = title.replace(/\s*\(Score:\s*\d+%\)/i, "");

    // Format date
    const dateStr = log.created_at
      ? new Date(log.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : "Recently";

    return {
      id: log.id,
      title,
      type,
      status: "Completed",
      difficulty: "Medium",
      dueDate: dateStr,
      score,
      icon,
      color,
    };
  });

  // If there are no completed activities in database, keep mock-2 for display
  const completedMockActivities =
    dbActivities.length === 0 ? MOCK_ACTIVITIES.filter((act) => act.status === "Completed") : [];

  const allActivities = [...dbActivities, ...completedMockActivities];

  const filteredActivities = allActivities.filter((activity) => {
    if (activeFilter === "All") return true;
    if (activity.type === activeFilter) return true;
    return false;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "default" : "outline"}
            className={`rounded-full font-bold px-5 h-10 text-xs transition-colors cursor-pointer ${
              activeFilter === filter
                ? "bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 shadow-sm border-transparent"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredActivities.length === 0 ? (
          <Card className="col-span-full rounded-[28px] border-slate-200 dark:border-slate-800 bg-white dark:bg-black/30 p-12 text-center">
            <CardContent className="space-y-3">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                No completed activities match this filter.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredActivities.map((activity) => (
            <Card
              key={activity.id}
              className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-all group"
            >
              <CardContent className="p-6 flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl ${activity.color} flex items-center justify-center shadow-sm border border-sky-100/10`}
                    >
                      {activity.icon}
                    </div>
                    <Badge
                      variant="secondary"
                      className="font-bold uppercase tracking-wider text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300 border border-emerald-100/50"
                    >
                      {activity.status}
                    </Badge>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 line-clamp-1">
                      {activity.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-455" /> {activity.dueDate}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <span>{activity.difficulty}</span>
                    </div>
                  </div>
                </div>

                {activity.status === "Completed" && activity.score && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-bold text-slate-505 dark:text-slate-450">
                      Score Achieved
                    </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {activity.score}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
