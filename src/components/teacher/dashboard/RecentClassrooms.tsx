"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/shared/ui/card";
import type { Classroom } from "@/types/classroom.types";
import { School, ArrowRight } from "lucide-react";

type Props = {
  classrooms: Classroom[];
};

export default function RecentClassrooms({ classrooms }: Props) {
  const [recentClasses, setRecentClasses] = useState<Classroom[]>([]);

  useEffect(() => {
    let classesToSet: Classroom[] = [];
    try {
      const stored = localStorage.getItem("teacher_recent_classrooms");
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        // Find corresponding classrooms in order
        const mapped = ids
          .map((id) => classrooms.find((c) => c.id === id))
          .filter(Boolean) as Classroom[];

        if (mapped.length > 0) {
          classesToSet = mapped.slice(0, 5);
        } else {
          classesToSet = classrooms.slice(0, 4);
        }
      } else {
        classesToSet = classrooms.slice(0, 4);
      }
    } catch {
      classesToSet = classrooms.slice(0, 4);
    }

    const timer = setTimeout(() => {
      setRecentClasses(classesToSet);
    }, 0);
    return () => clearTimeout(timer);
  }, [classrooms]);

  if (classrooms.length === 0) return null;

  const getClassroomInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getGradientClass = (idx: number) => {
    const gradients = [
      "from-indigo-500 to-sky-500 text-white",
      "from-sky-500 to-emerald-500 text-white",
      "from-violet-500 to-purple-500 text-white",
      "from-amber-500 to-rose-500 text-white",
      "from-teal-500 to-indigo-500 text-white",
    ];
    return gradients[idx % gradients.length];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <School className="w-4 h-4 text-indigo-500" /> Recent Classrooms
        </h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Quick Access Portal
        </p>
      </div>

      <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm relative overflow-hidden">
        <CardContent className="p-6 md:p-7 flex flex-wrap items-center gap-4 sm:gap-6">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold max-w-[120px] shrink-0 leading-tight">
            Jump back into a class:
          </span>

          <div className="flex flex-wrap items-center gap-4">
            {recentClasses.map((cls, idx) => (
              <Link
                key={cls.id}
                href={`/dashboard/teacher/classrooms/${cls.id}`}
                onClick={() => {
                  // Track access
                  try {
                    const stored = localStorage.getItem("teacher_recent_classrooms");
                    let ids: string[] = stored ? JSON.parse(stored) : [];
                    ids = [cls.id, ...ids.filter((id) => id !== cls.id)].slice(0, 8);
                    localStorage.setItem("teacher_recent_classrooms", JSON.stringify(ids));
                  } catch (e) {
                    console.error(e);
                  }
                }}
                title={`Open ${cls.name}`}
                className="group flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 p-1.5 pr-3.5 rounded-full border border-slate-150/60 dark:border-slate-800 shadow-sm hover:scale-105 hover:border-indigo-200 dark:hover:border-slate-700 transition-all cursor-pointer"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs bg-gradient-to-br ${getGradientClass(idx)} shadow-sm shrink-0`}
                >
                  {getClassroomInitials(cls.name)}
                </div>
                <div className="text-left shrink-0">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-none">
                    {cls.name}
                  </p>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 block">
                    {cls.grade || "No Grade"}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0 ml-1.5" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
