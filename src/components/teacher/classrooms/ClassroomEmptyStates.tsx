"use client";

import { Card, CardContent } from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { School, Activity, MailOpen, Plus } from "lucide-react";

type EmptyStateProps = {
  variant: "classrooms" | "activity" | "requests";
  onCreateClick?: () => void;
};

export default function ClassroomEmptyStates({ variant, onCreateClick }: EmptyStateProps) {
  if (variant === "classrooms") {
    return (
      <Card className="rounded-[32px] border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <CardContent className="space-y-4 p-0 max-w-sm mx-auto flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-500 dark:text-indigo-400">
            <School className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-lg font-black text-slate-900 dark:text-white">No Classrooms Yet</h4>
            <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed">
              Create your first classroom to start assigning activities, posting announcements, and
              sharing resources with your students.
            </p>
          </div>
          {onCreateClick && (
            <Button
              onClick={onCreateClick}
              className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 shadow-sm"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Create Classroom
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === "activity") {
    return (
      <div className="text-center py-16 text-slate-450 dark:text-slate-500 font-semibold flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-400 shrink-0">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">No Activity Yet</p>
          <p className="text-xs mt-0.5 max-w-xs leading-relaxed">
            Classroom activity will appear here once students begin participating or submitting
            their work.
          </p>
        </div>
      </div>
    );
  }

  // requests variant
  return (
    <div className="text-center py-12 text-slate-450 dark:text-slate-500 font-semibold flex flex-col items-center gap-3">
      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-450 shrink-0">
        <MailOpen className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-extrabold text-slate-900 dark:text-white">Request Queue Empty</p>
        <p className="text-xs mt-0.5 max-w-xs leading-relaxed">
          All student enrollment requests have been handled. New requests will appear here.
        </p>
      </div>
    </div>
  );
}
