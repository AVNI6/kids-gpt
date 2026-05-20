import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getCurrentDashboardProfile, getLinkedChildren } from "@/actions/dashboard.actions";
import ChildSelectorTabs from "@/components/dashboard/parent/ChildSelectorTabs";
import ChildOverviewCard from "@/components/dashboard/parent/ChildOverviewCard";
import DailyActivityStats from "@/components/dashboard/parent/DailyActivityStats";
import WeeklyProgressChart from "@/components/dashboard/parent/WeeklyProgressChart";
import SubjectProficiency from "@/components/dashboard/parent/SubjectProficiency";
import TeacherUpdates from "@/components/dashboard/parent/TeacherUpdates";
import ParentProfileManager from "@/components/dashboard/parent/ParentProfileManager";
import ParentControlsRow from "@/components/dashboard/parent/ParentControlsRow";

// ChildOverviewSkeleton removed (unused) to satisfy eslint no-unused-vars

function DailyActivitySkeleton() {
  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-6 w-40 bg-slate-100" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-2xl bg-slate-100" />
          <Skeleton className="h-24 rounded-2xl bg-slate-100" />
          <Skeleton className="h-24 rounded-2xl bg-slate-100" />
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyProgressSkeleton() {
  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-6 w-40 bg-slate-100" />
        <div className="flex items-end justify-around gap-2 h-32">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="w-8 h-24 rounded bg-slate-100" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SubjectProficiencySkeleton() {
  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-6 w-40 bg-slate-100" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-2xl bg-slate-100" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TeacherUpdatesSkeleton() {
  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-6 w-40 bg-slate-100" />
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-2xl bg-slate-100" />
          <Skeleton className="h-16 rounded-2xl bg-slate-100" />
        </div>
      </CardContent>
    </Card>
  );
}

function ControlsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Skeleton className="h-28 rounded-[24px] bg-slate-100" />
      <Skeleton className="h-28 rounded-[24px] bg-slate-100" />
      <Skeleton className="h-28 rounded-[24px] bg-slate-100" />
    </div>
  );
}

export default async function ParentDashboardPage() {
  await checkDashboardAccess(["parent"]);
  const profile = await getCurrentDashboardProfile();
  const linkedChildren = await getLinkedChildren();

  return (
    <main className="min-h-full bg-linear-to-br from-sky-50 via-white to-emerald-50 px-4 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Child Selector Tabs */}
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Suspense fallback={<ControlsSkeleton />}>
            <ParentProfileManager profile={profile} />
          </Suspense>

          <ChildSelectorTabs linkedChildren={linkedChildren} />
        </div>

        {/* Overview Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Child Overview */}
          <ChildOverviewCard linkedChildren={linkedChildren} />

          {/* Daily Activity Stats */}
          <Suspense fallback={<DailyActivitySkeleton />}>
            <DailyActivityStats />
          </Suspense>

          {/* Weekly Progress Chart */}
          <Suspense fallback={<WeeklyProgressSkeleton />}>
            <WeeklyProgressChart />
          </Suspense>
        </div>

        {/* Analytics Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Subject Proficiency */}
          <Suspense fallback={<SubjectProficiencySkeleton />}>
            <SubjectProficiency />
          </Suspense>

          {/* Teacher Updates */}
          <Suspense fallback={<TeacherUpdatesSkeleton />}>
            <TeacherUpdates />
          </Suspense>
        </div>

        {/* Parent Controls Row */}
        <Suspense fallback={<ControlsSkeleton />}>
          <ParentControlsRow />
        </Suspense>
      </div>
    </main>
  );
}
