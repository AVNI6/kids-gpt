import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

function NavSkeleton() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-background/80 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo / Title placeholder */}
          <div className="flex items-center">
            <Skeleton className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
          {/* Nav Items placeholders */}
          <div className="hidden lg:flex items-center space-x-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
            ))}
          </div>
          {/* Right icons placeholder */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <Skeleton className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function ParentDashboardLoading() {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      {/* 1. Header Navigation Skeleton */}
      <NavSkeleton />

      {/* 2. Main content container */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Top welcome card mockup */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-black/30 p-6 md:p-8 rounded-[32px] border border-sky-100/60 dark:border-slate-800/60 shadow-sm animate-pulse">
          <div className="space-y-2.5 flex-1 w-full">
            <Skeleton className="h-7 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <Skeleton className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
          <Skeleton className="h-11 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
        </div>

        {/* Welcome message card mockup */}
        <div className="h-36 bg-slate-50 dark:bg-black/20 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse" />

        {/* Metrics Grid Mockup (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm overflow-hidden"
            >
              <CardContent className="p-6 flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  <Skeleton className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dual columns timeline & insights mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_0.9fr] gap-8">
          {/* Recent Family Activity Card */}
          <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm overflow-hidden animate-pulse">
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Skeleton className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <Skeleton className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <CardContent className="p-6 md:p-8 pt-0 space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-start py-5 first:pt-0 last:pb-0 border-b last:border-0 border-slate-100 dark:border-slate-800/40"
                >
                  <Skeleton className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                      <Skeleton className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <Skeleton className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <Skeleton className="h-5 w-14 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Insights Card */}
          <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm flex flex-col p-8 justify-between overflow-hidden animate-pulse space-y-6">
            <div className="flex items-center gap-2">
              <Skeleton className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
              <Skeleton className="h-5 w-36 bg-slate-250 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="space-y-4 flex-1">
              <Skeleton className="h-20 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              <div className="space-y-3">
                <Skeleton className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                        <Skeleton className="h-2.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-12 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
