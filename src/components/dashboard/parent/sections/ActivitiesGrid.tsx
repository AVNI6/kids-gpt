"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Puzzle, FileQuestion, Calendar, PlayCircle, RotateCcw, Eye } from "lucide-react";
import type { LinkedChildProfile, ChildDetailsResult } from "@/types/dashboard.types";

const FILTERS = ["All", "Pending", "Completed", "Quiz", "Puzzle", "Worksheet"];

const MOCK_ACTIVITIES = [
  {
    id: "mock-1",
    title: "Solar System Explorer",
    type: "Puzzle",
    status: "Pending",
    difficulty: "Medium",
    dueDate: "Today",
    score: null,
    icon: <Puzzle className="w-6 h-6 text-orange-500" />,
    color: "bg-orange-100 dark:bg-orange-900/50",
  },
  {
    id: "mock-2",
    title: "Basic Fractions",
    type: "Worksheet",
    status: "Completed",
    difficulty: "Easy",
    dueDate: "Yesterday",
    score: "95%",
    icon: <BookOpen className="w-6 h-6 text-blue-500" />,
    color: "bg-blue-100 dark:bg-blue-900/50",
  },
  {
    id: "mock-3",
    title: "Science Vocab",
    type: "Quiz",
    status: "Pending",
    difficulty: "Hard",
    dueDate: "Tomorrow",
    score: null,
    icon: <FileQuestion className="w-6 h-6 text-purple-500" />,
    color: "bg-purple-100 dark:bg-purple-900/50",
  },
];

export default function ActivitiesGrid({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  linkedChildren,
  childDetails,
}: {
  linkedChildren: LinkedChildProfile[];
  childDetails: ChildDetailsResult | null;
}) {
  const [activeFilter, setActiveFilter] = useState("All");

  // Parse actual Supabase database timeline logs into dynamic completed activities
  const dbActivities = (childDetails?.timeline ?? []).map((log) => {
    const desc = log.description || "Completed Activity";

    // Extract score if present
    const scoreMatch = desc.match(/Score:\s*(\d+)%/i);
    const score = scoreMatch ? `${scoreMatch[1]}%` : "100%";

    // Determine type and details based on description content
    let type = "Puzzle";
    let icon = <Puzzle className="w-6 h-6 text-orange-500" />;
    let color = "bg-orange-100 dark:bg-orange-900/50";

    if (desc.toLowerCase().includes("quiz")) {
      type = "Quiz";
      icon = <FileQuestion className="w-6 h-6 text-purple-500" />;
      color = "bg-purple-100 dark:bg-purple-900/50";
    } else if (
      desc.toLowerCase().includes("worksheet") ||
      desc.toLowerCase().includes("math") ||
      desc.toLowerCase().includes("english")
    ) {
      type = "Worksheet";
      icon = <BookOpen className="w-6 h-6 text-blue-500" />;
      color = "bg-blue-100 dark:bg-blue-900/50";
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

  // Filter pending mock activities
  const pendingMockActivities = MOCK_ACTIVITIES.filter((act) => act.status === "Pending");

  // If there are no completed activities in database, keep mock-2 for display
  const completedMockActivities =
    dbActivities.length === 0 ? MOCK_ACTIVITIES.filter((act) => act.status === "Completed") : [];

  const allActivities = [...pendingMockActivities, ...dbActivities, ...completedMockActivities];

  const filteredActivities = allActivities.filter((activity) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Pending" && activity.status === "Pending") return true;
    if (activeFilter === "Completed" && activity.status === "Completed") return true;
    if (activity.type === activeFilter) return true;
    return false;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Activities
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Monitor and assign learning tasks.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "default" : "outline"}
            className={`rounded-full font-bold px-5 ${
              activeFilter === filter
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredActivities.map((activity) => (
          <Card
            key={activity.id}
            className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-md transition-all group"
          >
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl ${activity.color} flex items-center justify-center shadow-sm`}
                >
                  {activity.icon}
                </div>
                <Badge
                  variant="secondary"
                  className={`font-bold uppercase tracking-wider text-[10px] ${
                    activity.status === "Completed"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  }`}
                >
                  {activity.status}
                </Badge>
              </div>

              <div className="mb-6 flex-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 line-clamp-1">
                  {activity.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1" /> {activity.dueDate}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span>{activity.difficulty}</span>
                </div>
              </div>

              {activity.status === "Completed" && activity.score && (
                <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    Score
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {activity.score}
                  </span>
                </div>
              )}

              <div className="mt-auto">
                {activity.status === "Pending" ? (
                  <Button className="w-full rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:bg-slate-800 dark:hover:bg-slate-200">
                    <PlayCircle className="w-4 h-4 mr-2" /> Assign / Start
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl font-bold border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Eye className="w-4 h-4 mr-2" /> Review
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl font-bold border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" /> Retry
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
