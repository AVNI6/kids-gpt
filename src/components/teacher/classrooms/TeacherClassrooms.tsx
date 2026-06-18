"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { School, Trash2, Plus, CopyIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { createClassroom, deleteClassroom } from "@/lib/services/kid/classroom.actions";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Classroom } from "@/types/classroom.types";

export interface EnrichedClassroom extends Classroom {
  students_count?: number;
  assignments_count?: number;
  resources_count?: number;
  announcements_count?: number;
}

type Props = {
  classrooms: EnrichedClassroom[];
  createOpen?: boolean;
  setCreateOpen?: (open: boolean) => void;
};

export default function TeacherClassrooms({ classrooms, createOpen, setCreateOpen }: Props) {
  const [localOpen, setLocalOpen] = useState(createOpen || false);
  const isOpen = setCreateOpen ? createOpen || false : localOpen;
  const setIsOpen = setCreateOpen || setLocalOpen;

  useEffect(() => {
    if (createOpen !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalOpen(createOpen);
    }
  }, [createOpen]);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteClassroomTarget, setDeleteClassroomTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Classroom code copied!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      const result = await createClassroom(name, description, subject, grade);
      if (!result.success) {
        setError(result.error || "Failed to create classroom.");
        return;
      }

      toast.success("Classroom created successfully!");
      setIsOpen(false);
      // Reset form
      setName("");
      setDescription("");
      setSubject("");
      setGrade("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = (classroomId: string, className: string) => {
    setDeleteClassroomTarget({ id: classroomId, name: className });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header and Creation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <School className="size-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              My Classrooms
            </h1>
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Manage your classrooms, create new ones, and review enrollment requests.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger
            render={
              <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-5 shadow-sm text-xs shrink-0 self-start sm:self-auto">
                <Plus className="mr-1 h-3.5 w-3.5" data-icon="inline-start" />
                Create Class
              </Button>
            }
          />

          <DialogContent className="max-w-md rounded-[24px] p-0 overflow-hidden dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
            <DialogHeader className="border-b border-slate-200 dark:border-slate-800 px-6 pt-6 pb-4">
              <DialogTitle className="text-lg font-black text-slate-950 dark:text-white tracking-tight">
                Create New Classroom
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                Set up a new space for your kids to learn together.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-5 px-6 pb-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="className"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                >
                  Classroom Name*
                </Label>
                <Input
                  id="className"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Science Explorers"
                  required
                  className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-850 dark:text-white h-11 focus:border-indigo-500 focus:ring-0 text-sm font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="classDesc"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                >
                  Description
                </Label>
                <Input
                  id="classDesc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Hands-on physics & chemistry activities"
                  className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-850 dark:text-white h-11 focus:border-indigo-500 focus:ring-0 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="classSubject"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                  >
                    Subject
                  </Label>
                  <Input
                    id="classSubject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Science"
                    className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-850 dark:text-white h-11 focus:border-indigo-500 focus:ring-0 text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="classGrade"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                  >
                    Grade / Level
                  </Label>
                  <Input
                    id="classGrade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g. Grade 5"
                    className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-850 dark:text-white h-11 focus:border-indigo-500 focus:ring-0 text-sm font-medium"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-bold text-rose-600 dark:border-rose-950/20 dark:bg-rose-950/30 dark:text-rose-400">
                  {error}
                </div>
              )}

              <DialogFooter className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-4 -mx-6 -mb-6 flex gap-2 rounded-b-[24px]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isLoading}
                  loadingText="Creating..."
                  className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                >
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={deleteClassroomTarget !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteClassroomTarget(null);
          }}
        >
          <AlertDialogContent className="sm:max-w-[400px] rounded-[24px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-black text-slate-900 dark:text-white">
                Delete Classroom?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-slate-500 dark:text-slate-400 pt-2 font-medium">
                Are you sure you want to delete classroom &ldquo;{deleteClassroomTarget?.name}
                &rdquo;?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 pt-4">
              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                loading={isLoading}
                loadingText="Deleting..."
                onClick={async () => {
                  if (!deleteClassroomTarget) return;
                  const target = deleteClassroomTarget;
                  setDeleteClassroomTarget(null);
                  try {
                    setIsLoading(true);
                    const result = await deleteClassroom(target.id);
                    if (result.success) {
                      toast.success(`Classroom "${target.name}" deleted.`);
                    } else {
                      toast.error(result.error || "Failed to delete classroom.");
                    }
                  } catch {
                    toast.error("Failed to delete classroom.");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm font-bold px-5"
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Grid of Classrooms */}
      {classrooms.length === 0 ? (
        <Card className="rounded-[32px] border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <CardContent className="space-y-4 p-0 max-w-sm mx-auto flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-500 dark:text-indigo-400">
              <School className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                No active classrooms yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                Start building your learning community by creating your first classroom. Share the
                code with students to start learning!
              </p>
            </div>
            <Button
              onClick={() => setIsOpen(true)}
              className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" data-icon="inline-start" />
              Create Classroom
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((cls) => {
            const studentCount = cls.students_count || 0;
            const assignmentCount = cls.assignments_count || 0;
            const resourceCount = cls.resources_count || 0;
            const announcementCount = cls.announcements_count || 0;

            return (
              <Card
                key={cls.id}
                className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md hover:border-indigo-200/80 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
              >
                {/* Visual indicator top border */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-sky-500" />

                <CardContent className="p-6 md:p-7 pt-8 flex flex-col gap-5 h-full justify-between">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex gap-1.5 flex-wrap">
                          {cls.grade && (
                            <Badge
                              variant="secondary"
                              className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-none font-bold text-[9px] uppercase px-2 py-0.5 rounded-md"
                            >
                              {cls.grade}
                            </Badge>
                          )}
                          {cls.subject && (
                            <Badge
                              variant="secondary"
                              className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-none font-bold text-[9px] uppercase px-2 py-0.5 rounded-md"
                            >
                              {cls.subject}
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                          <Link
                            href={`/dashboard/teacher/classrooms/${cls.id}`}
                            onClick={() => {
                              // Track access in client storage
                              try {
                                const stored = localStorage.getItem("teacher_recent_classrooms");
                                let ids: string[] = stored ? JSON.parse(stored) : [];
                                ids = [cls.id, ...ids.filter((id) => id !== cls.id)].slice(0, 8);
                                localStorage.setItem(
                                  "teacher_recent_classrooms",
                                  JSON.stringify(ids)
                                );
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="hover:text-indigo-650 transition-colors"
                          >
                            {cls.name}
                          </Link>
                        </h4>
                        {cls.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed line-clamp-2">
                            {cls.description}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteClass(cls.id, cls.name)}
                        className="h-8 w-8 rounded-full p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Roster & Workspace Metrics Counters Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-center">
                        <span className="text-xl font-black text-slate-900 dark:text-white block">
                          {studentCount}
                        </span>
                        <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                          Students
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-center">
                        <span className="text-xl font-black text-slate-900 dark:text-white block">
                          {assignmentCount}
                        </span>
                        <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                          Assignments
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-center">
                        <span className="text-xl font-black text-slate-900 dark:text-white block">
                          {resourceCount}
                        </span>
                        <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                          Resources
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-center">
                        <span className="text-xl font-black text-slate-900 dark:text-white block">
                          {announcementCount}
                        </span>
                        <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                          Announcements
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-1">
                    {/* Share Code Utility */}
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-3 gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          Class Code
                        </span>
                        <p className="text-md font-black text-slate-900 dark:text-white tracking-widest font-mono truncate">
                          {cls.class_code}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyCode(cls.class_code)}
                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 font-bold text-[10px] h-8 px-2.5 shadow-xs shrink-0"
                      >
                        {copiedCode === cls.class_code ? (
                          <>
                            <CheckIcon
                              className="h-3.5 w-3.5 text-emerald-600 mr-1"
                              data-icon="inline-start"
                            />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon
                              className="h-3.5 w-3.5 text-indigo-650 dark:text-indigo-400 mr-1"
                              data-icon="inline-start"
                            />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Open Classroom Workspace Button */}
                    {/* Open Classroom Workspace Link */}
                    <Link
                      href={`/dashboard/teacher/classrooms/${cls.id}`}
                      onClick={() => {
                        // Track access in client storage
                        try {
                          const stored = localStorage.getItem("teacher_recent_classrooms");
                          let ids: string[] = stored ? JSON.parse(stored) : [];
                          ids = [cls.id, ...ids.filter((id) => id !== cls.id)].slice(0, 8);
                          localStorage.setItem("teacher_recent_classrooms", JSON.stringify(ids));
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold h-11 flex items-center justify-center text-sm transition-colors"
                    >
                      Open Workspace
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
