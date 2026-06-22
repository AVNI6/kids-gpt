import { Suspense } from "react";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getCurrentDashboardProfile } from "@/lib/services/kid/dashboard.actions";
import TeacherSettingsContainer from "@/components/teacher/settings/TeacherSettingsContainer";
import { ProfileSettingsSkeleton } from "@/components/shared/skeletonLoading";

async function SettingsContent() {
  await checkDashboardAccess(["teacher"]);
  const profile = await getCurrentDashboardProfile();

  if (!profile) {
    return (
      <div className="p-8 text-center font-bold text-slate-500">
        Profile not found. Please complete onboarding.
      </div>
    );
  }

  return <TeacherSettingsContainer profile={profile} />;
}

export default function TeacherSettingsPage() {
  return (
    <main>
      <div>
        <Suspense fallback={<ProfileSettingsSkeleton />}>
          <SettingsContent />
        </Suspense>
      </div>
    </main>
  );
}
