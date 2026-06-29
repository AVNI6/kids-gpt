"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap, UserCheck, UserX, FileEdit, VolumeX, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { handleEnrollmentRequest } from "@/lib/services/kid/classroom.actions";
import type { PendingEnrollmentRequest } from "@/types/classroom.types";

type Props = {
  pendingRequests: PendingEnrollmentRequest[];
  pendingGrading: number;
  emptyAnnouncementClassroomsCount: number;
};

export default function NeedsAttention({
  pendingRequests,
  pendingGrading,
  emptyAnnouncementClassroomsCount,
}: Props) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleEnrollmentAction = async (
    requestId: string,
    action: "APPROVE" | "REJECT",
    studentName: string
  ) => {
    try {
      setProcessingId(requestId);
      const result = await handleEnrollmentRequest(requestId, action);
      if (result.success) {
        toast.success(
          action === "APPROVE"
            ? `Approved ${studentName}'s request!`
            : `Declined ${studentName}'s request.`
        );
      } else {
        toast.error(result.error || "Action failed.");
      }
    } catch {
      toast.error("Failed to process request.");
    } finally {
      setProcessingId(null);
    }
  };

  const hasAnyNeeds =
    pendingRequests.length > 0 || pendingGrading > 0 || emptyAnnouncementClassroomsCount > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Needs Attention
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
          Actions required to maintain student engagement and class operations.
        </p>
      </div>

      {!hasAnyNeeds ? (
        <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm relative overflow-hidden">
          <CardContent className="p-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-emerald-500 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                All caught up!
              </p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                No pending enrollment requests or assignments awaiting grading.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section 1: Pending Enrollment Request Inbox Queue */}
          <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm overflow-hidden lg:col-span-2 flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                  Student Enrollment Request Queue
                </h4>
              </div>
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                {pendingRequests.length} Pending
              </Badge>
            </div>

            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800/40 max-h-[300px] overflow-y-auto flex-1">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 font-semibold">
                  No pending student requests.
                </div>
              ) : (
                pendingRequests.map((req) => {
                  const studentName = req.first_name
                    ? `${req.first_name} ${req.last_name || ""}`.trim()
                    : "A student";

                  return (
                    <div
                      key={req.member_link_id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                          <AvatarImage src={req.avatar_url ?? undefined} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-indigo-600 text-white font-black text-xs">
                            {req.first_name?.[0] ?? "S"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                            {studentName}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                            Wants to join{" "}
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              &ldquo;{req.classroom_name}&rdquo;
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                        <Button
                          size="sm"
                          disabled={processingId !== null}
                          onClick={() =>
                            handleEnrollmentAction(req.member_link_id, "APPROVE", studentName)
                          }
                          className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-3 text-[10px] shadow-xs"
                        >
                          <UserCheck className="mr-1 h-3 w-3" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId !== null}
                          onClick={() =>
                            handleEnrollmentAction(req.member_link_id, "REJECT", studentName)
                          }
                          className="rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 font-bold h-8 px-3 text-[10px]"
                        >
                          <UserX className="mr-1 h-3 w-3" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Section 2: Alerts Cards Panel */}
          <div className="flex flex-col gap-6">
            {pendingGrading > 0 && (
              <Card className="rounded-[32px] border-rose-200/60 dark:border-rose-900/40 bg-white dark:bg-black/30 shadow-sm relative overflow-hidden group flex-1">
                <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                <CardContent className="p-6 relative z-10 flex items-center gap-4 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0 text-rose-500">
                    <FileEdit className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider block mb-0.5">
                      Grading Inbox
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      {pendingGrading} submission{pendingGrading === 1 ? "" : "s"} waiting for score
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {emptyAnnouncementClassroomsCount > 0 && (
              <Card className="rounded-[32px] border-amber-255/60 dark:border-amber-900/40 bg-white dark:bg-black/30 shadow-sm relative overflow-hidden group flex-1">
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                <CardContent className="p-6 relative z-10 flex items-center gap-4 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center shrink-0 text-amber-500">
                    <VolumeX className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-amber-550 dark:text-amber-400 uppercase tracking-wider block mb-0.5">
                      Silent Classrooms
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      {emptyAnnouncementClassroomsCount} class
                      {emptyAnnouncementClassroomsCount === 1 ? "" : "es"} have no announcements
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
