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
import MyChildrenManagement from "@/components/dashboard/parent/sections/MyChildrenManagement";
import LearningProgress from "@/components/dashboard/parent/sections/LearningProgress";
import ActivitiesGrid from "@/components/dashboard/parent/sections/ActivitiesGrid";
import ChildMonitoring from "@/components/dashboard/parent/sections/ChildMonitoring";
import NotificationsSection from "@/components/dashboard/parent/sections/NotificationsSection";
import SubscriptionSettings from "@/components/dashboard/parent/sections/SubscriptionSettings";
import ParentProfileManager from "@/components/dashboard/parent/ParentProfileManager";
import ChildSelectorTabs from "@/components/dashboard/parent/ChildSelectorTabs";
import type { ChildDetailsResult } from "@/types/dashboard.types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Clock, Activity, Users, CheckCircle2, Sparkles } from "lucide-react";

interface FamilyTimelineItem {
  id: string;
  childName: string;
  childAvatar: string | null;
  title: string;
  description: string;
  created_at: string | null;
  rewards_amount: number;
}

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
    <main className="min-h-screen bg-background font-sans flex flex-col transition-colors duration-300">
      <Suspense
        fallback={
          <div className="h-16 w-full bg-white dark:bg-background border-b border-slate-200 dark:border-slate-800 flex items-center px-6 gap-4">
            <div className="h-4 w-20 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-4 w-24 rounded-full bg-slate-100 dark:bg-slate-900 animate-pulse" />
            <div className="h-4 w-16 rounded-full bg-slate-100 dark:bg-slate-900 animate-pulse" />
            <div className="ml-auto h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        }
      >
        <ParentTopNav profile={profile} />
      </Suspense>

      <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Unified Page Header for child-specific tabs */}
        {activeTab !== "home" &&
          activeTab !== "notifications" &&
          activeTab !== "children" &&
          linkedChildren.length > 0 &&
          (() => {
            let tabTitle = "Learning Progress";
            let tabDesc = `Analytics, subject mastery, and AI insights for ${activeChild?.first_name}'s learning journey.`;

            if (activeTab === "activities") {
              tabTitle = "Completed Activities";
              tabDesc = `View all educational milestones and activities completed by ${activeChild?.first_name}.`;
            } else if (activeTab === "monitoring") {
              tabTitle = "Child Monitoring & Safety";
              tabDesc = `Keep ${activeChild?.first_name} safe, monitored, and focused during their educational chat sessions.`;
            }

            return (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-6 animate-in fade-in duration-300">
                <div className="space-y-1">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight animate-in fade-in duration-300">
                    {tabTitle}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
                    {tabDesc}
                  </p>
                </div>
                <ChildSelectorTabs linkedChildren={linkedChildren} />
              </div>
            );
          })()}

        {activeTab === "home" &&
          (() => {
            // Family metrics aggregation
            let familyTotalXP = 0;
            let familyTotalMins = 0;
            let familyTotalCompleted = 0;

            linkedChildren.forEach((child) => {
              familyTotalXP += child.total_experience_points ?? 0;
              const details = childDetailsMap[child.user_id];
              if (details) {
                familyTotalMins += details.learning_time_mins;
                familyTotalCompleted += details.total_completed;
              }
            });

            const familyTimeStr =
              familyTotalMins > 60
                ? `${Math.floor(familyTotalMins / 60)}h ${familyTotalMins % 60}m`
                : `${familyTotalMins}m`;

            // Aggregate feed across all kids
            const familyTimeline: FamilyTimelineItem[] = [];
            linkedChildren.forEach((child) => {
              const details = childDetailsMap[child.user_id];
              if (details && details.timeline) {
                details.timeline.forEach((item) => {
                  familyTimeline.push({
                    id: item.id,
                    title:
                      item.activity_settings?.title ||
                      item.description
                        ?.replace(/^Completed\s+/i, "")
                        .replace(/\s*\(Score:\s*\d+%\)/i, "") ||
                      "Completed Activity",
                    description: item.description ?? "Completed activity",
                    created_at: item.created_at,
                    rewards_amount: item.rewards_amount ?? 0,
                    childName: child.first_name || "Child",
                    childAvatar: child.avatar_url,
                  });
                });
              }
            });

            // Sort timeline chronologically desc
            familyTimeline.sort(
              (a, b) =>
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            );

            return (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-900 dark:text-slate-100">
                {/* Parent Account Details and Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-black/30 p-6 md:p-8 rounded-[32px] border border-sky-100 dark:border-slate-800 shadow-sm backdrop-blur-md">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                      <span>Parent Settings & Account Hub</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
                      Update your display profile, customize notifications, or link child accounts.
                    </p>
                  </div>
                  <ParentProfileManager profile={profile} />
                </div>

                <WelcomeBanner
                  profile={profile}
                  linkedChildren={linkedChildren}
                  childDetailsMap={childDetailsMap}
                />

                {/* Unified Family Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                    <CardContent className="p-6 relative z-10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                        <Trophy className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-0.5">
                          Family Total XP
                        </h3>
                        <p className="text-2xl font-black">{familyTotalXP}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                    <CardContent className="p-6 relative z-10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6 text-sky-500 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-0.5">
                          Total Study Time
                        </h3>
                        <p className="text-2xl font-black">{familyTimeStr}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                    <CardContent className="p-6 relative z-10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-0.5">
                          Completed Activities
                        </h3>
                        <p className="text-2xl font-black">{familyTotalCompleted}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                    <CardContent className="p-6 relative z-10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-sky-500" />
                      </div>
                      <div>
                        <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-0.5">
                          Active Children
                        </h3>
                        <p className="text-2xl font-black">{linkedChildren.length}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Bottom Section: Unified Chronological Activity Feed and Family recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_0.9fr] gap-8">
                  <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <h3 className="text-xl font-black flex items-center gap-2">
                        <Activity className="w-5 h-5 text-sky-600 animate-pulse" /> Recent Family
                        Activity
                      </h3>
                      <Badge
                        variant="secondary"
                        className="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 font-bold px-3 py-1 rounded-full text-xs"
                      >
                        Live Feed
                      </Badge>
                    </div>
                    <CardContent className="p-6 md:p-8 pt-0 divide-y divide-slate-100 dark:divide-slate-800/40 max-h-[480px] overflow-y-auto pr-2">
                      {familyTimeline.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 font-bold text-sm">
                          Your children haven&apos;t played any learning games yet!
                        </div>
                      ) : (
                        familyTimeline.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="flex gap-4 items-start py-5 first:pt-0 last:pb-0"
                          >
                            <Avatar className="w-10 h-10 border-2 border-white dark:border-slate-800 rounded-full shrink-0 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800">
                              <AvatarImage
                                src={item.childAvatar ?? undefined}
                                className="object-cover"
                              />
                              <AvatarFallback className="text-xs font-black bg-gradient-to-br from-sky-400 to-sky-600 text-white">
                                {item.childName?.[0] || "C"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline mb-0.5">
                                <span className="text-sm font-extrabold">{item.childName}</span>
                                <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-2">
                                  {item.created_at
                                    ? new Date(item.created_at).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "Recently"}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
                                {item.title}
                              </p>
                              {item.description && item.description !== item.title && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed mt-0.5 animate-in fade-in">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-lg text-[10px] shrink-0 border border-emerald-100 dark:border-emerald-900/30">
                              +{item.rewards_amount || 20} XP
                            </Badge>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Family AI Onboarding & Recommendations */}
                  <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm flex flex-col p-8 justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="space-y-6">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-sky-50 dark:bg-sky-950/40 rounded-xl flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-sky-500" />
                        </div>
                        <h3 className="text-lg font-black">Family AI Insights</h3>
                      </div>

                      {linkedChildren.length === 0 ? (
                        <div className="space-y-4 text-center py-6">
                          <p className="text-sm font-semibold text-slate-500">No linked kids</p>
                          <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            Add your child&apos;s account in &quot;My Children&quot; to start
                            generating AI insights and recommendations.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-350 bg-sky-50/50 dark:bg-sky-950/20 p-4 rounded-2xl border border-sky-100/60 dark:border-sky-900/20 leading-relaxed">
                            Your family dashboard aggregates learning habits across all linked
                            children. Use the &quot;My Children&quot; tab to monitor specific
                            histories, or head to &quot;Learning Progress&quot; for subject mastery
                            details.
                          </p>

                          <div className="space-y-3">
                            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                              Active Streaks & Leader
                            </h4>
                            {linkedChildren.map((child) => {
                              const details = childDetailsMap[child.user_id];
                              const accuracy = details?.quiz_accuracy ?? 0;
                              return (
                                <div
                                  key={child.user_id}
                                  className="p-3 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="w-8 h-8 border border-white dark:border-slate-800 rounded-full shrink-0">
                                      <AvatarImage
                                        src={child.avatar_url ?? undefined}
                                        className="object-cover"
                                      />
                                      <AvatarFallback className="text-xs font-black bg-sky-500 text-white">
                                        {child.first_name?.[0] || "C"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <span className="text-xs font-extrabold block truncate">
                                        {child.first_name}
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-400">
                                        {accuracy > 0 ? `${accuracy}% Accuracy` : "Started Journey"}
                                      </span>
                                    </div>
                                  </div>
                                  <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 font-bold px-2 py-0.5 rounded-lg text-[10px] shrink-0 border border-sky-100 dark:border-sky-900/30">
                                    Level{" "}
                                    {Math.floor((child.total_experience_points ?? 0) / 100) + 1}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            );
          })()}

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
