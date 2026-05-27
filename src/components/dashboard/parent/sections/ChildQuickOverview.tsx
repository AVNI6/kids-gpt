"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, GraduationCap, ChevronRight, LayoutDashboard } from "lucide-react";
import type { LinkedChildProfile, ChildDetailsResult } from "@/types/dashboard.types";
import { useRouter } from "next/navigation";
import { useChildAge } from "@/hooks/useChildAge";

export default function ChildQuickOverview({
  linkedChildren,
  childDetailsMap,
}: {
  linkedChildren: LinkedChildProfile[];
  childDetailsMap?: Record<string, ChildDetailsResult>;
}) {
  const router = useRouter();
  const { calculateAge, displayAge } = useChildAge();

  if (!linkedChildren || linkedChildren.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Your Children
        </h2>
        <Button
          variant="ghost"
          className="text-purple-600 dark:text-purple-400 font-bold hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-full"
          onClick={() => router.push("?tab=children")}
        >
          Manage All <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
        {linkedChildren.map((child) => {
          const details = childDetailsMap?.[child.user_id];
          const completedCount = details?.total_completed ?? 0;
          // Calculate weekly progress targeting 10 activities per week as 100%
          const progressVal = Math.min(100, Math.round((completedCount / 10) * 100));

          // Determine highest subject focus based on subject mastery values
          let subjectFocus = "General Study";
          if (details) {
            const mastery = details.subject_mastery;
            const subjects = [
              { name: "Math", value: mastery.math },
              { name: "Science", value: mastery.science },
              { name: "English", value: mastery.english },
              { name: "Coding", value: mastery.coding },
            ];
            const maxSub = subjects.reduce((prev, current) =>
              prev.value > current.value ? prev : current
            );
            if (maxSub.value > 20) {
              subjectFocus = `${maxSub.name} Focus`;
            }
          }

          return (
            <Card
              key={child.user_id}
              className="min-w-[320px] md:min-w-[360px] max-w-[400px] shrink-0 snap-center rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 shadow-sm hover:shadow-md transition-all backdrop-blur-sm group"
            >
              <CardContent className="p-6 relative overflow-hidden">
                {/* Background accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors" />

                <div className="flex items-start gap-4 mb-6 relative z-10">
                  <Avatar className="w-16 h-16 border-2 border-white dark:border-slate-800 shadow-sm ring-2 ring-slate-100 dark:ring-slate-800">
                    <AvatarImage src={child.avatar_url ?? undefined} className="object-cover" />
                    <AvatarFallback className="text-xl font-black bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                      {child.first_name?.[0] || "C"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                      {child.first_name} {child.last_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        <GraduationCap className="w-3 h-3" />
                        {displayAge(child.date_of_birth, child.standard)}
                      </span>
                      {child.date_of_birth && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-md">
                          Age {calculateAge(child.date_of_birth)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Weekly Progress</span>
                      <span className="text-blue-600 dark:text-blue-400">{progressVal}%</span>
                    </div>
                    <Progress
                      value={progressVal}
                      className="h-2 bg-slate-100 dark:bg-slate-800"
                      indicatorClassName="bg-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm pt-2">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <span>
                        <strong className="text-slate-900 dark:text-white">{completedCount}</strong>{" "}
                        Activities
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-medium">Focus Area</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {subjectFocus}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold"
                      onClick={() => router.push("?tab=children")}
                    >
                      Profile
                    </Button>
                    <Button
                      className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-bold"
                      onClick={() => router.push(`?tab=progress&childId=${child.user_id}`)}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" /> Progress
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
