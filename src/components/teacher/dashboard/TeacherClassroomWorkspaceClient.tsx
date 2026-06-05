"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  PlusCircle,
  BookOpen,
  FolderOpen,
  Megaphone,
  Users,
  FileText,
  LinkIcon,
  Video,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Trash2,
  Send,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/shared/ui/card";
import { Button, buttonVariants } from "@/components/shared/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/shared/ui/badge";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shared/ui/avatar";
import {
  createAssignment,
  publishAssignment,
  deleteAssignment,
  gradeAssignment,
  uploadResource,
  deleteResource,
  createAnnouncement,
  deleteAnnouncement,
  getTeacherAssignmentOverview,
} from "@/lib/services/kid/classroom.actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shared/ui/dialog";

import type {
  Classroom,
  ClassroomAssignment,
  ClassroomResource,
  ClassroomAnnouncement,
  WorkspaceStudent,
  TeacherAssignmentOverview,
  SubmissionDetails,
} from "@/types/classroom.types";

type Props = {
  classroomId: string;
  initialClassroom: Classroom;
  initialAssignments: ClassroomAssignment[];
  initialResources: ClassroomResource[];
  initialAnnouncements: ClassroomAnnouncement[];
  initialStudents: WorkspaceStudent[];
};

export default function TeacherClassroomWorkspaceClient({
  classroomId,
  initialClassroom,
  initialAssignments,
  initialResources,
  initialAnnouncements,
  initialStudents,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    "assignments" | "resources" | "announcements" | "students"
  >("assignments");
  const [isLoading, setIsLoading] = useState(false);

  // Lists state
  const [classroom] = useState(initialClassroom);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [resources, setResources] = useState(initialResources);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [students] = useState(initialStudents);

  // Forms dialog states
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [resourceOpen, setResourceOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);

  // Create Assignment inputs
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignSubject, setAssignSubject] = useState("");
  const [assignPoints, setAssignPoints] = useState(100);
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignActivityType, setAssignActivityType] = useState("quizzes");
  const [assignTopic, setAssignTopic] = useState("");
  const [assignDifficulty, setAssignDifficulty] = useState("Grade 5");
  const [assignQuestionCount, setAssignQuestionCount] = useState(3);

  // Upload Resource inputs
  const [resTitle, setResTitle] = useState("");
  const [resDesc, setResDesc] = useState("");
  const [resType, setResType] = useState<"PDF" | "VIDEO" | "LINK" | "DOCUMENT">("PDF");
  const [resUrl, setResUrl] = useState("");
  const [resStoragePath, setResStoragePath] = useState("");

  // Create Announcement inputs
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");

  // Active Selected Assignment for grading
  const [selectedAssignment, setSelectedAssignment] = useState<ClassroomAssignment | null>(null);
  const [assignmentOverview, setAssignmentOverview] = useState<TeacherAssignmentOverview | null>(
    null
  );
  const [gradingOpen, setGradingOpen] = useState(false);

  // Grading form inputs
  const [activeSubmission, setActiveSubmission] = useState<SubmissionDetails | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(100);
  const [gradingFeedback, setGradingFeedback] = useState("");

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim()) return;

    try {
      setIsLoading(true);
      const result = await createAssignment(
        classroomId,
        assignTitle,
        assignDesc,
        assignSubject,
        assignPoints,
        assignDueDate || null,
        assignActivityType,
        assignTopic,
        assignDifficulty,
        assignQuestionCount
      );

      if (result.success && result.assignment) {
        toast.success("Assignment created successfully!");
        setAssignments([result.assignment, ...assignments]);
        setAssignmentOpen(false);
        // Reset fields
        setAssignTitle("");
        setAssignDesc("");
        setAssignSubject("");
        setAssignPoints(100);
        setAssignDueDate("");
        setAssignActivityType("quizzes");
        setAssignTopic("");
        setAssignDifficulty("Grade 5");
        setAssignQuestionCount(3);
      } else {
        toast.error(result.error || "Failed to create assignment.");
      }
    } catch {
      toast.error("Failed to create assignment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishAssignment = async (id: string) => {
    try {
      const result = await publishAssignment(id);
      if (result.success) {
        toast.success("Assignment published!");
        setAssignments(
          assignments.map((a) =>
            a.id === id ? { ...a, status: "PUBLISHED", published_at: new Date().toISOString() } : a
          )
        );
      } else {
        toast.error(result.error || "Failed to publish assignment.");
      }
    } catch {
      toast.error("Failed to publish assignment.");
    }
  };

  const handleDeleteAssignment = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete assignment "${title}"?`)) return;

    try {
      const result = await deleteAssignment(id);
      if (result.success) {
        toast.success("Assignment deleted.");
        setAssignments(assignments.filter((a) => a.id !== id));
      } else {
        toast.error(result.error || "Failed to delete assignment.");
      }
    } catch {
      toast.error("Failed to delete assignment.");
    }
  };

  const handleOpenGrading = async (assignment: ClassroomAssignment) => {
    setSelectedAssignment(assignment);
    setGradingOpen(true);
    setAssignmentOverview(null);
    try {
      const result = await getTeacherAssignmentOverview(assignment.id);
      if (result.success && result.data) {
        setAssignmentOverview(result.data);
      } else {
        toast.error("Failed to load submissions.");
      }
    } catch {
      toast.error("Failed to load submissions.");
    }
  };

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

  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || !resUrl.trim()) return;

    try {
      setIsLoading(true);
      const result = await uploadResource(
        classroomId,
        resTitle,
        resDesc,
        resType,
        resUrl,
        resStoragePath || null
      );

      if (result.success && result.resource) {
        toast.success("Resource uploaded successfully!");
        setResources([result.resource, ...resources]);
        setResourceOpen(false);
        // Reset fields
        setResTitle("");
        setResDesc("");
        setResUrl("");
        setResStoragePath("");
        setResType("PDF");
      } else {
        toast.error(result.error || "Failed to upload resource.");
      }
    } catch {
      toast.error("Failed to upload resource.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const result = await deleteResource(id);
      if (result.success) {
        toast.success("Resource deleted.");
        setResources(resources.filter((r) => r.id !== id));
      } else {
        toast.error(result.error || "Failed to delete resource.");
      }
    } catch {
      toast.error("Failed to delete resource.");
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;

    try {
      setIsLoading(true);
      const result = await createAnnouncement(classroomId, annTitle, annMessage);

      if (result.success && result.announcement) {
        toast.success("Announcement published!");
        setAnnouncements([result.announcement, ...announcements]);
        setAnnouncementOpen(false);
        setAnnTitle("");
        setAnnMessage("");
      } else {
        toast.error(result.error || "Failed to post announcement.");
      }
    } catch {
      toast.error("Failed to post announcement.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const result = await deleteAnnouncement(id);
      if (result.success) {
        toast.success("Announcement deleted.");
        setAnnouncements(announcements.filter((a) => a.id !== id));
      } else {
        toast.error(result.error || "Failed to delete announcement.");
      }
    } catch {
      toast.error("Failed to delete announcement.");
    }
  };

  const getInitials = (first?: string | null, last?: string | null) => {
    return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.trim().toUpperCase() || "S";
  };

  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/teacher"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-full h-10 w-10 p-0 hover:bg-slate-50 border-slate-200 flex items-center justify-center"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {classroom.name}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              {classroom.subject || "General"} • {classroom.grade || "No Grade Set"} • Class Code:{" "}
              <span className="font-bold font-mono tracking-wider">{classroom.class_code}</span>
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-950/40 p-1.5 rounded-full border border-slate-200/50 dark:border-slate-850 self-start sm:self-auto overflow-x-auto">
          {[
            { id: "assignments", label: "Assignments", icon: BookOpen },
            { id: "resources", label: "Resources", icon: FolderOpen },
            { id: "announcements", label: "Announcements", icon: Megaphone },
            { id: "students", label: "Students", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id as "assignments" | "resources" | "announcements" | "students")
                }
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer select-none shrink-0 ${
                  active
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Workspace Tabs Viewports */}

      {/* Tab: Assignments */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                Class Assignments
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Publish tasks, assess homework, and provide feedback.
              </p>
            </div>

            <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}>
              <DialogTrigger
                render={
                  <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-5 shadow-sm cursor-pointer">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Assignment
                  </Button>
                }
              />
              <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
                <DialogHeader className="border-b border-slate-200 dark:border-slate-800 px-6 pt-6 pb-4">
                  <DialogTitle className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
                    Create Assignment
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-500">
                    Design a new educational task for students.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateAssignment} className="space-y-4 px-6 py-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="assignTitle" className="text-xs font-bold text-slate-700 ml-1">
                      Assignment Title*
                    </Label>
                    <Input
                      id="assignTitle"
                      value={assignTitle}
                      onChange={(e) => setAssignTitle(e.target.value)}
                      required
                      placeholder="e.g. Science Lab Project"
                      className="rounded-xl h-11 text-sm font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="assignDesc" className="text-xs font-bold text-slate-700 ml-1">
                      Instructions / Description
                    </Label>
                    <Input
                      id="assignDesc"
                      value={assignDesc}
                      onChange={(e) => setAssignDesc(e.target.value)}
                      placeholder="Describe submission format, resources, details..."
                      className="rounded-xl h-11 text-sm font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="assignSubject"
                        className="text-xs font-bold text-slate-700 ml-1"
                      >
                        Subject
                      </Label>
                      <Input
                        id="assignSubject"
                        value={assignSubject}
                        onChange={(e) => setAssignSubject(e.target.value)}
                        placeholder="e.g. Physics"
                        className="rounded-xl h-11 text-sm font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="assignPoints"
                        className="text-xs font-bold text-slate-700 ml-1"
                      >
                        Total Points
                      </Label>
                      <Input
                        id="assignPoints"
                        type="number"
                        value={assignPoints}
                        onChange={(e) => setAssignPoints(Number(e.target.value))}
                        required
                        className="rounded-xl h-11 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="assignActivityType"
                        className="text-xs font-bold text-slate-700 ml-1"
                      >
                        Activity Type
                      </Label>
                      <select
                        id="assignActivityType"
                        value={assignActivityType}
                        onChange={(e) => setAssignActivityType(e.target.value)}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11 w-full px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      >
                        <option value="quizzes">Quiz</option>
                        <option value="flashcards">Flashcards</option>
                        <option value="math-challenges">Math Challenge</option>
                        <option value="word-scrambles">Spelling Scramble</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="assignQuestionCount"
                        className="text-xs font-bold text-slate-700 ml-1"
                      >
                        Question Count
                      </Label>
                      <Input
                        id="assignQuestionCount"
                        type="number"
                        min={1}
                        max={20}
                        value={assignQuestionCount}
                        onChange={(e) => setAssignQuestionCount(Number(e.target.value))}
                        required
                        className="rounded-xl h-11 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="assignTopic"
                        className="text-xs font-bold text-slate-700 ml-1"
                      >
                        Topic*
                      </Label>
                      <Input
                        id="assignTopic"
                        value={assignTopic}
                        onChange={(e) => setAssignTopic(e.target.value)}
                        required
                        placeholder="e.g. Addition, Dinosaurs"
                        className="rounded-xl h-11 text-sm font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="assignDifficulty"
                        className="text-xs font-bold text-slate-700 ml-1"
                      >
                        Difficulty
                      </Label>
                      <select
                        id="assignDifficulty"
                        value={assignDifficulty}
                        onChange={(e) => setAssignDifficulty(e.target.value)}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11 w-full px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      >
                        <option value="Grade 1">Grade 1</option>
                        <option value="Grade 2">Grade 2</option>
                        <option value="Grade 3">Grade 3</option>
                        <option value="Grade 4">Grade 4</option>
                        <option value="Grade 5">Grade 5</option>
                        <option value="Grade 6">Grade 6</option>
                        <option value="Grade 7">Grade 7</option>
                        <option value="Grade 8">Grade 8</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="assignDueDate"
                      className="text-xs font-bold text-slate-700 ml-1"
                    >
                      Due Date
                    </Label>
                    <Input
                      id="assignDueDate"
                      type="date"
                      value={assignDueDate}
                      onChange={(e) => setAssignDueDate(e.target.value)}
                      className="rounded-xl h-11 text-sm font-semibold"
                    />
                  </div>

                  <DialogFooter className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-4 -mx-6 -mb-6 flex gap-2 rounded-b-[32px]">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAssignmentOpen(false)}
                      className="rounded-full"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                    >
                      Save as Draft
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {assignments.length === 0 ? (
            <Card className="rounded-[32px] border-dashed border-2 border-indigo-150 bg-indigo-50/5 p-12 text-center">
              <CardContent className="space-y-4 p-0 max-w-sm mx-auto flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-950 dark:text-white">
                    No assignments posted
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                    Start by posting homework drafts, then publish them to students to collect
                    submissions.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {assignments.map((assign) => {
                const isDraft = assign.status === "DRAFT";
                const isClosed = assign.status === "CLOSED";
                const formattedDate = assign.due_date
                  ? new Date(assign.due_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : "No due date";

                return (
                  <Card
                    key={assign.id}
                    className="rounded-[32px] border-slate-200/50 bg-white dark:bg-slate-900/40 hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                  >
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 ${isDraft ? "bg-slate-300" : isClosed ? "bg-rose-500" : "bg-indigo-500"}`}
                    />

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
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isDraft
                                ? "border-slate-200 bg-slate-50 text-slate-600"
                                : isClosed
                                  ? "border-rose-100 bg-rose-50 text-rose-600"
                                  : "border-indigo-100 bg-indigo-50 text-indigo-600"
                            }`}
                          >
                            {assign.status}
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

                        {/* Config Fields */}
                        {assign.activity_type && (
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 mt-2">
                            <div>
                              <span className="text-slate-400 block uppercase tracking-wider text-[8px]">
                                Type
                              </span>
                              <span className="capitalize">
                                {assign.activity_type.replace("-", " ")}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block uppercase tracking-wider text-[8px]">
                                Topic
                              </span>
                              <span className="truncate block">{assign.topic || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block uppercase tracking-wider text-[8px]">
                                Difficulty
                              </span>
                              <span>{assign.difficulty || "Grade 5"}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block uppercase tracking-wider text-[8px]">
                                Count
                              </span>
                              <span>{assign.question_count ?? 3} questions</span>
                            </div>
                          </div>
                        )}

                        {/* Metrics section */}
                        {!isDraft && (
                          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] mt-2">
                            <div className="flex justify-between items-center text-slate-600 font-bold">
                              <span>Completion Rate</span>
                              <span className="text-indigo-600">
                                {assign.total_students && assign.total_students > 0
                                  ? Math.round(
                                      ((assign.submissions_count || 0) / assign.total_students) *
                                        100
                                    )
                                  : 0}
                                % ({assign.submissions_count || 0}/{assign.total_students || 0})
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600 font-bold">
                              <span>Average Score</span>
                              <span className="text-emerald-600">
                                {assign.average_score
                                  ? Math.round(Number(assign.average_score))
                                  : 0}
                                %
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-100/80">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {formattedDate}
                          </span>
                          <span className="font-bold text-slate-700">
                            {assign.total_points} Points
                          </span>
                        </div>

                        <div className="flex gap-2 w-full pt-1">
                          {isDraft ? (
                            <Button
                              onClick={() => handlePublishAssignment(assign.id)}
                              className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs px-4 flex-1 cursor-pointer"
                            >
                              Publish
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleOpenGrading(assign)}
                              variant="outline"
                              className="rounded-full border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 font-bold h-9 text-xs px-4 flex-1 cursor-pointer"
                            >
                              View Submissions
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            onClick={() => handleDeleteAssignment(assign.id, assign.title)}
                            className="h-9 w-9 rounded-full p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Dialog: Grading / Submissions Details */}
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
                    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                      <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-950 font-bold">
                        No submissions collected yet
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold max-w-xs mt-0.5">
                        Students who join this classroom will see published assignments and can
                        submit work.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {assignmentOverview.submissions.map((sub: SubmissionDetails) => {
                        const name =
                          `${sub.first_name || ""} ${sub.last_name || ""}`.trim() || "Student";
                        // Auto-graded assignments: score is set by the system on activity completion.
                        // A submission with submitted_at set is already system-graded.
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
                                ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10"
                                : isGraded
                                  ? "bg-emerald-50/20 border-emerald-100/50 hover:bg-slate-50"
                                  : "bg-white border-slate-100 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-9 w-9 border shadow-xs shrink-0">
                                <AvatarImage src={sub.avatar_url ?? undefined} />
                                <AvatarFallback className="text-xs bg-indigo-500 text-white font-black">
                                  {getInitials(sub.first_name, sub.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-950 leading-tight truncate">
                                  {name}
                                </p>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                                  <Clock className="h-3 w-3 shrink-0" />
                                  {new Date(sub.submitted_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              {isGraded ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[10px] px-2 py-0.5">
                                  {sub.score !== null
                                    ? `${sub.score}/${selectedAssignment?.total_points}`
                                    : isAutoGraded
                                      ? "Auto-Graded"
                                      : "Graded"}
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-50 text-amber-700 border-none font-bold text-[10px] px-2 py-0.5 flex items-center gap-1">
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
                <div className="w-full md:w-[320px] shrink-0 border-t md:border-t-0 md:border-l border-slate-150/80 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between">
                  {activeSubmission ? (
                    selectedAssignment?.activity_type ? (
                      // Auto-graded assignment: show read-only summary, no manual grading
                      <div className="space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block mb-1">
                              Auto-Graded Activity
                            </span>
                            <p className="text-xs font-bold text-slate-900">
                              Type:{" "}
                              <span className="font-black text-emerald-700 capitalize">
                                {activeSubmission.submission_type}
                              </span>
                            </p>
                            {activeSubmission.submitted_at ? (
                              <p className="text-xs text-slate-500 font-semibold mt-2">
                                Completed:{" "}
                                {new Date(activeSubmission.submitted_at).toLocaleString()}
                              </p>
                            ) : (
                              <p className="text-xs text-amber-600 font-semibold mt-2">
                                Activity started but not yet completed.
                              </p>
                            )}
                            {activeSubmission.score !== null &&
                            activeSubmission.score !== undefined ? (
                              <p className="text-sm font-black text-emerald-800 mt-3">
                                Score:{" "}
                                <span className="text-xl">
                                  {activeSubmission.score}/{selectedAssignment?.total_points}
                                </span>
                              </p>
                            ) : null}
                          </div>
                          <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 mb-1">
                              Activity Type
                            </p>
                            <p className="text-xs font-bold text-slate-700 capitalize">
                              {selectedAssignment.activity_type?.replace(/-/g, " ")}
                            </p>
                            {selectedAssignment.topic && (
                              <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                                Topic: {selectedAssignment.topic}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center font-semibold italic">
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
                          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block mb-1">
                              Submission Info
                            </span>
                            <p className="text-xs font-bold text-slate-900">
                              Type:{" "}
                              <span className="font-black text-indigo-700">
                                {activeSubmission.submission_type}
                              </span>
                            </p>
                            {activeSubmission.submission_text && (
                              <p className="text-xs text-slate-600 mt-2 bg-white p-2.5 rounded-xl border border-slate-100/50 max-h-[120px] overflow-y-auto font-medium leading-relaxed italic">
                                &ldquo;{activeSubmission.submission_text}&rdquo;
                              </p>
                            )}
                            {activeSubmission.submission_url && (
                              <a
                                href={activeSubmission.submission_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-700 mt-3.5 hover:underline"
                              >
                                <span>View Submitted Link</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label
                              htmlFor="gradeScore"
                              className="text-xs font-bold text-slate-700 ml-1"
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
                              className="text-xs font-bold text-slate-700 ml-1"
                            >
                              Grade Feedback
                            </Label>
                            <textarea
                              id="gradeFeedback"
                              value={gradingFeedback}
                              onChange={(e) => setGradingFeedback(e.target.value)}
                              placeholder="Great job! Keep it up..."
                              className="rounded-xl w-full border border-slate-200 dark:border-slate-800 p-3 text-xs font-semibold focus:border-indigo-500 focus:ring-0 resize-none h-24"
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
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 border border-slate-100 rounded-2xl">
                      <HelpCircle className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-xs text-slate-600 font-bold">Select student submission</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {selectedAssignment?.activity_type
                          ? "Click any submission on the left to view results."
                          : "Click any submission on the left to grade and award XP."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-4 flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setGradingOpen(false)}
                  className="rounded-full"
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Tab: Resources */}
      {activeTab === "resources" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-indigo-600" />
                Classroom Resources
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Publish worksheets, learning links, videos, and reading materials.
              </p>
            </div>

            <Dialog open={resourceOpen} onOpenChange={setResourceOpen}>
              <DialogTrigger
                render={
                  <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-5 shadow-sm cursor-pointer">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Upload Resource
                  </Button>
                }
              />
              <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
                <DialogHeader className="border-b border-slate-200 dark:border-slate-800 px-6 pt-6 pb-4">
                  <DialogTitle className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
                    Upload Resource
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-500">
                    Provide kids with reference links or downloadable material.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleUploadResource} className="space-y-4 px-6 py-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="resTitle" className="text-xs font-bold text-slate-700 ml-1">
                      Resource Title*
                    </Label>
                    <Input
                      id="resTitle"
                      value={resTitle}
                      onChange={(e) => setResTitle(e.target.value)}
                      required
                      placeholder="e.g. Solar System Chart"
                      className="rounded-xl h-11 text-sm font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="resDesc" className="text-xs font-bold text-slate-700 ml-1">
                      Description
                    </Label>
                    <Input
                      id="resDesc"
                      value={resDesc}
                      onChange={(e) => setResDesc(e.target.value)}
                      placeholder="Provide short details about the file..."
                      className="rounded-xl h-11 text-sm font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="resType" className="text-xs font-bold text-slate-700 ml-1">
                        Resource Type
                      </Label>
                      <select
                        id="resType"
                        value={resType}
                        onChange={(e) =>
                          setResType(e.target.value as "PDF" | "VIDEO" | "LINK" | "DOCUMENT")
                        }
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-850 px-3.5 h-11 text-sm font-semibold focus:border-indigo-500 focus:ring-0"
                      >
                        <option value="PDF">PDF File</option>
                        <option value="VIDEO">Video Link</option>
                        <option value="LINK">Website Link</option>
                        <option value="DOCUMENT">Document</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="resStoragePath"
                        className="text-xs font-bold text-slate-700 ml-1"
                      >
                        Storage Path (Optional)
                      </Label>
                      <Input
                        id="resStoragePath"
                        value={resStoragePath}
                        onChange={(e) => setResStoragePath(e.target.value)}
                        placeholder="Storage key..."
                        className="rounded-xl h-11 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="resUrl" className="text-xs font-bold text-slate-700 ml-1">
                      Resource URL / Link*
                    </Label>
                    <Input
                      id="resUrl"
                      value={resUrl}
                      onChange={(e) => setResUrl(e.target.value)}
                      required
                      placeholder="https://example.com/file"
                      className="rounded-xl h-11 text-sm font-semibold"
                    />
                  </div>

                  <DialogFooter className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-4 -mx-6 -mb-6 flex gap-2 rounded-b-[32px]">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setResourceOpen(false)}
                      className="rounded-full"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                    >
                      Upload
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {resources.length === 0 ? (
            <Card className="rounded-[32px] border-dashed border-2 border-indigo-150 bg-indigo-50/5 p-12 text-center">
              <CardContent className="space-y-4 p-0 max-w-sm mx-auto flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <FolderOpen className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-950 dark:text-white">
                    No classroom resources
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                    Upload course documents, guides, or instructional links to support student
                    learning.
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
                    className="rounded-[32px] border-slate-200/50 bg-white dark:bg-slate-900/40 hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                  >
                    <CardContent className="p-6 md:p-7 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${
                              isPdf
                                ? "bg-rose-50 text-rose-600"
                                : isVideo
                                  ? "bg-amber-50 text-amber-600"
                                  : isLink
                                    ? "bg-sky-50 text-sky-600"
                                    : "bg-indigo-50 text-indigo-600"
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

                        <Button
                          variant="ghost"
                          onClick={() => handleDeleteResource(res.id)}
                          className="h-8 w-8 rounded-full p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {res.description && (
                        <p className="text-xs text-slate-500 font-semibold line-clamp-2 leading-relaxed">
                          {res.description}
                        </p>
                      )}

                      <a
                        href={res.resource_url}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "rounded-xl w-full border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 font-bold text-xs h-9 shadow-xs flex items-center justify-center gap-1.5"
                        )}
                      >
                        <span>Access Resource</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
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
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-indigo-600" />
                Classroom Announcements
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Publish updates and notices directly to the students feed.
              </p>
            </div>

            <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
              <DialogTrigger
                render={
                  <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-5 shadow-sm cursor-pointer">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Post Announcement
                  </Button>
                }
              />
              <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
                <DialogHeader className="border-b border-slate-200 dark:border-slate-800 px-6 pt-6 pb-4">
                  <DialogTitle className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
                    Post Announcement
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-500">
                    Alert your class about upcoming events, homework or changes.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateAnnouncement} className="space-y-4 px-6 py-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="annTitle" className="text-xs font-bold text-slate-700 ml-1">
                      Subject / Title*
                    </Label>
                    <Input
                      id="annTitle"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      required
                      placeholder="e.g. Science Lab Rescheduled"
                      className="rounded-xl h-11 text-sm font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="annMessage" className="text-xs font-bold text-slate-700 ml-1">
                      Announcement Message*
                    </Label>
                    <textarea
                      id="annMessage"
                      value={annMessage}
                      onChange={(e) => setAnnMessage(e.target.value)}
                      required
                      placeholder="Write your note to the class here..."
                      className="rounded-xl w-full border border-slate-200 dark:border-slate-800 p-3 text-xs font-semibold focus:border-indigo-500 focus:ring-0 resize-none h-28"
                    />
                  </div>

                  <DialogFooter className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-4 -mx-6 -mb-6 flex gap-2 rounded-b-[32px]">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAnnouncementOpen(false)}
                      className="rounded-full"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                    >
                      Publish
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {announcements.length === 0 ? (
            <Card className="rounded-[32px] border-dashed border-2 border-indigo-150 bg-indigo-50/5 p-12 text-center">
              <CardContent className="space-y-4 p-0 max-w-sm mx-auto flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-950 dark:text-white">
                    No announcements
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                    Send updates or alerts to notify kids instantly about classroom activities.
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
                  <CardContent className="p-6 md:p-7 flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex gap-4 items-start">
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
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="h-8 w-8 rounded-full p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 self-end sm:self-start shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Students */}
      {activeTab === "students" && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Class Roster
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Approved student accounts currently linked to this class workspace.
            </p>
          </div>

          {students.length === 0 ? (
            <Card className="rounded-[32px] border-dashed border-2 border-indigo-150 bg-indigo-50/5 p-12 text-center">
              <CardContent className="space-y-4 p-0 max-w-sm mx-auto flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-950 dark:text-white">
                    No students enrolled
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                    Provide the classroom code to kids to invite them. They will appear here once
                    you approve their requests on the dashboard.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {students.map((student) => {
                const name =
                  `${student.first_name || ""} ${student.last_name || ""}`.trim() || "Student";
                return (
                  <Card
                    key={student.user_id}
                    className="rounded-[28px] border-slate-200/50 bg-white dark:bg-slate-900/40 p-5 hover:shadow-xs transition-shadow"
                  >
                    <CardContent className="p-0 flex items-center gap-3.5">
                      <Avatar className="h-12 w-12 border shadow-xs shrink-0">
                        <AvatarImage src={student.avatar_url ?? undefined} />
                        <AvatarFallback className="text-sm bg-indigo-500 text-white font-black">
                          {getInitials(student.first_name, student.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-slate-950 dark:text-white leading-tight truncate">
                          {name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                          XP Score:{" "}
                          <span className="font-extrabold text-indigo-600">
                            {student.total_experience_points || 0}
                          </span>
                        </p>
                        {student.current_streak > 0 && (
                          <Badge className="bg-amber-50 text-amber-700 border-none font-bold text-[8px] tracking-wider uppercase px-2 py-0 h-4 mt-1.5">
                            {student.current_streak} Day Streak
                          </Badge>
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
    </div>
  );
}
