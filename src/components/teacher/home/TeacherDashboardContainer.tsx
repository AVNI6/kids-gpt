"use client";

import { useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";
import TeacherHeroBanner from "@/components/teacher/home/TeacherHeroBanner";
import TeacherMetricsRow from "@/components/teacher/home/TeacherMetricsRow";
import TodaySnapshot from "@/components/teacher/home/TodaySnapshot";
import type { DashboardUserProfile } from "@/types/kid";
import type { Classroom, PendingEnrollmentRequest, ApprovedStudent } from "@/types/classroom.types";
import RecentClassrooms from "@/components/teacher/home/RecentClassrooms";

type Metrics = {
  activeClassrooms: number;
  enrolledStudents: number;
  publishedAssignments: number;
  pendingGrading: number;
  resourcesUploaded: number;
  announcementsPosted: number;
};

type Snapshot = {
  activeStudentsToday: number;
  assignmentsSubmittedToday: number;
  assignmentsGradedToday: number;
  announcementsPostedToday: number;
};

type Props = {
  profile: DashboardUserProfile;
  classrooms: Classroom[];
  pendingRequests: PendingEnrollmentRequest[];
  students: ApprovedStudent[];
  metrics: Metrics;
  snapshot: Snapshot;
};

export default function TeacherDashboardContainer({
  profile,
  classrooms,
  pendingRequests,
  students,
  metrics,
  snapshot,
}: Props) {
  const router = useRouter();

  const handleInboxClick = () => {
    router.push("/dashboard/teacher/classrooms");
  };

  const handleCreateClick = () => {
    router.push("/dashboard/teacher/classrooms?create=true");
  };

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-900 dark:text-slate-100">
      <TeacherHeroBanner
        profile={profile}
        totalClassrooms={classrooms.length}
        totalStudents={students.length}
        pendingRequests={pendingRequests.length}
        pendingReviews={metrics.pendingGrading}
        onCreateClick={handleCreateClick}
        onInboxClick={handleInboxClick}
      />

      <div className="flex flex-col gap-6">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <BarChart3 className="size-4 text-indigo-500 shrink-0" />
          Performance Overview
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold pl-6">
          Cumulative classroom activity, published content, and grading status across all your
          classes.
        </p>
        <TeacherMetricsRow metrics={metrics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <RecentClassrooms classrooms={classrooms} />
        <TodaySnapshot snapshot={snapshot} />
      </div>
    </div>
  );
}
