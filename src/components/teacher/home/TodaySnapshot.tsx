"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, MessageSquare } from "lucide-react";
import { PiStudentBold } from "react-icons/pi";
import { MdOutlineGrade } from "react-icons/md";
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
      icon: PiStudentBold,
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
      icon: MdOutlineGrade,
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
    <div className="h-full flex flex-col">
      <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm relative overflow-hidden flex-1 flex flex-col">
        <CardContent className="p-5 md:p-6 flex flex-col gap-4 flex-1 justify-between">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Today&apos;s Snapshot
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
              Educational velocity and submissions status over the past 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 items-center">
            {items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3.5 p-4 rounded-[22px] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-900/60 transition-all h-full"
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
    </div>
  );
}
