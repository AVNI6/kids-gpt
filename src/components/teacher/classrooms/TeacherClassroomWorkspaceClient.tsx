"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { ArrowLeft, BookOpen, FolderOpen, Megaphone, Users } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  publishAssignment,
  deleteAssignment,
  deleteResource,
  deleteAnnouncement,
  getTeacherAssignmentOverview,
} from "@/lib/services/kid/classroom.actions";

import type {
  Classroom,
  ClassroomAssignment,
  ClassroomResource,
  ClassroomAnnouncement,
  WorkspaceStudent,
  TeacherAssignmentOverview,
} from "@/types/classroom.types";

import ClassroomAssignmentsTab from "./tabs/ClassroomAssignmentsTab";
import ClassroomResourcesTab from "./tabs/ClassroomResourcesTab";
import ClassroomAnnouncementsTab from "./tabs/ClassroomAnnouncementsTab";
import ClassroomStudentsTab from "./tabs/ClassroomStudentsTab";
import ClassroomGradingDialog from "./tabs/ClassroomGradingDialog";

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
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab is driven directly by URL query parameter (href) or defaults to assignments
  const activeTab = (searchParams?.get("tab") || "assignments") as
    | "assignments"
    | "resources"
    | "announcements"
    | "students";

  // Lists state
  const [classroom] = useState(initialClassroom);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [resources, setResources] = useState(initialResources);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [students] = useState(initialStudents);

  // Selected Assignment for grading dialog
  const [selectedAssignment, setSelectedAssignment] = useState<ClassroomAssignment | null>(null);
  const [assignmentOverview, setAssignmentOverview] = useState<TeacherAssignmentOverview | null>(
    null
  );
  const [gradingOpen, setGradingOpen] = useState(false);

  // Loading and Confirmation states
  const [publishingAssignmentId, setPublishingAssignmentId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Shared confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  });

  const openConfirm = (title: string, description: string, onConfirm: () => Promise<void>) => {
    setConfirmDialog({ open: true, title, description, onConfirm });
    setIsConfirming(false);
  };

  const closeConfirm = () => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
    setIsConfirming(false);
  };

  // -------------------------------------------------------------------------
  // Shared Handlers
  // -------------------------------------------------------------------------

  const handlePublishAssignment = async (id: string) => {
    try {
      setPublishingAssignmentId(id);
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
    } finally {
      setPublishingAssignmentId(null);
    }
  };

  const handleDeleteAssignment = (id: string, title: string) => {
    openConfirm(
      "Delete Assignment",
      `Are you sure you want to delete assignment "${title}"? This action cannot be undone.`,
      async () => {
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
      }
    );
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

  const handleDeleteResource = (id: string) => {
    openConfirm(
      "Delete Resource",
      "Are you sure you want to delete this resource? This action cannot be undone.",
      async () => {
        try {
          const result = await deleteResource(id);
          if (result.success) {
            toast.success("Resource deleted.");
            setResources((prev) => prev.filter((r) => r.id !== id));
          } else {
            toast.error(result.error || "Failed to delete resource.");
          }
        } catch {
          toast.error("Failed to delete resource.");
        }
      }
    );
  };

  const handleDeleteAnnouncement = (id: string) => {
    openConfirm(
      "Delete Announcement",
      "Are you sure you want to delete this announcement? This action cannot be undone.",
      async () => {
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
      }
    );
  };

  const getInitials = (first?: string | null, last?: string | null) => {
    return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.trim().toUpperCase() || "S";
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) =>
        router.push(`/dashboard/teacher/classrooms/${classroomId}?tab=${val}`, { scroll: false })
      }
      className="mx-auto w-full flex flex-col gap-6"
    >
      {/* 1. Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/teacher/classrooms"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "rounded-full h-10 w-10 p-0 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
            {classroom.name}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
            {classroom.subject || "General"} • {classroom.grade || "No Grade Set"} • Class Code:{" "}
            <span className="font-bold font-mono tracking-wider">{classroom.class_code}</span>
          </p>
        </div>
      </div>

      {/* Tab Controls (driven by Next.js router query param/href via TabsList) */}
      <div className="w-full bg-muted dark:bg-slate-900 rounded-full p-1 overflow-hidden">
        <div className="overflow-x-auto scrollbar-none w-full">
          <TabsList className="flex !h-auto p-0 bg-transparent dark:bg-transparent rounded-none min-w-full w-max">
            {[
              { id: "assignments", label: "Assignments", icon: BookOpen },
              { id: "resources", label: "Resources", icon: FolderOpen },
              { id: "announcements", label: "Announcements", icon: Megaphone },
              { id: "students", label: "Students", icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex-1 rounded-full font-bold text-xs sm:text-base flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 cursor-pointer py-2.5 sm:py-3.5 data-active:bg-background data-active:text-foreground dark:data-active:bg-input/50 whitespace-nowrap shrink-0 border-none bg-transparent text-muted-foreground hover:text-foreground transition-all"
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </div>

      {/* 2. Workspace Tabs Viewports */}
      <TabsContent value="assignments" className="mt-0 outline-none">
        <ClassroomAssignmentsTab
          classroomId={classroomId}
          assignments={assignments}
          setAssignments={setAssignments}
          handlePublishAssignment={handlePublishAssignment}
          handleDeleteAssignment={handleDeleteAssignment}
          handleOpenGrading={handleOpenGrading}
          publishingAssignmentId={publishingAssignmentId}
        />
      </TabsContent>

      <TabsContent value="resources" className="mt-0 outline-none">
        <ClassroomResourcesTab
          classroomId={classroomId}
          resources={resources}
          setResources={setResources}
          handleDeleteResource={handleDeleteResource}
        />
      </TabsContent>

      <TabsContent value="announcements" className="mt-0 outline-none">
        <ClassroomAnnouncementsTab
          classroomId={classroomId}
          announcements={announcements}
          setAnnouncements={setAnnouncements}
          handleDeleteAnnouncement={handleDeleteAnnouncement}
        />
      </TabsContent>

      <TabsContent value="students" className="mt-0 outline-none">
        <ClassroomStudentsTab students={students} getInitials={getInitials} />
      </TabsContent>

      {/* 3. Grading dialog */}
      <ClassroomGradingDialog
        selectedAssignment={selectedAssignment}
        gradingOpen={gradingOpen}
        setGradingOpen={setGradingOpen}
        assignmentOverview={assignmentOverview}
        setAssignmentOverview={setAssignmentOverview}
        getInitials={getInitials}
      />

      {/* 4. Shared Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && !isConfirming && closeConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirm} disabled={isConfirming}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              loading={isConfirming}
              loadingText="Deleting..."
              onClick={async () => {
                try {
                  setIsConfirming(true);
                  await confirmDialog.onConfirm();
                  closeConfirm();
                } catch {
                  // Handled by onConfirm toast messages
                } finally {
                  setIsConfirming(false);
                }
              }}
              className="cursor-pointer rounded-lg px-4"
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}
