"use client";

import { useState } from "react";
import { CheckCircle, Clock, AlertCircle, ExternalLink, HelpCircle, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  gradeAssignment,
  getTeacherAssignmentOverview,
} from "@/lib/services/kid/classroom.actions";
import type {
  ClassroomAssignment,
  SubmissionDetails,
  TeacherAssignmentOverview,
} from "@/types/classroom.types";

type Props = {
  selectedAssignment: ClassroomAssignment | null;
  gradingOpen: boolean;
  setGradingOpen: (open: boolean) => void;
  assignmentOverview: TeacherAssignmentOverview | null;
  setAssignmentOverview: React.Dispatch<React.SetStateAction<TeacherAssignmentOverview | null>>;
  getInitials: (first?: string | null, last?: string | null) => string;
};

export default function ClassroomGradingDialog({
  selectedAssignment,
  gradingOpen,
  setGradingOpen,
  assignmentOverview,
  setAssignmentOverview,
  getInitials,
}: Props) {
  const [activeSubmission, setActiveSubmission] = useState<SubmissionDetails | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(100);
  const [gradingFeedback, setGradingFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission || !selectedAssignment) return;

    try {
      setIsLoading(true);
      const result = await gradeAssignment(activeSubmission.id, gradingScore, gradingFeedback);
      if (result.success) {
        toast.success("Submission graded successfully!");

        // Refresh overview
        const fresh = await getTeacherAssignmentOverview(selectedAssignment.id);
        if (fresh.success && fresh.data) {
          setAssignmentOverview(fresh.data);
        }

        setActiveSubmission(null);
        setGradingScore(100);
        setGradingFeedback("");
      } else {
        toast.error(result.error || "Failed to grade submission.");
      }
    } catch {
      toast.error("Failed to grade submission.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={gradingOpen} onOpenChange={setGradingOpen}>
      <DialogContent className="max-w-3xl rounded-[32px] p-0 overflow-hidden dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh]">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-800 px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="text-xl font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-indigo-600" />
            Grade Submissions
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {selectedAssignment?.title} (Max Score: {selectedAssignment?.total_points} Points)
          </DialogDescription>
        </DialogHeader>

        {/* Submissions List & Grading Form */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          {/* Left Side: Submission List */}
          <div className="flex-1 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Class Submissions
            </span>

            {!assignmentOverview || assignmentOverview.submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20">
                <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-xs text-slate-950 dark:text-white font-bold">
                  No submissions collected yet
                </p>
                <p className="text-[10px] text-slate-400 font-semibold max-w-xs mt-0.5">
                  Students who join this classroom will see published assignments and can submit
                  work.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {assignmentOverview.submissions.map((sub: SubmissionDetails) => {
                  const name = `${sub.first_name || ""} ${sub.last_name || ""}`.trim() || "Student";
                  const isAutoGraded = !!selectedAssignment?.activity_type;
                  const isGraded = isAutoGraded
                    ? sub.score !== null || sub.submitted_at !== null
                    : sub.score !== null;
                  const active = activeSubmission?.id === sub.id;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => {
                        setActiveSubmission(sub);
                        setGradingScore(sub.score ?? selectedAssignment?.total_points ?? 100);
                        setGradingFeedback(sub.feedback ?? "");
                      }}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                        active
                          ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 ring-2 ring-indigo-500/10"
                          : isGraded
                            ? "bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 border dark:border-slate-800 shadow-xs shrink-0">
                          <AvatarImage src={sub.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs bg-indigo-500 text-white font-black">
                            {getInitials(sub.first_name, sub.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-950 dark:text-white leading-tight truncate">
                            {name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            {new Date(sub.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isGraded ? (
                          <Badge className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border-none font-bold text-[10px] px-2 py-0.5">
                            {sub.score !== null
                              ? `${Math.round((sub.score / (selectedAssignment?.total_points || 100)) * 100)}%`
                              : isAutoGraded
                                ? "Auto-Graded"
                                : "Graded"}
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border-none font-bold text-[10px] px-2 py-0.5 flex items-center gap-1">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Side: Grading Action Panel */}
          <div className="w-full md:w-[320px] shrink-0 border-t md:border-t-0 md:border-l border-slate-150/80 dark:border-slate-800 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between">
            {activeSubmission ? (
              selectedAssignment?.activity_type ? (
                // Auto-graded assignment: show read-only summary, no manual grading
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="bg-emerald-50/80 dark:bg-emerald-950/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-450 block mb-1">
                        Auto-Graded Activity
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Type:{" "}
                        <span className="font-black text-emerald-700 dark:text-emerald-450 capitalize">
                          {activeSubmission.submission_type}
                        </span>
                      </p>
                      {activeSubmission.submitted_at ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2">
                          Completed: {new Date(activeSubmission.submitted_at).toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 dark:text-amber-450 font-semibold mt-2">
                          Activity started but not yet completed.
                        </p>
                      )}
                      {activeSubmission.score !== null && activeSubmission.score !== undefined ? (
                        <p className="text-sm font-black text-emerald-800 dark:text-emerald-450 mt-3">
                          Score:{" "}
                          <span className="text-xl">
                            {Math.round(
                              (activeSubmission.score / (selectedAssignment?.total_points || 100)) *
                                100
                            )}
                            %
                          </span>
                        </p>
                      ) : null}
                    </div>
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                      <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                        Activity Type
                      </p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">
                        {selectedAssignment.activity_type?.replace(/-/g, " ")}
                      </p>
                      {selectedAssignment.topic && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 font-semibold">
                          Topic: {selectedAssignment.topic}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-semibold italic">
                    This assignment is auto-graded by the system.
                  </p>
                </div>
              ) : (
                // Manual grading form
                <form
                  onSubmit={handleGradeSubmission}
                  className="space-y-4 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="bg-slate-50/80 dark:bg-slate-950/10 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                        Submission Info
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Type:{" "}
                        <span className="font-black text-indigo-700 dark:text-indigo-400">
                          {activeSubmission.submission_type}
                        </span>
                      </p>
                      {activeSubmission.submission_text && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-800 max-h-[120px] overflow-y-auto font-medium leading-relaxed italic">
                          &ldquo;{activeSubmission.submission_text}&rdquo;
                        </p>
                      )}
                      {activeSubmission.submission_url && (
                        <a
                          href={activeSubmission.submission_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-700 dark:text-indigo-405 mt-3.5 hover:underline"
                        >
                          <span>View Submitted Link</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="gradeScore"
                        className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                      >
                        Award Score*
                      </Label>
                      <div className="relative">
                        <Input
                          id="gradeScore"
                          type="number"
                          value={gradingScore}
                          onChange={(e) => setGradingScore(Number(e.target.value))}
                          required
                          min={0}
                          max={selectedAssignment?.total_points}
                          className="rounded-xl h-11 pr-12 font-black text-sm"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          / {selectedAssignment?.total_points}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="gradeFeedback"
                        className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                      >
                        Grade Feedback
                      </Label>
                      <textarea
                        id="gradeFeedback"
                        value={gradingFeedback}
                        onChange={(e) => setGradingFeedback(e.target.value)}
                        placeholder="Great job! Keep it up..."
                        className="rounded-xl w-full border border-slate-200 dark:border-slate-800 p-3 bg-background text-xs font-semibold focus:border-indigo-500 focus:ring-0 resize-none h-24"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 shadow-sm mt-4 cursor-pointer"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Submit Grade
                  </Button>
                </form>
              )
            ) : (
              // No active submission selected
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl">
                <HelpCircle className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                  Select student submission
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                  {selectedAssignment?.activity_type
                    ? "Click any submission on the left to view results."
                    : "Click any submission on the left to grade and award XP."}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-4 flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => setGradingOpen(false)} className="rounded-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
