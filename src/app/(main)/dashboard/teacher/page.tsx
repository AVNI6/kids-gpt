import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getCurrentDashboardProfile } from "@/actions/dashboard.actions";
import TeacherStatsOverview from "@/components/dashboard/teacher/TeacherStatsOverview";
import ActivityCompletionBoard from "@/components/dashboard/teacher/ActivityCompletionBoard";
import RecentResourcesGrid from "@/components/dashboard/teacher/RecentResourcesGrid";
import ClassInsightsCard from "@/components/dashboard/teacher/ClassInsightsCard";
import ActiveStudentsList from "@/components/dashboard/teacher/ActiveStudentsList";
import TeacherProfileManager from "@/components/dashboard/teacher/TeacherProfileManager";

function StatsOverviewSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="rounded-[28px] border-sky-100 bg-white shadow-sm">
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-5 w-32 bg-slate-100" />
            <Skeleton className="h-8 w-24 bg-slate-100" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ActivityBoardSkeleton() {
  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-6 w-40 bg-slate-100" />
        <div className="flex items-end justify-around gap-3 h-32">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-12 h-24 rounded bg-slate-100" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ResourcesGridSkeleton() {
  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-6 w-40 bg-slate-100" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl bg-slate-100" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InsightsSkeleton() {
  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-32 rounded-2xl bg-slate-100" />
      </CardContent>
    </Card>
  );
}

function StudentListSkeleton() {
  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-6 w-40 bg-slate-100" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl bg-slate-100" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function TeacherDashboardPage() {
  await checkDashboardAccess(["teacher"]);
  const profile = await getCurrentDashboardProfile();

  return (
    <main className="min-h-full bg-linear-to-br from-sky-50 via-white to-emerald-50 px-4 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Main Header */}
        <div>
          <h1 className="text-3xl font-black text-slate-900">Class Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">5 Students • Last updated 2 hours ago</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Suspense fallback={<StudentListSkeleton />}>
            <TeacherProfileManager profile={profile} />
          </Suspense>

          <Suspense fallback={<StudentListSkeleton />}>
            <ActiveStudentsList />
          </Suspense>
        </div>

        {/* 2-Column Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left/Center Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Overview */}
            <Suspense fallback={<StatsOverviewSkeleton />}>
              <TeacherStatsOverview />
            </Suspense>

            {/* Activity Completion Board */}
            <Suspense fallback={<ActivityBoardSkeleton />}>
              <ActivityCompletionBoard />
            </Suspense>

            {/* Recent Resources Grid */}
            <Suspense fallback={<ResourcesGridSkeleton />}>
              <RecentResourcesGrid />
            </Suspense>
          </div>

          {/* Right Column (1/3 width) */}
          <div className="space-y-6">
            {/* Class Insights */}
            <Suspense fallback={<InsightsSkeleton />}>
              <ClassInsightsCard />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
