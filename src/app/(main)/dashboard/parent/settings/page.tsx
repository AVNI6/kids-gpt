import { Suspense } from "react";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import { getCurrentDashboardProfile } from "@/lib/services/parent/parent-dashboard.actions";
import ParentSettingsContainer from "@/components/parent/settings/ParentSettingsContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function SettingsSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-40 bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-4 w-80 bg-slate-200 dark:bg-slate-800" />
      </div>

      <Skeleton className="h-12 w-full rounded-2xl bg-slate-100 dark:bg-slate-900" />

      <Card className="rounded-[32px] border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 p-8 shadow-sm">
        <CardContent className="p-0 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-24 bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-24 w-full rounded-3xl bg-slate-100 dark:bg-slate-900" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-900" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-900" />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/60">
            <Skeleton className="h-11 w-32 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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

export default async function ParentSettingsPage() {
  return (
    <main className="min-h-full bg-background text-slate-900 dark:text-slate-50 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-25 flex w-full flex-col gap-6">
        <Suspense fallback={<SettingsSkeleton />}>
          <SettingsContent />
        </Suspense>
      </div>
    </main>
  );
}
