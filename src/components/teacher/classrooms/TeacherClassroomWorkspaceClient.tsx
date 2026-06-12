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
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, FolderOpen, Megaphone, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
  };

  const closeConfirm = () => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  };

  // -------------------------------------------------------------------------
  // Shared Handlers
  // -------------------------------------------------------------------------

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

  const handleDeleteResource = async (id: string) => {
    toast.warning("Are you sure you want to delete this resource?", {
      action: {
        label: "Delete",
        onClick: async () => {
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
        },
      },
    });
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
    <div className="mx-auto w-full flex flex-col gap-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/teacher"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-full h-10 w-10 p-0 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 flex items-center justify-center"
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

        {/* Tab Controls (driven by Next.js router query param/href) */}
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
              <Link
                key={tab.id}
                href={`/dashboard/teacher/classrooms/${classroomId}?tab=${tab.id}`}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer select-none shrink-0 ${
                  active
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 2. Workspace Tabs Viewports */}
      {activeTab === "assignments" && (
        <ClassroomAssignmentsTab
          classroomId={classroomId}
          assignments={assignments}
          setAssignments={setAssignments}
          handlePublishAssignment={handlePublishAssignment}
          handleDeleteAssignment={handleDeleteAssignment}
          handleOpenGrading={handleOpenGrading}
        />
      )}

      {activeTab === "resources" && (
        <ClassroomResourcesTab
          classroomId={classroomId}
          resources={resources}
          setResources={setResources}
          handleDeleteResource={handleDeleteResource}
        />
      )}

      {activeTab === "announcements" && (
        <ClassroomAnnouncementsTab
          classroomId={classroomId}
          announcements={announcements}
          setAnnouncements={setAnnouncements}
          handleDeleteAnnouncement={handleDeleteAnnouncement}
        />
      )}

      {activeTab === "students" && (
        <ClassroomStudentsTab students={students} getInitials={getInitials} />
      )}

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
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && closeConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirm}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                closeConfirm();
                await confirmDialog.onConfirm();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
