import { TeacherDashboardSkeleton } from "@/components/shared/skeletonLoading";

export default function TeacherDashboardLoading() {
  return (
    <main className="min-h-full bg-background px-4 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8 dark:text-slate-50">
      <TeacherDashboardSkeleton />
    </main>
  );
}
