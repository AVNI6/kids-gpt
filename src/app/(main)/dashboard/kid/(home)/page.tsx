import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getKidComprehensiveDetails } from "@/lib/services/kid/dashboard.actions";
import { getPendingInvitations } from "@/lib/services/shared/invitations";

import KidStreakBanner from "@/components/kid/dashboard/KidStreakBanner";
import { GameHistory, NotificationsUpdates, PendingInvitations } from "@/components/kid/dashboard";

export default async function KidDashboardPage() {
  await checkDashboardAccess(["kid"]);
  const details = await getKidComprehensiveDetails();
  const invitations = await getPendingInvitations();

  return (
    <main className="min-h-full bg-background px-4 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8 dark:text-slate-50">
      <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-6">
        <KidStreakBanner />

        {invitations.length > 0 && <PendingInvitations initialInvitations={invitations} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-full">
            <GameHistory timeline={details.timeline} />
          </div>

          <div className="h-full">
            <NotificationsUpdates />
          </div>
        </div>
      </div>
    </main>
  );
}
