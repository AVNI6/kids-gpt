"use client";

import { useState } from "react";
import { PlusCircle, BookOpen, Calendar, Trash2, Edit2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { parseLocalDate, formatLocalDate } from "@/lib/utils/kid/childAge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createAssignment, updateAssignment } from "@/lib/services/kid/classroom.actions";
import type { ClassroomAssignment } from "@/types/classroom.types";

type Props = {
  classroomId: string;
  assignments: ClassroomAssignment[];
  setAssignments: React.Dispatch<React.SetStateAction<ClassroomAssignment[]>>;
  handlePublishAssignment: (id: string) => Promise<void>;
  handleDeleteAssignment: (id: string, title: string) => void;
  handleOpenGrading: (assignment: ClassroomAssignment) => Promise<void>;
  publishingAssignmentId?: string | null;
};

export default function ClassroomAssignmentsTab({
  classroomId,
  assignments,
  setAssignments,
  handlePublishAssignment,
  handleDeleteAssignment,
  handleOpenGrading,
  publishingAssignmentId,
}: Props) {
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Edit Assignment states
  const [editOpen, setEditOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ClassroomAssignment | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editPoints, setEditPoints] = useState(100);
  const [editDueDate, setEditDueDate] = useState("");
  const [editActivityType, setEditActivityType] = useState("quizzes");
  const [editTopic, setEditTopic] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("Grade 5");
  const [editQuestionCount, setEditQuestionCount] = useState(3);

  const handleOpenEdit = (assign: ClassroomAssignment) => {
    setEditingAssignment(assign);
    setEditTitle(assign.title || "");
    setEditDesc(assign.description || "");
    setEditSubject(assign.subject || "");
    setEditPoints(assign.total_points || 100);
    setEditDueDate(assign.due_date ? new Date(assign.due_date).toISOString().split("T")[0] : "");
    setEditActivityType(assign.activity_type || "quizzes");
    setEditTopic(assign.topic || "");
    setEditDifficulty(assign.difficulty || "Grade 5");
    setEditQuestionCount(assign.question_count ?? 3);
    setEditOpen(true);
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment || !editTitle.trim()) return;

    try {
      setIsLoading(true);
      const result = await updateAssignment(
        editingAssignment.id,
        editTitle,
        editDesc,
        editSubject,
        editPoints,
        editDueDate || null,
        editActivityType,
        editTopic,
        editDifficulty,
        editQuestionCount
      );

      if (result.success && result.assignment) {
        toast.success("Assignment updated successfully!");
        setAssignments(
          assignments.map((a) =>
            a.id === editingAssignment.id ? { ...a, ...result.assignment } : a
          )
        );
        setEditOpen(false);
      } else {
        toast.error(result.error || "Failed to update assignment.");
      }
    } catch {
      toast.error("Failed to update assignment.");
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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

            <form onSubmit={handleCreateAssignment} className="space-y-4 px-6 pb-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="assignTitle"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                >
                  Assignment Title*
                </Label>
                <Input
                  id="assignTitle"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  required
                  placeholder="e.g. Science Lab Project"
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-0 w-full disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="assignDesc"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                >
                  Instructions / Description
                </Label>
                <Input
                  id="assignDesc"
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  placeholder="Describe submission format, resources, details..."
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-0 w-full disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="assignSubject"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                  >
                    Subject
                  </Label>
                  <Input
                    id="assignSubject"
                    value={assignSubject}
                    onChange={(e) => setAssignSubject(e.target.value)}
                    placeholder="e.g. Physics"
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-0 w-full disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="assignPoints"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                  >
                    Total Points
                  </Label>
                  <Input
                    id="assignPoints"
                    type="number"
                    value={assignPoints}
                    onChange={(e) => setAssignPoints(Number(e.target.value))}
                    required
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-0 w-full disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="assignActivityType"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                  >
                    Activity Type
                  </Label>
                  <Select
                    value={assignActivityType}
                    onValueChange={(val) => setAssignActivityType(val || "")}
                  >
                    <SelectTrigger className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11! w-full px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed">
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quizzes">Quiz</SelectItem>
                      <SelectItem value="flashcards">Flashcards</SelectItem>
                      <SelectItem value="math-challenges">Math Challenge</SelectItem>
                      <SelectItem value="word-scrambles">Spelling Scramble</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="assignQuestionCount"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
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
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-0 w-full disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="assignTopic"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                  >
                    Topic*
                  </Label>
                  <Input
                    id="assignTopic"
                    value={assignTopic}
                    onChange={(e) => setAssignTopic(e.target.value)}
                    required
                    placeholder="e.g. Addition, Dinosaurs"
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-0 w-full disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="assignDifficulty"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                  >
                    Difficulty
                  </Label>
                  <Select
                    value={assignDifficulty}
                    onValueChange={(val) => setAssignDifficulty(val || "")}
                  >
                    <SelectTrigger className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11! w-full px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Grade 1">Grade 1</SelectItem>
                      <SelectItem value="Grade 2">Grade 2</SelectItem>
                      <SelectItem value="Grade 3">Grade 3</SelectItem>
                      <SelectItem value="Grade 4">Grade 4</SelectItem>
                      <SelectItem value="Grade 5">Grade 5</SelectItem>
                      <SelectItem value="Grade 6">Grade 6</SelectItem>
                      <SelectItem value="Grade 7">Grade 7</SelectItem>
                      <SelectItem value="Grade 8">Grade 8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="assignDueDate"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                >
                  Due Date
                </Label>
                <Popover>
                  <PopoverTrigger
                    type="button"
                    id="assignDueDate"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11 px-3 text-left justify-start flex items-center gap-2 hover:bg-background/90 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-0 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    {assignDueDate ? (
                      format(parseLocalDate(assignDueDate), "PPP")
                    ) : (
                      <span className="text-muted-foreground/50">Select due date</span>
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                    <ShadcnCalendar
                      mode="single"
                      selected={assignDueDate ? parseLocalDate(assignDueDate) : undefined}
                      onSelect={(d) => setAssignDueDate(d ? formatLocalDate(d) : "")}
                      disabled={{ before: new Date() }}
                    />
                  </PopoverContent>
                </Popover>
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
                  loading={isLoading}
                  loadingText="Saving..."
                  className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Save as Draft
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {assignments.length === 0 ? (
        <Card className="rounded-[32px] border-2 border-indigo-150 dark:border-slate-800 bg-indigo-50/5 p-12 text-center">
          <CardContent className="space-y-4 p-0 max-w-sm mx-auto flex flex-col items-center">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500">
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
                className="rounded-[32px] border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/40 hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${isDraft ? "bg-slate-300 dark:bg-slate-700" : isClosed ? "bg-rose-500" : "bg-indigo-500"}`}
                />

                <CardContent className="p-6 pt-8 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex gap-1.5 flex-wrap">
                      {assign.subject && (
                        <Badge
                          variant="secondary"
                          className="bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border-none"
                        >
                          {assign.subject}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isDraft
                            ? "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                            : isClosed
                              ? "border-rose-100 dark:border-rose-950 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
                              : "border-indigo-100 dark:border-indigo-950 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
                        }`}
                      >
                        {assign.status}
                      </Badge>
                    </div>

                    <h4 className="text-base font-black text-slate-950 dark:text-white leading-tight">
                      {assign.title}
                    </h4>
                    {assign.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold line-clamp-2 leading-relaxed">
                        {assign.description}
                      </p>
                    )}

                    {/* Config Fields */}
                    {assign.activity_type && (
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 mt-2">
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block uppercase tracking-wider text-[8px]">
                            Type
                          </span>
                          <span className="capitalize">
                            {assign.activity_type.replace("-", " ")}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block uppercase tracking-wider text-[8px]">
                            Topic
                          </span>
                          <span className="truncate block">{assign.topic || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block uppercase tracking-wider text-[8px]">
                            Difficulty
                          </span>
                          <span>{assign.difficulty || "Grade 5"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 block uppercase tracking-wider text-[8px]">
                            Count
                          </span>
                          <span>{assign.question_count ?? 3} questions</span>
                        </div>
                      </div>
                    )}

                    {/* Metrics section */}
                    {!isDraft && (
                      <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] mt-2">
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-bold">
                          <span>Completion Rate</span>
                          <span className="text-indigo-600 dark:text-indigo-400">
                            {assign.total_students && assign.total_students > 0
                              ? Math.round(
                                  ((assign.submissions_count || 0) / assign.total_students) * 100
                                )
                              : 0}
                            % ({assign.submissions_count || 0}/{assign.total_students || 0})
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-bold">
                          <span>Average Score</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {assign.average_score ? Math.round(Number(assign.average_score)) : 0}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100/80 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formattedDate}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {assign.total_points} Points
                      </span>
                    </div>

                    <div className="flex gap-2 w-full pt-1">
                      {isDraft ? (
                        <Button
                          loading={publishingAssignmentId === assign.id}
                          loadingText="Publishing..."
                          onClick={() => handlePublishAssignment(assign.id)}
                          className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs px-4 flex-1 cursor-pointer"
                        >
                          Publish
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleOpenGrading(assign)}
                          variant="outline"
                          className="rounded-full border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold h-9 text-xs px-4 flex-1 cursor-pointer"
                        >
                          View Submissions
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        onClick={() => handleOpenEdit(assign)}
                        className="h-9 w-9 rounded-full p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteAssignment(assign.id, assign.title)}
                        className="h-9 w-9 rounded-full p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
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

      {/* Edit Assignment Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
          <DialogHeader className="border-b border-slate-200 dark:border-slate-800 px-6 pt-6 pb-4">
            <DialogTitle className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
              Edit Assignment
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Update the details of this assignment.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateAssignment} className="space-y-4 px-6 pb-5">
            <div className="space-y-1.5">
              <Label
                htmlFor="editTitle"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
              >
                Assignment Title*
              </Label>
              <Input
                id="editTitle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                placeholder="e.g. Science Lab Project"
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-0 w-full disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="editDesc"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
              >
                Instructions / Description
              </Label>
              <Input
                id="editDesc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Describe submission format, resources, details..."
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-0 w-full disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="editSubject"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                >
                  Subject
                </Label>
                <Input
                  id="editSubject"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="e.g. Physics"
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-0 w-full disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="editPoints"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                >
                  Total Points
                </Label>
                <Input
                  id="editPoints"
                  type="number"
                  value={editPoints}
                  onChange={(e) => setEditPoints(Number(e.target.value))}
                  required
                  disabled={
                    editingAssignment?.status === "PUBLISHED" ||
                    editingAssignment?.status === "CLOSED"
                  }
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-0 w-full disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="editActivityType"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                >
                  Activity Type
                </Label>
                <Select
                  value={editActivityType}
                  onValueChange={(val) => setEditActivityType(val || "")}
                  disabled={
                    editingAssignment?.status === "PUBLISHED" ||
                    editingAssignment?.status === "CLOSED"
                  }
                >
                  <SelectTrigger className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11! w-full px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed">
                    <SelectValue placeholder="Select activity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quizzes">Quiz</SelectItem>
                    <SelectItem value="flashcards">Flashcards</SelectItem>
                    <SelectItem value="math-challenges">Math Challenge</SelectItem>
                    <SelectItem value="word-scrambles">Spelling Scramble</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="editQuestionCount"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                >
                  Question Count
                </Label>
                <Input
                  id="editQuestionCount"
                  type="number"
                  min={1}
                  max={20}
                  value={editQuestionCount}
                  onChange={(e) => setEditQuestionCount(Number(e.target.value))}
                  required
                  disabled={
                    editingAssignment?.status === "PUBLISHED" ||
                    editingAssignment?.status === "CLOSED"
                  }
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-0 w-full disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="editTopic"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                >
                  Topic*
                </Label>
                <Input
                  id="editTopic"
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  required
                  disabled={
                    editingAssignment?.status === "PUBLISHED" ||
                    editingAssignment?.status === "CLOSED"
                  }
                  placeholder="e.g. Addition, Dinosaurs"
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-0 w-full disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="editDifficulty"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                >
                  Difficulty
                </Label>
                <Select
                  value={editDifficulty}
                  onValueChange={(val) => setEditDifficulty(val || "")}
                  disabled={
                    editingAssignment?.status === "PUBLISHED" ||
                    editingAssignment?.status === "CLOSED"
                  }
                >
                  <SelectTrigger className="rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11! w-full px-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grade 1">Grade 1</SelectItem>
                    <SelectItem value="Grade 2">Grade 2</SelectItem>
                    <SelectItem value="Grade 3">Grade 3</SelectItem>
                    <SelectItem value="Grade 4">Grade 4</SelectItem>
                    <SelectItem value="Grade 5">Grade 5</SelectItem>
                    <SelectItem value="Grade 6">Grade 6</SelectItem>
                    <SelectItem value="Grade 7">Grade 7</SelectItem>
                    <SelectItem value="Grade 8">Grade 8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="editDueDate"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
              >
                Due Date
              </Label>
              <Popover>
                <PopoverTrigger
                  type="button"
                  id="editDueDate"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm font-semibold h-11 px-3 text-left justify-start flex items-center gap-2 hover:bg-background/90 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-0 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  {editDueDate ? (
                    format(parseLocalDate(editDueDate), "PPP")
                  ) : (
                    <span className="text-muted-foreground/50">Select due date</span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                  <ShadcnCalendar
                    mode="single"
                    selected={editDueDate ? parseLocalDate(editDueDate) : undefined}
                    onSelect={(d) => setEditDueDate(d ? formatLocalDate(d) : "")}
                    disabled={{ before: new Date() }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <DialogFooter className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-4 -mx-6 -mb-6 flex gap-2 rounded-b-[32px]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isLoading}
                loadingText="Saving..."
                className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
