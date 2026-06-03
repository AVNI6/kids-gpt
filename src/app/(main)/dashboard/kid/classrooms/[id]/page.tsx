import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getStudentClassroomWorkspace } from "@/actions/classroom.actions";
import type { StudentWorkspaceData } from "@/types/classroom.types";
import KidClassroomWorkspaceClient from "@/components/dashboard/kid/KidClassroomWorkspaceClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function WorkspaceSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-24 rounded-full bg-slate-200" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-48 bg-slate-200" />
          <Skeleton className="h-4 w-32 bg-slate-200" />
        </div>
      </div>
      <Card className="rounded-[32px] border-0 bg-slate-100/50 p-6 shadow-sm">
        <CardContent className="p-0 space-y-4">
          <div className="flex gap-4 border-b pb-4">
            <Skeleton className="h-8 w-24 bg-slate-200 rounded-md" />
            <Skeleton className="h-8 w-24 bg-slate-200 rounded-md" />
            <Skeleton className="h-8 w-24 bg-slate-200 rounded-md" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32 rounded-[28px] bg-slate-200" />
            <Skeleton className="h-32 rounded-[28px] bg-slate-200" />
            <Skeleton className="h-32 rounded-[28px] bg-slate-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function StudentWorkspaceLoader({ classroomId }: { classroomId: string }) {
  const result = await getStudentClassroomWorkspace(classroomId);

  if (!result.success || !result.data) {
    return (
      <Card className="rounded-[32px] border-rose-100 bg-rose-50/20 p-8 text-center">
        <CardContent className="space-y-4 p-0">
          <h2 className="text-xl font-black text-rose-700">Failed to load classroom</h2>
          <p className="text-sm text-slate-500 font-semibold max-w-md mx-auto">
            {result.error ||
              "You are not an approved member of this classroom or it has been deleted."}
          </p>
          <Link
            href="/dashboard/kid"
            className={cn(
              buttonVariants({ variant: "default" }),
              "rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 shadow-sm flex items-center justify-center"
            )}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </CardContent>
      </Card>
    );
  }

  const { assignments, resources, announcements } = result.data as StudentWorkspaceData;

  return (
    <KidClassroomWorkspaceClient
      classroomId={classroomId}
      initialAssignments={assignments}
      initialResources={resources}
      initialAnnouncements={announcements}
    />
  );
}

export default async function KidClassroomDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await checkDashboardAccess(["kid"]);
  const resolvedParams = await params;
  const classroomId = resolvedParams.id;

  return (
    <main className="min-h-full bg-linear-to-br from-sky-50 via-white to-emerald-50 px-4 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-50">
      <Suspense fallback={<WorkspaceSkeleton />}>
        <StudentWorkspaceLoader classroomId={classroomId} />
      </Suspense>
    </main>
  );
}
