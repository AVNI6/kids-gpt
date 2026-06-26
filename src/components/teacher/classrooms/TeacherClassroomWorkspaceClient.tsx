"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSearchParams } from "next/navigation";
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
  getTeacherClassroomAssignments,
  getTeacherClassroomResources,
  getTeacherClassroomAnnouncements,
  getTeacherClassroomStudents,
} from "@/lib/services/kid/classroom.actions";
import { TabContentSkeleton } from "@/components/shared/skeletonLoading";

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
  initialAssignments: ClassroomAssignment[] | null;
  initialResources: ClassroomResource[] | null;
  initialAnnouncements: ClassroomAnnouncement[] | null;
  initialStudents: WorkspaceStudent[] | null;
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

  // Local state for instant tab switching
  const [activeTabState, setActiveTabState] = useState<
    "assignments" | "resources" | "announcements" | "students"
  >(() => {
    const tab = searchParams?.get("tab");
    if (tab === "resources" || tab === "announcements" || tab === "students") {
      return tab;
    }
    return "assignments";
  });

  // Lists state
  const [classroom] = useState(initialClassroom);
  const [assignments, setAssignments] = useState<ClassroomAssignment[] | null>(initialAssignments);
  const [resources, setResources] = useState<ClassroomResource[] | null>(initialResources);
  const [announcements, setAnnouncements] = useState<ClassroomAnnouncement[] | null>(
    initialAnnouncements
  );
  const [students, setStudents] = useState<WorkspaceStudent[] | null>(initialStudents);
  const fetchingRefs = useRef({
    assignments: false,
    resources: false,
    announcements: false,
    students: false,
  });

  const loadAssignments = useCallback(
    async (force = false) => {
      if (assignments && !force) return;
      if (fetchingRefs.current.assignments) return;
      fetchingRefs.current.assignments = true;
      try {
        const result = await getTeacherClassroomAssignments(classroomId);
        if (result.success && result.data) {
          setAssignments(result.data);
        } else {
          toast.error(result.error || "Failed to load assignments.");
        }
      } catch {
        toast.error("Failed to load assignments.");
      } finally {
        fetchingRefs.current.assignments = false;
      }
    },
    [assignments, classroomId]
  );

  const loadResources = useCallback(
    async (force = false) => {
      if (resources && !force) return;
      if (fetchingRefs.current.resources) return;
      fetchingRefs.current.resources = true;
      try {
        const result = await getTeacherClassroomResources(classroomId);
        if (result.success && result.data) {
          setResources(result.data);
        } else {
          toast.error(result.error || "Failed to load resources.");
        }
      } catch {
        toast.error("Failed to load resources.");
      } finally {
        fetchingRefs.current.resources = false;
      }
    },
    [resources, classroomId]
  );

  const loadAnnouncements = useCallback(
    async (force = false) => {
      if (announcements && !force) return;
      if (fetchingRefs.current.announcements) return;
      fetchingRefs.current.announcements = true;
      try {
        const result = await getTeacherClassroomAnnouncements(classroomId);
        if (result.success && result.data) {
          setAnnouncements(result.data);
        } else {
          toast.error(result.error || "Failed to load announcements.");
        }
      } catch {
        toast.error("Failed to load announcements.");
      } finally {
        fetchingRefs.current.announcements = false;
      }
    },
    [announcements, classroomId]
  );

  const loadStudents = useCallback(
    async (force = false) => {
      if (students && !force) return;
      if (fetchingRefs.current.students) return;
      fetchingRefs.current.students = true;
      try {
        const result = await getTeacherClassroomStudents(classroomId);
        if (result.success && result.data) {
          setStudents(result.data);
        } else {
          toast.error(result.error || "Failed to load students.");
        }
      } catch {
        toast.error("Failed to load students.");
      } finally {
        fetchingRefs.current.students = false;
      }
    },
    [students, classroomId]
  );

  const loadFunctionsRef = useRef({
    loadAssignments,
    loadResources,
    loadAnnouncements,
    loadStudents,
  });

  useEffect(() => {
    loadFunctionsRef.current = {
      loadAssignments,
      loadResources,
      loadAnnouncements,
      loadStudents,
    };
  }, [loadAssignments, loadResources, loadAnnouncements, loadStudents]);

  const triggerAsyncLoad = useCallback(
    (tab: "assignments" | "resources" | "announcements" | "students") => {
      Promise.resolve().then(() => {
        const {
          loadAssignments: fnAssignments,
          loadResources: fnResources,
          loadAnnouncements: fnAnnouncements,
          loadStudents: fnStudents,
        } = loadFunctionsRef.current;

        if (tab === "assignments") {
          fnAssignments();
        } else if (tab === "resources") {
          fnResources();
        } else if (tab === "announcements") {
          fnAnnouncements();
        } else if (tab === "students") {
          fnStudents();
        }
      });
    },
    []
  );

  // Sync tab state on browser navigation (forward/back)
  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (
      tab &&
      (tab === "assignments" ||
        tab === "resources" ||
        tab === "announcements" ||
        tab === "students")
    ) {
      Promise.resolve().then(() => {
        setActiveTabState(tab);
        triggerAsyncLoad(tab);
      });
    }
  }, [searchParams, triggerAsyncLoad]);

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
        setAssignments((prev) =>
          prev
            ? prev.map((a) =>
                a.id === id
                  ? { ...a, status: "PUBLISHED" as const, published_at: new Date().toISOString() }
                  : a
              )
            : null
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
            setAssignments((prev) => (prev ? prev.filter((a) => a.id !== id) : null));
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
            setResources((prev) => (prev ? prev.filter((r) => r.id !== id) : null));
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
            setAnnouncements((prev) => (prev ? prev.filter((a) => a.id !== id) : null));
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
      value={activeTabState}
      onValueChange={(val) => {
        const nextTab = val as "assignments" | "resources" | "announcements" | "students";
        setActiveTabState(nextTab);
        const newUrl = `/dashboard/teacher/classrooms/${classroomId}?tab=${val}`;
        window.history.replaceState(
          { ...window.history.state, as: newUrl, url: newUrl },
          "",
          newUrl
        );
        triggerAsyncLoad(nextTab);
      }}
      className="mx-auto w-full flex flex-col gap-6"
    >
      {/* 1. Header */}
      <div className="flex items-center element-gap">
        <Link
          href="/dashboard/teacher/classrooms"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "rounded-full h-10 w-10 p-0 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0"
          )}
        >
          <ArrowLeft className="icon-sm" />
        </Link>
        <div>
          <h1 className="text-page-title font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
            {classroom.name}
          </h1>
          <p className="text-body-xs sm:text-body-sm font-semibold text-slate-500 mt-0.5">
            {classroom.subject || "General"} • {classroom.grade || "No Grade Set"} • Class Code:{" "}
            <span className="font-bold font-mono tracking-wider">{classroom.class_code}</span>
          </p>
        </div>
      </div>

      {/* Tab Controls (driven by Next.js router query param/href via TabsList) */}
      <div className="w-full bg-muted dark:bg-slate-900 rounded-full px-1.5 overflow-hidden">
        <div className="overflow-x-auto overflow-y-hidden scrollbar-none w-full">
          <TabsList className="flex items-center h-auto! p-0 bg-transparent dark:bg-transparent rounded-none min-w-full my-1 w-max">
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
                  onClick={(e) => {
                    e.currentTarget.scrollIntoView({
                      behavior: "smooth",
                      block: "nearest",
                      inline: "center",
                    });
                  }}
                  className="flex-1 rounded-full font-bold text-body-sm sm:text-body-md flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 cursor-pointer py-2 sm:py-3 data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:bg-input/50 whitespace-nowrap shrink-0 border-none bg-transparent text-muted-foreground hover:text-foreground transition-all shadow-none data-[state=active]:shadow-sm"
                >
                  <Icon className="icon-sm shrink-0" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </div>

      {/* 2. Workspace Tabs Viewports */}
      <TabsContent value="assignments" className="mt-0 outline-none">
        {assignments === null ? (
          <TabContentSkeleton />
        ) : (
          <ClassroomAssignmentsTab
            classroomId={classroomId}
            assignments={assignments}
            setAssignments={
              setAssignments as React.Dispatch<React.SetStateAction<ClassroomAssignment[]>>
            }
            handlePublishAssignment={handlePublishAssignment}
            handleDeleteAssignment={handleDeleteAssignment}
            handleOpenGrading={handleOpenGrading}
            publishingAssignmentId={publishingAssignmentId}
          />
        )}
      </TabsContent>

      <TabsContent value="resources" className="mt-0 outline-none">
        {resources === null ? (
          <TabContentSkeleton />
        ) : (
          <ClassroomResourcesTab
            classroomId={classroomId}
            resources={resources}
            setResources={setResources as React.Dispatch<React.SetStateAction<ClassroomResource[]>>}
            handleDeleteResource={handleDeleteResource}
          />
        )}
      </TabsContent>

      <TabsContent value="announcements" className="mt-0 outline-none">
        {announcements === null ? (
          <TabContentSkeleton />
        ) : (
          <ClassroomAnnouncementsTab
            classroomId={classroomId}
            announcements={announcements}
            setAnnouncements={
              setAnnouncements as React.Dispatch<React.SetStateAction<ClassroomAnnouncement[]>>
            }
            handleDeleteAnnouncement={handleDeleteAnnouncement}
          />
        )}
      </TabsContent>

      <TabsContent value="students" className="mt-0 outline-none">
        {students === null ? (
          <TabContentSkeleton />
        ) : (
          <ClassroomStudentsTab students={students} getInitials={getInitials} />
        )}
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
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && !isConfirming && closeConfirm()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirm} disabled={isConfirming}>
              Cancel
            </AlertDialogCancel>
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
