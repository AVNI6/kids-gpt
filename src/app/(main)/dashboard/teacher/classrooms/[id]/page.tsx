import { Suspense, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import {
  getTeacherClassroomMetadata,
  getTeacherClassroomAssignments,
  getTeacherClassroomResources,
  getTeacherClassroomAnnouncements,
  getTeacherClassroomStudents,
} from "@/lib/services/kid/classroom.actions";
import TeacherClassroomWorkspaceClient from "@/components/teacher/classrooms/TeacherClassroomWorkspaceClient";
import { ClassroomWorkspaceSkeleton } from "@/components/shared/skeletonLoading";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type {
  ClassroomAssignment,
  ClassroomResource,
  ClassroomAnnouncement,
  WorkspaceStudent,
} from "@/types/classroom.types";

async function WorkspaceLoader({
  classroomId,
  searchParams,
}: {
  classroomId: string;
  searchParams: Promise<{ tab?: string }>;
}) {
  await checkDashboardAccess(["teacher"]);
  const resolvedSearchParams = await searchParams;
  const tab = resolvedSearchParams.tab || "assignments";

  const result = await getTeacherClassroomMetadata(classroomId);

  if (!result.success || !result.data) {
    return (
      <Card className="rounded-[32px] border-rose-100 bg-rose-50/20 p-8 text-center">
        <CardContent className="space-y-4 p-0">
          <h2 className="text-xl font-black text-rose-700">Failed to load classroom</h2>
          <p className="text-sm text-slate-500 font-semibold max-w-md mx-auto">
            {result.error ||
              "The classroom you are looking for does not exist or you do not have permission to view it."}
          </p>
          <Link
            href="/dashboard/teacher/classrooms"
            className={cn(
              buttonVariants({ variant: "default" }),
              "rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 shadow-sm flex items-center justify-center"
            )}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Classrooms
          </Link>
        </CardContent>
      </Card>
    );
  }

  const classroom = result.data;

  let initialAssignments: ClassroomAssignment[] | null = null;
  let initialResources: ClassroomResource[] | null = null;
  let initialAnnouncements: ClassroomAnnouncement[] | null = null;
  let initialStudents: WorkspaceStudent[] | null = null;

  if (tab === "assignments") {
    const res = await getTeacherClassroomAssignments(classroomId);
    if (res.success && res.data) initialAssignments = res.data;
  } else if (tab === "resources") {
    const res = await getTeacherClassroomResources(classroomId);
    if (res.success && res.data) initialResources = res.data;
  } else if (tab === "announcements") {
    const res = await getTeacherClassroomAnnouncements(classroomId);
    if (res.success && res.data) initialAnnouncements = res.data;
  } else if (tab === "students") {
    const res = await getTeacherClassroomStudents(classroomId);
    if (res.success && res.data) initialStudents = res.data;
  }

  return (
    <TeacherClassroomWorkspaceClient
      classroomId={classroomId}
      initialClassroom={classroom}
      initialAssignments={initialAssignments}
      initialResources={initialResources}
      initialAnnouncements={initialAnnouncements}
      initialStudents={initialStudents}
    />
  );
}

export default function TeacherClassroomDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const resolvedParams = use(params);
  const classroomId = resolvedParams.id;

  return (
    <main className="min-h-full bg-background text-slate-900 dark:text-slate-50">
      <Suspense fallback={<ClassroomWorkspaceSkeleton />}>
        <WorkspaceLoader classroomId={classroomId} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
