import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getTeacherClassroomWorkspace } from "@/lib/services/kid/classroom.actions";
import type { TeacherWorkspaceData } from "@/types/classroom.types";
import TeacherClassroomWorkspaceClient from "@/components/teacher/classrooms/TeacherClassroomWorkspaceClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function WorkspaceSkeleton() {
  return (
    <div className="mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-24 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Card className="rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 bg-slate-100/50 dark:bg-slate-900/50 p-6 shadow-sm">
        <CardContent className="p-0 space-y-4">
          <div className="flex gap-4 border-b pb-4">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32 rounded-[28px]" />
            <Skeleton className="h-32 rounded-[28px]" />
            <Skeleton className="h-32 rounded-[28px]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function WorkspaceLoader({ classroomId }: { classroomId: string }) {
  const result = await getTeacherClassroomWorkspace(classroomId);

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

  const { classroom, assignments, resources, announcements, students } =
    result.data as TeacherWorkspaceData;

  return (
    <TeacherClassroomWorkspaceClient
      classroomId={classroomId}
      initialClassroom={classroom}
      initialAssignments={assignments}
      initialResources={resources}
      initialAnnouncements={announcements}
      initialStudents={students}
    />
  );
}

export default async function TeacherClassroomDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await checkDashboardAccess(["teacher"]);
  const resolvedParams = await params;
  const classroomId = resolvedParams.id;

  return (
    <main className="min-h-full text-slate-900 dark:text-slate-50">
      <Suspense fallback={<WorkspaceSkeleton />}>
        <WorkspaceLoader classroomId={classroomId} />
      </Suspense>
    </main>
  );
}
