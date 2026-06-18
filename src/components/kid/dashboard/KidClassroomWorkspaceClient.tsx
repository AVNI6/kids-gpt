"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  FolderOpen,
  Megaphone,
  FileText,
  LinkIcon,
  Video,
  Calendar,
  Clock,
  ExternalLink,
  Send,
  Award,
  School,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { submitAssignment } from "@/lib/services/kid/classroom.actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import type {
  StudentAssignment,
  ClassroomResource,
  ClassroomAnnouncement,
  Classroom,
} from "@/types/classroom.types";

type Props = {
  classroomId: string;
  classroom: Classroom & {
    teacher: {
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
    } | null;
  };
  initialAssignments: StudentAssignment[];
  initialResources: ClassroomResource[];
  initialAnnouncements: ClassroomAnnouncement[];
};

export default function KidClassroomWorkspaceClient({
  classroom,
  initialAssignments,
  initialResources,
  initialAnnouncements,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "assignments" | "resources" | "announcements"
  >("overview");
  const [isLoading, setIsLoading] = useState(false);

  // States
  const [assignments, setAssignments] = useState(initialAssignments);
  const [resources] = useState(initialResources);
  const [announcements] = useState(initialAnnouncements);

  // Submission dialog states
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);

  // Form states
  const [subType, setSubType] = useState<"TEXT" | "PDF" | "IMAGE" | "LINK">("TEXT");
  const [subText, setSubText] = useState("");
  const [subUrl, setSubUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    try {
      setIsLoading(true);
      const result = await submitAssignment(
        selectedAssignment.id,
        subType,
        subText || null,
        subUrl || null
      );

      if (result.success && result.submission) {
        toast.success("Assignment submitted successfully!");

        // Update local list state
        setAssignments(
          assignments.map((a) =>
            a.id === selectedAssignment.id
              ? {
                ...a,
                submission_id: result.submission.id,
                submission_type: result.submission.submission_type,
                submission_text: result.submission.submission_text,
                submission_url: result.submission.submission_url,
                submitted_at: result.submission.submitted_at,
              }
              : a
          )
        );

        setSubmissionOpen(false);
        setSubText("");
        setSubUrl("");
        setSubType("TEXT");
      } else {
        toast.error(result.error || "Failed to submit assignment.");
      }
    } catch {
      toast.error("Failed to submit assignment.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPendingCount = () => {
    return assignments.filter((a) => !a.submission_id || a.submitted_at === null).length;
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim().toUpperCase() || "T";
  };

  const formatTeacherName = (
    teacher?: { first_name: string | null; last_name: string | null } | null
  ) => {
    if (!teacher) return "Educator";
    return `Mr/Ms. ${teacher.first_name || ""} ${teacher.last_name || ""}`.trim();
  };

  const handleAccessResource = async (res: ClassroomResource) => {
    if (res.storage_path) {
      try {
        const { getSignedResourceUrl } = await import("@/lib/services/shared/storage.actions");
        const url = await getSignedResourceUrl(res.storage_path);
        window.open(url, "_blank");
      } catch {
        toast.error("Failed to generate secure download link.");
      }
    } else {
      window.open(res.resource_url, "_blank");
    }
  };

  // Overview Tab Calculations
  const completedCount = assignments.filter(
    (a) => a.submission_id && a.submitted_at !== null
  ).length;
  const completionRate =
    assignments.length > 0 ? Math.round((completedCount / assignments.length) * 100) : 100;
  const totalXPEarned = assignments.reduce((acc, curr) => acc + (curr.score || 0), 0);

  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/kid/classrooms"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-full h-10 w-10 p-0 hover:bg-slate-50 border-slate-200 flex items-center justify-center cursor-pointer"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {classroom.name}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              {classroom.subject || "General"} • {classroom.grade || "No Grade Set"} • Teacher:{" "}
              <span className="font-bold">{formatTeacherName(classroom.teacher)}</span>
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-950/40 p-1.5 rounded-full border border-slate-200/50 dark:border-slate-850 self-start sm:self-auto overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: School },
            { id: "assignments", label: "Assignments", icon: BookOpen, count: getPendingCount() },
            { id: "resources", label: "Resources", icon: FolderOpen },
            { id: "announcements", label: "Announcements", icon: Megaphone },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id as "overview" | "assignments" | "resources" | "announcements")
                }
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer select-none shrink-0 ${active
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="inline-flex h-4 px-1.5 items-center justify-center text-[9px] font-bold rounded-full bg-indigo-100 text-indigo-700 ml-1">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Content Sections */}

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Side: Teacher card & Class description */}
          <div className="md:col-span-2 space-y-6">
            <Card className="rounded-[32px] border-slate-200/50 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-indigo-100 shadow-sm shrink-0 dark:border-slate-850">
                    <AvatarImage src={classroom.teacher?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-indigo-650 text-white font-extrabold text-lg">
                      {getInitials(classroom.teacher?.first_name, classroom.teacher?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-[10px] font-black text-indigo-750 dark:text-indigo-400 uppercase tracking-widest block mb-0.5">
                      Teacher
                    </span>
                    <h3 className="text-xl font-black text-slate-950 dark:text-white leading-tight">
                      {formatTeacherName(classroom.teacher)}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    About this class
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                    {classroom.description ||
                      "Welcome to our classroom! Use the tabs above to launch assignments, download reference materials, and stay updated with teacher announcements."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Latest Announcement Card */}
            <div className="space-y-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="h-4.5 w-4.5 text-indigo-650 dark:text-indigo-400" />
                Latest Announcement
              </h3>
              {announcements.length === 0 ? (
                <Card className="rounded-[28px] border-slate-200 bg-white/40 dark:bg-slate-900/10 p-6 text-center text-xs font-semibold text-slate-500">
                  No announcements posted yet.
                </Card>
              ) : (
                <Card className="rounded-[28px] border-indigo-150 bg-white dark:bg-slate-900/40 shadow-xs relative overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-950 dark:text-white leading-tight">
                        {announcements[0].title}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {new Date(announcements[0].created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-350 font-medium leading-relaxed pt-2 line-clamp-3">
                        {announcements[0].message}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveTab("announcements")}
                      className="text-indigo-600 hover:text-indigo-750 dark:text-indigo-400 font-bold text-xs p-0 h-auto cursor-pointer"
                    >
                      Read all announcements &rarr;
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Side: Progress and Stats */}
          <div className="space-y-6">
            <Card className="rounded-[32px] border-slate-200/50 bg-white dark:bg-slate-900/40 shadow-sm">
              <CardContent className="p-6 space-y-5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Your Progress
                </h3>

                <div className="space-y-4">
                  {/* Total Assignments Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                      <span>Tasks Finished</span>
                      <span className="text-slate-950 dark:text-white">
                        {completedCount} of {assignments.length}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-right text-slate-400 font-semibold">
                      {completionRate}% Completed
                    </div>
                  </div>

                  {/* XP Earned */}
                  <div className="pt-4 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                        XP Earned Here
                      </p>
                      <p className="text-2xl font-black text-slate-950 dark:text-white mt-0.5">
                        {totalXPEarned} XP
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                      <Trophy className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                {getPendingCount() > 0 ? (
                  <Button
                    onClick={() => setActiveTab("assignments")}
                    className="w-full rounded-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold h-11 text-xs px-4 cursor-pointer border-none shadow-sm"
                  >
                    View Pending Tasks ({getPendingCount()})
                  </Button>
                ) : (
                  <div className="bg-emerald-50/20 p-3 rounded-2xl border border-emerald-100/30 text-center text-xs font-bold text-emerald-700">
                    All tasks completed!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Assignments */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Your Tasks & Homework
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              View assignments assigned by your teacher and submit your work.
            </p>
          </div>

          {assignments.length === 0 ? (
            <Card className="rounded-[32px] border-2 border-indigo-150 bg-indigo-50/5 p-12 text-center">
              <CardContent className="space-y-4 p-0 max-w-sm mx-auto flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-950 dark:text-white">
                    No assignments posted
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                    Your teacher has not published any assignments yet. Enjoy your free time or
                    check out other learning materials!
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {assignments.map((assign) => {
                const isSubmitted = !!assign.submission_id;
                const isCompleted = isSubmitted && assign.submitted_at !== null;
                const isInProgress = isSubmitted && assign.submitted_at === null;
                const isOverdue =
                  !isCompleted && assign.due_date && new Date(assign.due_date) < new Date();
                const isGraded = assign.score !== null;

                let statusLabel = "Pending";
                let statusBadgeStyle = "border-indigo-100 bg-indigo-50 text-indigo-700";
                let stripeStyle = "bg-indigo-500";

                if (isCompleted) {
                  statusLabel = "Completed";
                  statusBadgeStyle = "border-emerald-100 bg-emerald-50 text-emerald-700";
                  stripeStyle = "bg-emerald-500";
                } else if (isInProgress) {
                  statusLabel = "In Progress";
                  statusBadgeStyle =
                    "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/40 dark:text-blue-300";
                  stripeStyle = "bg-blue-500";
                } else if (isOverdue) {
                  statusLabel = "Overdue";
                  statusBadgeStyle = "border-rose-100 bg-rose-50 text-rose-700";
                  stripeStyle = "bg-rose-500";
                }

                const formattedDate = assign.due_date
                  ? new Date(assign.due_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                  : "No due date";

                return (
                  <Card
                    key={assign.id}
                    className="rounded-[32px] border-slate-200/50 bg-white dark:bg-slate-900/40 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${stripeStyle}`} />

                    <CardContent className="p-6 pt-8 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex gap-1.5 flex-wrap">
                          {assign.subject && (
                            <Badge
                              variant="secondary"
                              className="bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border-none"
                            >
                              {assign.subject}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${statusBadgeStyle}`}
                          >
                            {statusLabel}
                          </Badge>
                        </div>

                        <h4 className="text-base font-black text-slate-950 dark:text-white leading-tight">
                          {assign.title}
                        </h4>
                        {assign.description && (
                          <p className="text-xs text-slate-500 font-semibold line-clamp-2 leading-relaxed">
                            {assign.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-100/80">
                        {assign.activity_type ? (
                          // MVP Auto-Graded Activity Flow
                          isCompleted ? (
                            <div className="bg-emerald-50/20 p-3.5 rounded-2xl border border-emerald-100/30 flex items-center justify-between text-xs w-full">
                              <span className="font-extrabold text-emerald-700 flex items-center gap-1">
                                <Award className="w-3.5 h-3.5" />
                                Completed Activity
                              </span>
                              <span className="font-black text-emerald-800 bg-emerald-100/50 px-2 py-0.5 rounded-md text-[10px]">
                                {Math.round(
                                  ((assign.score ?? 0) / (assign.total_points || 100)) * 100
                                )}
                                %
                              </span>
                            </div>
                          ) : isOverdue ? (
                            <div className="bg-rose-50/20 p-3.5 rounded-2xl border border-rose-100/30 flex items-center justify-between text-xs font-bold text-rose-700 w-full">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-rose-400" />
                                Overdue (Due {formattedDate})
                              </span>
                              <span className="font-bold text-rose-800 bg-rose-100/50 px-2 py-0.5 rounded-md text-[10px]">
                                0%
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                  {formattedDate}
                                </span>
                                <span className="font-bold text-slate-700">
                                  {assign.total_points} Points
                                </span>
                              </div>
                              <Link
                                href={`/activities/launcher?assignment_id=${assign.id}`}
                                className={`w-full rounded-full font-bold h-10 text-xs px-4 flex items-center justify-center cursor-pointer transition-colors ${isInProgress
                                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                  }`}
                              >
                                {isInProgress ? "Resume Activity" : "Launch Activity"}
                              </Link>
                            </>
                          )
                        ) : (
                          // Fallback Manual Submission Flow
                          <>
                            {isGraded ? (
                              <div className="bg-emerald-50/20 p-3.5 rounded-2xl border border-emerald-100/30 space-y-2.5 w-full">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-extrabold text-emerald-700 flex items-center gap-1">
                                    <Award className="w-3.5 h-3.5" />
                                    Grade Released
                                  </span>
                                  <span className="font-black text-emerald-800 bg-emerald-100/50 px-2 py-0.5 rounded-md text-[10px]">
                                    {Math.round(
                                      ((assign.score ?? 0) / (assign.total_points || 100)) * 100
                                    )}
                                    %
                                  </span>
                                </div>
                                {assign.feedback && (
                                  <p className="text-[11px] text-slate-600 font-medium italic leading-relaxed">
                                    &ldquo;{assign.feedback}&rdquo;
                                  </p>
                                )}
                              </div>
                            ) : isSubmitted ? (
                              <div className="bg-amber-50/10 p-3.5 rounded-2xl border border-amber-100/20 text-xs font-semibold text-amber-700 flex items-center gap-1.5 w-full">
                                <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                                Awaiting review by your teacher
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                  {formattedDate}
                                </span>
                                <span className="font-bold text-slate-700">
                                  {assign.total_points} Points
                                </span>
                              </div>
                            )}

                            {!isSubmitted && (
                              <Dialog
                                open={submissionOpen && selectedAssignment?.id === assign.id}
                                onOpenChange={(open) => {
                                  setSubmissionOpen(open);
                                  if (open) {
                                    setSelectedAssignment(assign);
                                  } else {
                                    setSelectedAssignment(null);
                                  }
                                }}
                              >
                                <DialogTrigger
                                  render={
                                    <Button className="w-full rounded-full bg-indigo-650 hover:bg-indigo-750 text-white font-bold h-10 text-xs px-4 cursor-pointer border-none shadow-sm">
                                      Submit Assignment
                                    </Button>
                                  }
                                />
                                <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
                                  <DialogHeader className="border-b border-slate-200 dark:border-slate-800 px-6 pt-6 pb-4">
                                    <DialogTitle className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
                                      Submit Work
                                    </DialogTitle>
                                    <DialogDescription className="text-sm text-slate-500">
                                      Complete and upload your submission details below.
                                    </DialogDescription>
                                  </DialogHeader>

                                  <form onSubmit={handleSubmit} className="space-y-4 py-6">
                                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100/50 space-y-1 dark:bg-slate-950">
                                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block">
                                        Instructions
                                      </span>
                                      <h5 className="text-xs font-black text-slate-950 dark:text-slate-150">
                                        {assign.title}
                                      </h5>
                                      {assign.description && (
                                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed pt-1">
                                          {assign.description}
                                        </p>
                                      )}
                                    </div>

                                    <div className="space-y-1.5">
                                      <Label
                                        htmlFor="subType"
                                        className="text-xs font-bold text-slate-700 dark:text-slate-400 ml-1"
                                      >
                                        Submission Type*
                                      </Label>
                                      <select
                                        id="subType"
                                        value={subType}
                                        onChange={(e) =>
                                          setSubType(
                                            e.target.value as "TEXT" | "PDF" | "IMAGE" | "LINK"
                                          )
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-3.5 h-11 text-sm font-semibold focus:border-indigo-500 focus:ring-0 dark:bg-slate-950 dark:border-slate-800"
                                      >
                                        <option value="TEXT">Text Answer</option>
                                        <option value="LINK">Website Link</option>
                                        <option value="PDF">PDF File Link</option>
                                        <option value="IMAGE">Image Link</option>
                                      </select>
                                    </div>

                                    {subType === "TEXT" ? (
                                      <div className="space-y-1.5">
                                        <Label
                                          htmlFor="subText"
                                          className="text-xs font-bold text-slate-700 dark:text-slate-400 ml-1"
                                        >
                                          Your Answer*
                                        </Label>
                                        <textarea
                                          id="subText"
                                          value={subText}
                                          onChange={(e) => setSubText(e.target.value)}
                                          required
                                          placeholder="Write your submission text here..."
                                          className="rounded-xl w-full border border-slate-200 p-3.5 text-xs font-semibold focus:border-indigo-500 focus:ring-0 resize-none h-28 dark:bg-slate-950 dark:border-slate-800"
                                        />
                                      </div>
                                    ) : (
                                      <div className="space-y-1.5">
                                        <Label
                                          htmlFor="subUrl"
                                          className="text-xs font-bold text-slate-700 dark:text-slate-400 ml-1"
                                        >
                                          Submission URL / Link*
                                        </Label>
                                        <Input
                                          id="subUrl"
                                          value={subUrl}
                                          onChange={(e) => setSubUrl(e.target.value)}
                                          required
                                          placeholder="https://example.com/your-submission"
                                          className="rounded-xl h-11 text-sm font-semibold"
                                        />
                                      </div>
                                    )}

                                    <DialogFooter className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-4 -mx-6 -mb-6 flex gap-2 rounded-b-[32px]">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setSubmissionOpen(false)}
                                        className="rounded-full"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 border-none"
                                      >
                                        <Send className="mr-2 h-4 w-4" />
                                        Submit
                                      </Button>
                                    </DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Resources */}
      {activeTab === "resources" && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-indigo-600" />
              Learning Resources
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Access reference materials, reading links, and documents uploaded by your teacher.
            </p>
          </div>

          {resources.length === 0 ? (
            <Card className="rounded-[32px] border-2 border-indigo-150 bg-indigo-50/5 p-12 text-center">
              <CardContent className="space-y-4 p-0 max-w-sm mx-auto flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <FolderOpen className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-950 dark:text-white">
                    No resources yet
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                    Your teacher has not uploaded any learning resources yet. Announcements or
                    assignments will populate here once added.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {resources.map((res) => {
                const isPdf = res.resource_type === "PDF";
                const isVideo = res.resource_type === "VIDEO";
                const isLink = res.resource_type === "LINK";

                return (
                  <Card
                    key={res.id}
                    className="rounded-[32px] border-slate-200/50 bg-white dark:bg-slate-900/40 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                  >
                    <CardContent className="p-6 md:p-7 space-y-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${isPdf
                              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                              : isVideo
                                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                                : isLink
                                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                                  : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                            }`}
                        >
                          {isPdf && <FileText className="h-5 w-5" />}
                          {isVideo && <Video className="h-5 w-5" />}
                          {isLink && <LinkIcon className="h-5 w-5" />}
                          {!isPdf && !isVideo && !isLink && <FolderOpen className="h-5 w-5" />}
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {res.resource_type}
                          </span>
                          <h4 className="text-sm font-black text-slate-950 dark:text-white leading-tight line-clamp-1">
                            {res.title}
                          </h4>
                        </div>
                      </div>

                      {res.description && (
                        <p className="text-xs text-slate-500 font-semibold line-clamp-2 leading-relaxed">
                          {res.description}
                        </p>
                      )}

                      <button
                        onClick={() => handleAccessResource(res)}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "rounded-xl w-full border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 font-bold text-xs h-9 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        )}
                      >
                        <span>Access File</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Announcements */}
      {activeTab === "announcements" && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-indigo-600" />
              Teacher Announcements
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Stay updated with class notifications and general updates.
            </p>
          </div>

          {announcements.length === 0 ? (
            <Card className="rounded-[32px] border-2 border-indigo-150 bg-indigo-50/5 p-12 text-center">
              <CardContent className="space-y-4 p-0 max-w-sm mx-auto flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-950 dark:text-white">
                    No announcements
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                    Your teacher has not published any classroom announcements yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <Card
                  key={ann.id}
                  className="rounded-[28px] border-slate-200/50 bg-white dark:bg-slate-900/40 shadow-xs relative overflow-hidden"
                >
                  <CardContent className="p-6 md:p-7 flex items-start gap-4">
                    <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-950 dark:text-white leading-tight">
                        {ann.title}
                      </h4>
                      <p className="text-xs font-semibold text-slate-500">
                        {new Date(ann.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-355 font-medium leading-relaxed pt-2 whitespace-pre-wrap">
                        {ann.message}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
