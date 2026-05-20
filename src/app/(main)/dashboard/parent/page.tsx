import { Suspense } from "react";
import { checkDashboardAccess } from "@/lib/dashboard-auth";
import {
  getCurrentDashboardProfile,
  getLinkedChildren,
  getChildDetails,
  getChildSafetyAndUsage,
} from "@/actions/dashboard.actions";
import ParentTopNav from "@/components/dashboard/parent/ParentTopNav";
import WelcomeBanner from "@/components/dashboard/parent/sections/WelcomeBanner";
import ChildQuickOverview from "@/components/dashboard/parent/sections/ChildQuickOverview";
import MyChildrenManagement from "@/components/dashboard/parent/sections/MyChildrenManagement";
import LearningProgress from "@/components/dashboard/parent/sections/LearningProgress";
import TeacherReports from "@/components/dashboard/parent/sections/TeacherReports";
import ActivitiesGrid from "@/components/dashboard/parent/sections/ActivitiesGrid";
import ChildMonitoring from "@/components/dashboard/parent/sections/ChildMonitoring";
import NotificationsSection from "@/components/dashboard/parent/sections/NotificationsSection";
import SubscriptionSettings from "@/components/dashboard/parent/sections/SubscriptionSettings";
import ParentProfileManager from "@/components/dashboard/parent/ParentProfileManager";
import ChildSelectorTabs from "@/components/dashboard/parent/ChildSelectorTabs";
import type { ChildDetailsResult } from "@/types/dashboard.types";

export default async function ParentDashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await checkDashboardAccess(["parent"]);
  const profile = await getCurrentDashboardProfile();

  if (!profile) {
    return (
      <div className="p-8 text-center font-bold text-slate-500">
        Profile not found. Please complete onboarding.
      </div>
    );
  }

  const linkedChildren = await getLinkedChildren();

  // Await searchParams in Next 15
  const searchParams = await props.searchParams;
  const activeTab = (searchParams.tab as string) || "home";
  const childId = (searchParams.childId as string) || linkedChildren[0]?.user_id;
  const activeChild = linkedChildren.find((c) => c.user_id === childId) || linkedChildren[0];

  // Fetch active child data from Supabase
  let activeChildDetails = null;
  let activeChildSafety = null;

  if (activeChild) {
    try {
      activeChildDetails = await getChildDetails(activeChild.user_id);
      activeChildSafety = await getChildSafetyAndUsage(activeChild.user_id);
    } catch (err) {
      console.error("Error fetching child details:", err);
    }
  }

  // Fetch quick overview details for all children to display on home tab cards
  const childDetailsMap: Record<string, ChildDetailsResult> = {};
  for (const child of linkedChildren) {
    try {
      childDetailsMap[child.user_id] = await getChildDetails(child.user_id);
    } catch (err) {
      console.error(`Error fetching details for child ${child.user_id}:`, err);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col transition-colors duration-300">
      <Suspense
        fallback={
          <div className="h-16 w-full bg-white dark:bg-slate-950 border-b border-slate-200" />
        }
      >
        <ParentTopNav profile={profile} />
      </Suspense>

      <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Child Selector Tabs for child-specific tabs */}
        {activeTab !== "home" && activeTab !== "notifications" && linkedChildren.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900/60 p-4 rounded-[24px] border border-slate-200/60 dark:border-slate-800/60 shadow-sm backdrop-blur-md gap-3">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Viewing insights for:{" "}
              <strong className="text-slate-950 dark:text-white">{activeChild?.first_name}</strong>
            </span>
            <ChildSelectorTabs linkedChildren={linkedChildren} />
          </div>
        )}

        {activeTab === "home" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Parent Account Details and Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900/60 p-6 md:p-8 rounded-[32px] border border-slate-200/60 dark:border-slate-800/60 shadow-sm backdrop-blur-md">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Parent Settings & Account Hub</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                  Update your display profile, customize notifications, or link child accounts.
                </p>
              </div>
              <ParentProfileManager profile={profile} />
            </div>

            <WelcomeBanner
              profile={profile}
              linkedChildren={linkedChildren}
              activeChildDetails={activeChildDetails}
            />
            <ChildQuickOverview linkedChildren={linkedChildren} childDetailsMap={childDetailsMap} />
          </div>
        )}

        {activeTab === "children" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MyChildrenManagement linkedChildren={linkedChildren} />
          </div>
        )}

        {activeTab === "progress" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <LearningProgress linkedChildren={linkedChildren} childDetails={activeChildDetails} />
          </div>
        )}

        {activeTab === "reports" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TeacherReports linkedChildren={linkedChildren} />
          </div>
        )}

        {activeTab === "activities" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ActivitiesGrid linkedChildren={linkedChildren} childDetails={activeChildDetails} />
          </div>
        )}

        {activeTab === "monitoring" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ChildMonitoring linkedChildren={linkedChildren} childSafety={activeChildSafety} />
            <div className="mt-8">
              <SubscriptionSettings />
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <NotificationsSection />
          </div>
        )}
      </div>
    </main>
  );
}
