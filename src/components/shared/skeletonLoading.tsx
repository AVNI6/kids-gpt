import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GameHistorySkeleton, NotificationsUpdatesSkeleton } from "@/components/kid/dashboard";

/**
 * AuthSkeleton - Loading placeholder for SignIn and SignUp pages
 */
export function AuthSkeleton() {
  return (
    <main className="min-h-screen flex flex-col px-4 sm:px-6 font-sans bg-background relative overflow-hidden">
      <div className="my-auto mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 relative z-10 animate-pulse">
        {/* Left Side Banner (Visible on large screens) */}
        <div className="hidden flex-col gap-8 lg:flex">
          <Skeleton className="h-8 w-full max-w-[96px] rounded-full" />
          <div className="rounded-[32px] border-2 border-border/50 bg-card p-8 shadow-xl space-y-4">
            <Skeleton className="h-6 w-full max-w-[128px] rounded-full" />
            <Skeleton className="h-4 w-full max-w-[256px] rounded-full" />
            <Skeleton className="h-4 w-full max-w-[192px] rounded-full" />
          </div>
        </div>
        {/* Right Side Form Panel */}
        <div className="rounded-[32px] border-2 border-border/50 bg-card p-5 sm:p-8 md:p-10 shadow-xl space-y-6 w-full">
          <div className="space-y-2">
            <Skeleton className="h-8 w-full max-w-[128px] rounded-full" />
            <Skeleton className="h-4 w-full max-w-[192px] rounded-full" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full max-w-[64px] rounded-full" />
              <Skeleton className="h-14 w-full rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full max-w-[64px] rounded-full" />
              <Skeleton className="h-14 w-full rounded-full" />
            </div>
            <Skeleton className="h-4 w-full max-w-[128px] rounded-full" />
            <Skeleton className="h-14 w-full rounded-full" />
          </div>
        </div>
      </div>
    </main>
  );
}

export function ClassroomWorkspaceSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="space-y-1.5 flex-1 min-w-0">
          <Skeleton className="h-8 w-full max-w-[220px] rounded-lg" />
          <Skeleton className="h-4 w-full max-w-[140px] rounded-md" />
        </div>
      </div>

      <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full p-1 overflow-hidden shrink-0">
        <div className="overflow-x-auto scrollbar-none w-full">
          <div className="flex h-auto! min-w-full w-max my-1 gap-2">
            <Skeleton className="h-10 w-24 sm:w-28 rounded-full shrink-0" />
            <Skeleton className="h-10 w-24 sm:w-28 rounded-full shrink-0" />
            <Skeleton className="h-10 w-24 sm:w-28 rounded-full shrink-0" />
            <Skeleton className="h-10 w-24 sm:w-28 rounded-full shrink-0" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/40 p-6 sm:p-8 space-y-6 shadow-sm">
            <CardContent className="p-0 space-y-4">
              <Skeleton className="h-7 w-1/3 rounded-lg" />
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
                <Skeleton className="h-4 w-2/3 rounded-md" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="rounded-[32px] border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/40 p-6 shadow-sm">
            <CardContent className="p-0 space-y-4">
              <Skeleton className="h-6 w-1/3 rounded-lg" />
              <div className="flex items-center gap-3 mt-4">
                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function TabContentSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-full max-w-[192px] rounded-full" />
          <Skeleton className="h-4 w-full max-w-[256px] rounded-full" />
        </div>
        <Skeleton className="h-10 w-full max-w-[128px] rounded-full" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            className="rounded-[32px] border-slate-200/50 bg-white/50 dark:bg-slate-900/40 p-4 sm:p-6 space-y-4"
          >
            <CardContent className="p-0 space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full rounded-full" />
                <Skeleton className="h-3 w-5/6 rounded-full" />
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <Skeleton className="h-4 w-full max-w-[96px] rounded-full" />
                <Skeleton className="h-8 w-full max-w-[96px] rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * ProfileSettingsSkeleton - Shared loader for settings views (Kid, Parent, Teacher)
 */
export function ProfileSettingsSkeleton({ showExtraField = true }: { showExtraField?: boolean }) {
  return (
    <div className="animate-pulse flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-full max-w-[160px]" />
        <Skeleton className="h-4 w-full max-w-[320px]" />
      </div>

      <Skeleton className="h-12 w-full rounded-2xl" />

      <Card className="rounded-[32px] border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 p-4 sm:p-6 md:p-8 shadow-sm">
        <CardContent className="p-0 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-full max-w-[96px]" />
            <Skeleton className="h-24 w-full rounded-3xl" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full max-w-[80px]" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full max-w-[80px]" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>
          {showExtraField && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full max-w-[128px]" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          )}
          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/60">
            <Skeleton className="h-11 w-full max-w-[128px] rounded-xl" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ClassroomsListSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      {/* Classroom list Skeleton */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-full max-w-[192px] rounded-full" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card
              key={i}
              className="rounded-[32px] border border-indigo-100/50 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
            >
              <CardContent className="p-4 sm:p-6 flex flex-col gap-4">
                <Skeleton className="h-5 w-full max-w-[160px]" />
                <Skeleton className="h-4 w-full max-w-[224px]" />
                <Skeleton className="h-12 w-full rounded-2xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Action Center Skeleton */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-full max-w-[192px] rounded-full" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card
              key={i}
              className="rounded-[28px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
            >
              <CardContent className="p-4 sm:p-5">
                <Skeleton className="h-8 w-8 rounded-full mb-3 shrink-0" />
                <Skeleton className="h-4 w-full max-w-[112px] mb-2" />
                <Skeleton className="h-3 w-full max-w-[160px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Activity Feed Skeleton */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-full max-w-[192px] rounded-full" />
        <Card className="rounded-[32px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4 sm:p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-2 border-b last:border-0 border-slate-50 dark:border-slate-850"
              >
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3 min-w-[80px]" />
                  <Skeleton className="h-3 w-1/2 min-w-[120px]" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * TeacherDashboardSkeleton - Combined loader for teacher analytics dashboard page
 */
export function TeacherDashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 animate-pulse">
      {/* HeroBannerSkeleton */}
      <Card className="rounded-[32px] border-0 relative bg-white dark:bg-black/30 shadow-md p-4 sm:p-8 md:p-10 transition-colors duration-300">
        <CardContent className="p-0 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-4 w-full">
            <div className="space-y-3">
              <Skeleton className="h-10 md:h-12 w-2/3 rounded-xl" />
              <Skeleton className="h-5 w-1/4 rounded-lg" />
            </div>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-full max-w-xl rounded" />
              <Skeleton className="h-4 w-56 max-w-lg rounded" />
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-stretch gap-4 bg-slate-50/50 dark:bg-black/30 border border-slate-100 dark:border-slate-850 p-4 sm:p-6 rounded-[28px] shadow-sm min-w-[240px] sm:min-w-[280px] w-full lg:w-auto">
            <Skeleton className="h-5 w-36 rounded-full" />
            <div className="grid grid-cols-2 gap-4 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-6 w-12 rounded" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PerformanceOverviewSkeleton */}
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-5 w-full max-w-[160px] rounded" />
          </div>
          <Skeleton className="h-4 w-2/3 pl-6 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card
              key={idx}
              className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm overflow-hidden"
            >
              <CardContent className="p-4 sm:p-6 flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-full max-w-[96px] rounded" />
                  <Skeleton className="h-6 w-full max-w-[48px] rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* BottomGridSkeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 flex flex-col gap-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-4 w-full max-w-[128px] rounded" />
              </div>
            </div>
            <Skeleton className="h-3.5 w-full max-w-[160px] rounded" />
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900/60 p-1.5 pr-3.5 rounded-full border border-slate-150/60 dark:border-slate-800 shadow-sm w-36 shrink-0"
                >
                  <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-2 w-2/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-slate-250/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm">
          <CardContent className="p-4 sm:p-5 md:p-6 flex flex-col gap-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3.5 space-y-1.5">
              <Skeleton className="h-4 w-full max-w-[112px] rounded" />
              <Skeleton className="h-3 w-full max-w-[224px] rounded" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3.5 p-4 rounded-[22px] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 h-18"
                >
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Skeleton className="h-2.5 w-16 rounded" />
                    <Skeleton className="h-5 w-8 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * KidStreakBannerSkeleton - Loader for streak overview banner in Kid's dashboard
 */
export function KidStreakBannerSkeleton() {
  return (
    <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm">
      <CardContent className="flex flex-col gap-6 p-4 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-3xl shrink-0" />
          <div className="space-y-3 w-full sm:w-auto">
            <Skeleton className="h-7 w-full max-w-[192px] sm:w-48" />
            <Skeleton className="h-4 w-full max-w-[288px] sm:w-72" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 w-full sm:w-auto lg:w-[320px]">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * KidDashboardSkeleton - Combined loader for Kid's dashboard
 */
export function KidDashboardSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 animate-pulse">
      <KidStreakBannerSkeleton />
      <div className="w-full">
        <GameHistorySkeleton />
      </div>
      <div className="w-full">
        <NotificationsUpdatesSkeleton />
      </div>
    </div>
  );
}

/**
 * ChatSkeleton - Loading visualizer for chatbot messaging history interface
 */
export function ChatSkeleton() {
  return (
    <div className="flex-1 min-h-0 overflow-hidden relative animate-pulse">
      <ScrollArea className="h-full w-full">
        <div className="w-full max-w-3xl mx-auto space-y-6 pb-6 p-3 sm:p-6 md:p-8">
          {/* Skeleton Bubble 1 (User) */}
          <div className="flex justify-end">
            <div className="flex items-end gap-3 max-w-[85%] flex-row-reverse">
              <Skeleton className="w-8 h-8 rounded-full shrink-0 mb-1" />
              <Skeleton className="rounded-2xl sm:rounded-3xl w-40 sm:w-48 h-10 rounded-br-sm shrink-0" />
            </div>
          </div>

          {/* Skeleton Bubble 2 (Assistant) */}
          <div className="flex justify-start">
            <div className="flex items-end gap-3 max-w-[85%] flex-row">
              <Skeleton className="w-8 h-8 rounded-full shrink-0 mb-1" />
              <div className="rounded-2xl sm:rounded-3xl p-4 bg-card border border-border w-56 sm:w-72 h-24 rounded-bl-sm flex flex-col gap-2 shrink-0">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>

          {/* Skeleton Bubble 3 (User) */}
          <div className="flex justify-end">
            <div className="flex items-end gap-3 max-w-[85%] flex-row-reverse">
              <Skeleton className="w-8 h-8 rounded-full shrink-0 mb-1" />
              <Skeleton className="rounded-2xl sm:rounded-3xl w-32 sm:w-36 h-10 rounded-br-sm shrink-0" />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

/**
 * ProfileSkeleton - Sidebar profile layout loading skeleton
 */
export function ProfileSkeleton({ isCollapsed }: { isCollapsed?: boolean }) {
  if (isCollapsed) {
    return (
      <div className="w-full flex justify-center p-0! h-10! w-10! mx-auto items-center">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    );
  }
  return (
    <div className="w-full flex items-center gap-3 p-2 rounded-2xl">
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1 min-w-0 text-left">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-3 w-16 rounded-md" />
      </div>
    </div>
  );
}

/**
 * ParentChildrenSkeleton - Loader for parent's child management page (dashboard/parent/children)
 */
export function ParentChildrenSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-full max-w-[192px] sm:w-48 rounded-xl" />
          <Skeleton className="h-4 w-full max-w-[384px] sm:w-96 rounded-lg" />
        </div>
        <Skeleton className="h-11 w-32 rounded-full shrink-0" />
      </div>

      {/* Children Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Card
            key={idx}
            className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm relative overflow-hidden"
          >
            <CardContent className="p-4 sm:p-6 md:p-8 flex flex-col h-full justify-between gap-6">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <Skeleton className="w-20 h-20 rounded-full shrink-0" />
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                </div>
                <div className="space-y-2 mb-6">
                  <Skeleton className="h-6 w-full max-w-[128px] sm:w-32 rounded-lg" />
                  <Skeleton className="h-4 w-full max-w-[96px] sm:w-24 rounded-md" />
                </div>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-slate-800/50">
                    <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Skeleton className="h-3 w-full max-w-[64px] sm:w-16 rounded" />
                      <Skeleton className="h-4 w-full max-w-[112px] sm:w-28 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-slate-800/50">
                    <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Skeleton className="h-3 w-full max-w-[64px] sm:w-16 rounded" />
                      <Skeleton className="h-4 w-full max-w-[112px] sm:w-28 rounded" />
                    </div>
                  </div>
                </div>
                {/* Actions Grid */}
                <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-3">
                  <Skeleton className="h-11 rounded-2xl" />
                  <Skeleton className="h-11 rounded-2xl" />
                  <Skeleton className="h-11 rounded-2xl min-[340px]:col-span-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ParentProgressSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <Skeleton className="h-10 w-44 rounded-full shrink-0" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card
            key={i}
            className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm"
          >
            <CardContent className="p-6">
              <Skeleton className="w-12 h-12 rounded-2xl mb-4" />
              <Skeleton className="h-3.5 w-24 rounded-md mb-2" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm">
          <CardContent className="p-8 space-y-6">
            <Skeleton className="h-6 w-44 rounded-lg mb-4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm p-8">
          <CardContent className="p-0 space-y-6">
            <div className="flex items-center gap-2">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <Skeleton className="h-5 w-44 rounded-lg" />
            </div>
            <Skeleton className="h-20 w-full rounded-2xl" />
            <div className="space-y-3">
              <Skeleton className="h-3.5 w-24 rounded" />
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-3"
                >
                  <Skeleton className="w-6 h-6 rounded-md shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-3.5 w-full rounded" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ParentActivitiesSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <Skeleton className="h-10 w-44 rounded-full shrink-0" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-full shrink-0" />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card
            key={i}
            className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm"
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-2/3 rounded-md" />
              </div>
              <Skeleton className="h-11 w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ParentNotificationsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-9 w-48 rounded-xl" />
          </div>
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      <div className="space-y-4 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card
            key={i}
            className="rounded-[24px] border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/40"
          >
            <CardContent className="p-6 h-24 flex items-center justify-between" />
          </Card>
        ))}
      </div>
    </div>
  );
}
