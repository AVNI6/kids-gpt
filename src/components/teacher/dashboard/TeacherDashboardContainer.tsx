"use client";

import { useState, useRef } from "react";
import { BarChart3, AlertTriangle, Activity, School } from "lucide-react";
import TeacherHeroBanner from "./TeacherHeroBanner";
import TeacherMetricsRow from "./TeacherMetricsRow";
import TodaySnapshot from "./TodaySnapshot";
import NeedsAttention from "./NeedsAttention";
import RecentClassrooms from "./RecentClassrooms";
import TeacherActivityFeed, { ActivityEvent } from "./TeacherActivityFeed";
import TeacherClassrooms from "./TeacherClassrooms";
import TeacherTopNav from "./TeacherTopNav";
import type { DashboardUserProfile } from "@/types/kid";
import type { Classroom, PendingEnrollmentRequest, ApprovedStudent } from "@/types/classroom.types";

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
  emptyAnnouncementClassroomsCount: number;
  activityEvents: ActivityEvent[];
};

/** Section divider with title and description — matches Parent dashboard visual rhythm */
function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <Icon className="size-4 text-indigo-500 shrink-0" />
        {title}
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold pl-6">{description}</p>
    </div>
  );
}

export default function TeacherDashboardContainer({
  profile,
  classrooms,
  pendingRequests,
  students,
  metrics,
  snapshot,
  emptyAnnouncementClassroomsCount,
  activityEvents,
}: Props) {
  const [createClassroomOpen, setCreateClassroomOpen] = useState(false);
  const needsAttentionRef = useRef<HTMLDivElement>(null);

  const handleInboxClick = () => {
    if (needsAttentionRef.current) {
      needsAttentionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-900 dark:text-slate-100">
      {/* ─────────────────────────────────────────────────
          SECTION A — Teacher Account Hub
          Mirrors Parent Dashboard "Parent Settings & Account Hub" bar.
      ───────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-black/30 p-6 md:p-8 rounded-[32px] border border-slate-200/60 dark:border-slate-800/60 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span>Teacher Settings &amp; Account Hub</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
            Manage your educator profile, school organization settings, and class setup.
          </p>
        </div>
        <TeacherTopNav profile={profile} onCreateClassroom={() => setCreateClassroomOpen(true)} />
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
        onCreateClick={() => setCreateClassroomOpen(true)}
        onInboxClick={handleInboxClick}
      />

      {/* ─────────────────────────────────────────────────
          SECTION C — Performance Overview
          Metrics row + Today's Snapshot grouped together.
      ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <SectionHeader
          icon={BarChart3}
          title="Performance Overview"
          description="Cumulative classroom activity, published content, and grading status across all your classes."
        />
        <TeacherMetricsRow metrics={metrics} />
        <TodaySnapshot snapshot={snapshot} />
      </div>

      {/* ─────────────────────────────────────────────────
          SECTION D — Action Center
          Items that require immediate teacher attention.
      ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6" ref={needsAttentionRef}>
        <SectionHeader
          icon={AlertTriangle}
          title="Action Center"
          description="Pending enrollment requests, submissions awaiting grading, and silent classrooms that need attention."
        />
        <NeedsAttention
          pendingRequests={pendingRequests}
          pendingGrading={metrics.pendingGrading}
          emptyAnnouncementClassroomsCount={emptyAnnouncementClassroomsCount}
        />
      </div>

      {/* ─────────────────────────────────────────────────
          SECTION E — Teaching Activity
          Quick classroom access + live educational event feed.
      ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <SectionHeader
          icon={Activity}
          title="Teaching Activity"
          description="Quick access to recent classrooms and a live feed of educational events across your classes."
        />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
          <RecentClassrooms classrooms={classrooms} />
          <TeacherActivityFeed activityEvents={activityEvents} />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────
          SECTION F — Classroom Management
          Full classroom grid with create, edit, delete flows.
      ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <SectionHeader
          icon={School}
          title="Classroom Management"
          description="View all your classrooms, manage student enrollment, and open individual classroom workspaces."
        />
        <TeacherClassrooms
          classrooms={classrooms}
          createOpen={createClassroomOpen}
          setCreateOpen={setCreateClassroomOpen}
        />
      </div>
    </div>
  );
}
