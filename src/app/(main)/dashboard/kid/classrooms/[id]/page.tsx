import { Suspense, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import {
  getStudentClassroomMetadata,
  getStudentClassroomAssignments,
  getStudentClassroomAnnouncements,
} from "@/lib/services/kid/classroom.actions";
import { ClassroomWorkspaceSkeleton } from "@/components/shared/skeletonLoading";
import KidClassroomWorkspaceClient from "@/components/kid/dashboard/KidClassroomWorkspaceClient";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function StudentWorkspaceLoader({ classroomId }: { classroomId: string }) {
  await checkDashboardAccess(["kid"]);
  const metadataResult = await getStudentClassroomMetadata(classroomId);

  if (!metadataResult.success || !metadataResult.data) {
    return (
      <Card className="rounded-[32px] border-rose-100 bg-rose-50/20 p-8 text-center">
        <CardContent className="space-y-4 p-0">
          <h2 className="text-xl font-black text-rose-700">Failed to load classroom</h2>
          <p className="text-sm text-slate-500 font-semibold max-w-md mx-auto">
            {metadataResult.error ||
              "You are not an approved member of this classroom or it has been deleted."}
          </p>
          <Link
            href="/dashboard/kid/classrooms"
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

  const classroom = metadataResult.data;

  // Overview is the default tab. It requires assignments (for stats) and announcements (for latest announcement card).
  // Resources tab data is lazy-loaded on request.
  const [assignmentsRes, announcementsRes] = await Promise.all([
    getStudentClassroomAssignments(classroomId),
    getStudentClassroomAnnouncements(classroomId),
  ]);

  const assignments = assignmentsRes.success && assignmentsRes.data ? assignmentsRes.data : [];
  const announcements =
    announcementsRes.success && announcementsRes.data ? announcementsRes.data : [];

  return (
    <KidClassroomWorkspaceClient
      classroomId={classroomId}
      classroom={classroom}
      initialAssignments={assignments}
      initialAnnouncements={announcements}
      initialResources={null}
    />
  );
}

export default function KidClassroomDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const classroomId = resolvedParams.id;

  return (
    <main className="min-h-full bg-background px-4 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8 dark:text-slate-50">
      <Suspense fallback={<ClassroomWorkspaceSkeleton />}>
        <StudentWorkspaceLoader classroomId={classroomId} />
      </Suspense>
    </main>
  );
}
