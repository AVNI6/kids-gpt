import { Suspense } from "react";

import { Card, CardContent } from "@/components/shared/ui/card";
import { Skeleton } from "@/components/shared/ui/skeleton";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getKidComprehensiveDetails } from "@/lib/services/kid/dashboard.actions";

import KidProfileManager from "@/components/kid/profile/KidProfileManager";
import KidStreakBanner from "@/components/kid/dashboard/KidStreakBanner";

import {
  GameHistory,
  GameHistorySkeleton,
  NotificationsUpdates,
  NotificationsUpdatesSkeleton,
} from "@/components/kid/dashboard";

function KidStreakBannerSkeleton() {
  return (
    <Card className="rounded-[32px] border-amber-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-3xl bg-amber-100 dark:bg-slate-800" />
          <div className="space-y-3">
            <Skeleton className="h-7 w-48 bg-amber-100 dark:bg-slate-800" />
            <Skeleton className="h-4 w-72 bg-amber-100/80 dark:bg-slate-800/80" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px]">
          <Skeleton className="h-24 rounded-3xl bg-white/80 dark:bg-slate-950/80" />
          <Skeleton className="h-24 rounded-3xl bg-white/80 dark:bg-slate-950/80" />
        </div>
      </CardContent>
    </Card>
  );
}

function KidProfileManagerSkeleton() {
  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-3xl bg-slate-100 dark:bg-slate-800" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-36 bg-slate-100 dark:bg-slate-800" />
            <Skeleton className="h-4 w-28 bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          <Skeleton className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        </div>
        <Skeleton className="h-10 rounded-full bg-slate-100 dark:bg-slate-800" />
      </CardContent>
    </Card>
  );
}

export default async function KidDashboardPage() {
  await checkDashboardAccess(["kid"]);
  const details = await getKidComprehensiveDetails();

  return (
    <main className="min-h-full bg-linear-to-br from-sky-50 via-white to-emerald-50 px-4 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Suspense fallback={<KidStreakBannerSkeleton />}>
          <KidStreakBanner />
        </Suspense>

        <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.80fr)_minmax(0,1.4fr)]">
          <div className="space-y-6 flex flex-col">
            <Suspense fallback={<KidProfileManagerSkeleton />}>
              <KidProfileManager />
            </Suspense>
          </div>

          <div className="space-y-6 flex flex-col">
            <Suspense fallback={<GameHistorySkeleton />}>
              <GameHistory timeline={details.timeline} />
            </Suspense>
          </div>
        </div>

        <div className="w-full">
          <Suspense fallback={<NotificationsUpdatesSkeleton />}>
            <NotificationsUpdates />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
