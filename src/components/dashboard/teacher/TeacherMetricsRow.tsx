"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, ClipboardList, AlertCircle, FileUp, Megaphone } from "lucide-react";

type Metrics = {
  activeClassrooms: number;
  enrolledStudents: number;
  publishedAssignments: number;
  pendingGrading: number;
  resourcesUploaded: number;
  announcementsPosted: number;
};

type Props = {
  metrics: Metrics;
};

export default function TeacherMetricsRow({ metrics }: Props) {
  const items = [
    {
      title: "Active Classes",
      value: metrics.activeClassrooms,
      icon: BookOpen,
      iconColor: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
      glowColor: "bg-indigo-500/5",
    },
    {
      title: "Enrolled Students",
      value: metrics.enrolledStudents,
      icon: Users,
      iconColor: "text-sky-500",
      bgColor: "bg-sky-50 dark:bg-sky-950/40",
      glowColor: "bg-sky-500/5",
    },
    {
      title: "Published Assignments",
      value: metrics.publishedAssignments,
      icon: ClipboardList,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
      glowColor: "bg-emerald-500/5",
    },
    {
      title: "Pending Grading",
      value: metrics.pendingGrading,
      icon: AlertCircle,
      iconColor: metrics.pendingGrading > 0 ? "text-rose-500" : "text-slate-400",
      bgColor:
        metrics.pendingGrading > 0
          ? "bg-rose-50 dark:bg-rose-950/40"
          : "bg-slate-50 dark:bg-slate-900/40",
      glowColor: metrics.pendingGrading > 0 ? "bg-rose-500/5" : "bg-slate-500/5",
      badge: metrics.pendingGrading > 0 ? "Action Required" : null,
    },
    {
      title: "Resources Uploaded",
      value: metrics.resourcesUploaded,
      icon: FileUp,
      iconColor: "text-violet-500",
      bgColor: "bg-violet-50 dark:bg-violet-950/40",
      glowColor: "bg-violet-500/5",
    },
    {
      title: "Announcements",
      value: metrics.announcementsPosted,
      icon: Megaphone,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
      glowColor: "bg-amber-500/5",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card
            key={idx}
            className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div
              className={`absolute top-0 right-0 w-24 h-24 ${item.glowColor} rounded-full blur-xl -translate-y-1/2 translate-x-1/2`}
            />
            <CardContent className="p-6 relative z-10 flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl ${item.bgColor} flex items-center justify-center shrink-0`}
              >
                <Icon className={`w-6 h-6 ${item.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-0.5 truncate">
                  {item.title}
                </h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                    {item.value}
                  </p>
                  {item.badge && (
                    <span className="text-[8px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-350 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
