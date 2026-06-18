import { Suspense } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getKidComprehensiveDetails } from "@/lib/services/kid/dashboard.actions";

import KidStreakBanner from "@/components/kid/dashboard/KidStreakBanner";
import {
  GameHistory,
  GameHistorySkeleton,
  NotificationsUpdates,
  NotificationsUpdatesSkeleton,
} from "@/components/kid/dashboard";

function KidStreakBannerSkeleton() {
  return (
    <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm">
      <CardContent className="flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-3xl" />
          <div className="space-y-3">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px]">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function KidDashboardPage() {
  await checkDashboardAccess(["kid"]);
  const details = await getKidComprehensiveDetails();

  return (
    <main className="min-h-full bg-background px-4 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8 dark:text-slate-50">
      <div className="flex flex-col gap-6">
        <Suspense fallback={<KidStreakBannerSkeleton />}>
          <KidStreakBanner />
        </Suspense>

        <div className="w-full">
          <Suspense fallback={<GameHistorySkeleton />}>
            <GameHistory timeline={details.timeline} />
          </Suspense>
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
