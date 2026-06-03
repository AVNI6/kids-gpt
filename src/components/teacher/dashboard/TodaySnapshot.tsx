"use client";

import { Card, CardContent } from "@/components/shared/ui/card";
import { Sparkles, CheckCircle2, ClipboardCheck, MessageSquare } from "lucide-react";

type Snapshot = {
  activeStudentsToday: number;
  assignmentsSubmittedToday: number;
  assignmentsGradedToday: number;
  announcementsPostedToday: number;
};

type Props = {
  snapshot: Snapshot;
};

export default function TodaySnapshot({ snapshot }: Props) {
  const items = [
    {
      label: "Active Students Today",
      value: snapshot.activeStudentsToday,
      icon: Sparkles,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Assignments Submitted Today",
      value: snapshot.assignmentsSubmittedToday,
      icon: ClipboardCheck,
      color: "text-sky-500",
      bgColor: "bg-sky-500/10",
    },
    {
      label: "Assignments Graded Today",
      value: snapshot.assignmentsGradedToday,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Announcements Posted Today",
      value: snapshot.announcementsPostedToday,
      icon: MessageSquare,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
  ];

  return (
    <Card className="rounded-[32px] border-slate-250/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm relative overflow-hidden">
      <CardContent className="p-6 md:p-8 space-y-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Today&apos;s Snapshot
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Educational velocity and submissions status over the past 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3.5 p-4 rounded-[22px] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-900/60 transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    {item.label}
                  </span>
                  <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                    {item.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
