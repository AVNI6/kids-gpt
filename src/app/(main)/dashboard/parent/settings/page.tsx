import { Suspense } from "react";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getCurrentDashboardProfile } from "@/lib/services/kid/dashboard.actions";
import ParentSettingsContainer from "@/components/parent/settings/ParentSettingsContainer";
import { ProfileSettingsSkeleton } from "@/components/shared/skeletonLoading";

async function SettingsContent() {
  await checkDashboardAccess(["parent"]);
  const profile = await getCurrentDashboardProfile();

  if (!profile) {
    return (
      <div className="p-8 text-center font-bold text-slate-500">
        Profile not found. Please complete onboarding.
      </div>
    );
  }

  return <ParentSettingsContainer profile={profile} />;
}

export default function ParentSettingsPage() {
  return (
    <main>
      <div>
        <Suspense fallback={<ProfileSettingsSkeleton showExtraField={false} />}>
          <SettingsContent />
        </Suspense>
      </div>
    </main>
  );
}
