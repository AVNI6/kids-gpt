import { Suspense } from "react";

import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getKidComprehensiveDetails } from "@/lib/services/kid/dashboard.actions";
import { KidStreakBannerSkeleton } from "@/components/shared/skeletonLoading";

import KidStreakBanner from "@/components/kid/dashboard/KidStreakBanner";
import {
  GameHistory,
  GameHistorySkeleton,
  NotificationsUpdates,
  NotificationsUpdatesSkeleton,
} from "@/components/kid/dashboard";

export default async function KidDashboardPage() {
  await checkDashboardAccess(["kid"]);
  const details = await getKidComprehensiveDetails();

  return (
    <main className="min-h-full bg-background px-4 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8 dark:text-slate-50">
      <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-6">
        <Suspense fallback={<KidStreakBannerSkeleton />}>
          <KidStreakBanner />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="h-full">
            <Suspense fallback={<GameHistorySkeleton />}>
              <GameHistory timeline={details.timeline} />
            </Suspense>
          </div>

          <div className="h-full">
            <Suspense fallback={<NotificationsUpdatesSkeleton />}>
              <NotificationsUpdates />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
