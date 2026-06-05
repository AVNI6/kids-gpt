"use client";

import { useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";
import TeacherHeroBanner from "./TeacherHeroBanner";
import TeacherMetricsRow from "./TeacherMetricsRow";
import TodaySnapshot from "./TodaySnapshot";
import TeacherTopNav from "./TeacherTopNav";
import type { DashboardUserProfile } from "@/types/kid";
import type { Classroom, PendingEnrollmentRequest, ApprovedStudent } from "@/types/classroom.types";
import RecentClassrooms from "./RecentClassrooms";

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
      {/* ─────────────────────────────────────────────────
          SECTION A — Teacher Account Hub
          Mirrors Parent Dashboard "Parent Settings & Account Hub" bar.
      ───────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-black/30 p-6 md:p-8 rounded-[32px] border border-slate-200/60 dark:border-slate-800/60 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span>Teacher Settings &amp; Account Hub</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
            Manage your educator profile, school organization settings, and class setup.
          </p>
        </div>
        <TeacherTopNav profile={profile} />
      </div>

      {/* ─────────────────────────────────────────────────
          SECTION B — Teacher Workspace Hero
          Welcome banner with dynamic status + CTAs.
      ───────────────────────────────────────────────── */}
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
