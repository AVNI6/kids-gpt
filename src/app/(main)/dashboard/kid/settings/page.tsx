import { Suspense } from "react";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getCurrentDashboardProfile } from "@/lib/services/kid/dashboard.actions";
import KidSettingsContainer from "@/components/kid/settings/KidSettingsContainer";
import { ProfileSettingsSkeleton } from "@/components/shared/skeletonLoading";

async function SettingsContent() {
  await checkDashboardAccess(["kid"]);
  const profile = await getCurrentDashboardProfile();

  if (!profile) {
    return (
      <div className="p-8 text-center font-bold text-slate-500">
        Profile not found. Please complete onboarding.
      </div>
    );
  }

  return <KidSettingsContainer profile={profile} />;
}

export default function KidSettingsPage() {
  return (
    <main>
      <div className="max-w-400">
        <Suspense fallback={<ProfileSettingsSkeleton />}>
          <SettingsContent />
        </Suspense>
      </div>
    </main>
  );
}
