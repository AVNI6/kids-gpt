"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BookOpen, Puzzle, FileQuestion, Calendar, Loader2 } from "lucide-react";
import { usePagination } from "@/hooks/shared/use-pagination";
import { useParentDashboard } from "@/hooks/parent/useParentDashboard";
import { getActivityReviewByRewardIdForParent } from "@/lib/services/kid/activity-review.actions";
import ParentActivityReviewModal from "./ParentActivityReviewModal";
import type { ActivityReviewRow } from "@/types/activity-review.types";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getParentActivitiesPaginated } from "@/lib/services/parent/parent-dashboard.actions";

export default function ActivitiesGrid() {
  const { activeChild, details } = useParentDashboard();
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedReview, setSelectedReview] = useState<ActivityReviewRow | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [loadingReviewId, setLoadingReviewId] = useState<string | null>(null);

  const handleCardClick = async (activityId: string) => {
    setLoadingReviewId(activityId);
    try {
      const res = await getActivityReviewByRewardIdForParent(activityId);
      if (res.success && res.data) {
        setSelectedReview(res.data);
        setIsReviewOpen(true);
      } else {
        toast.info("Detailed review is only available for new activity attempts.", {
          description: "Older attempts do not have question-level snapshotted history.",
        });
      }
    } catch {
      toast.error("Failed to load activity review details.");
    } finally {
      setLoadingReviewId(null);
    }
  };

  // Compute unique filters dynamically based on child's actual rewards/timeline logs
  const dynamicFilters = useMemo(() => {
    const uniqueFilters = new Map<string, string>();

    (details?.timeline ?? []).forEach((log) => {
      const slug = log.activity_settings?.slug || log.source_type;
      let title = log.activity_settings?.title;

      // Clean title from description if not available
      if (!title && log.description) {
        title = log.description.replace(/^Completed\s+/i, "").split(" (Score:")[0];
      }
      if (!title) {
        title = "Completed Activity";
      }

      if (slug) {
        if (slug === "memory-match") {
          uniqueFilters.set("memory-match", "Memory Match");
        } else if (slug === "flashcards") {
          uniqueFilters.set("flashcards", "Flashcards");
        } else {
          uniqueFilters.set(slug, title);
        }
      }
    });

    const filtersArray = Array.from(uniqueFilters.entries()).map(([slug, label]) => ({
      label,
      slug,
    }));

    return [{ label: "All Activities", slug: "All" }, ...filtersArray];
  }, [details?.timeline]);

  const [pageState, setPageState] = useState(1);
  const pageSize = 9;

  const { data, isLoading } = useQuery({
    queryKey: [
      "child-activities-filtered",
      activeChild?.user_id,
      pageState,
      pageSize,
      activeFilter,
    ],
    queryFn: () =>
      getParentActivitiesPaginated(activeChild!.user_id, pageState, pageSize, activeFilter),
    enabled: !!activeChild?.user_id,
  });

  const activitiesCount = data?.totalCount || 0;

  // Parse activities returned from query
  const paginatedActivities = useMemo(() => {
    const raw = data?.activities || [];
    return raw.map((log) => {
      const desc = log.description || "Completed Activity";

      // Extract score if present
      const scoreMatch = desc.match(/Score:\s*(\d+)%/i);
      const score = scoreMatch ? `${scoreMatch[1]}%` : log.score ? `${log.score}%` : "100%";

      const slug = log.activity_settings?.slug || log.source_type || "";
      const title =
        log.activity_settings?.title ||
        desc.replace(/^Completed\s+/i, "").replace(/\s*\(Score:\s*\d+%\)/i, "") ||
        "Completed Activity";

      let icon = <Puzzle className="w-6 h-6 text-orange-500" />;
      let color = "bg-orange-100 dark:bg-orange-950/30";

      if (slug === "math-challenges") {
        icon = <BookOpen className="w-6 h-6 text-sky-500" />;
        color = "bg-sky-100 dark:bg-sky-950/40";
      } else if (slug === "word-scrambles") {
        icon = <BookOpen className="w-6 h-6 text-sky-500" />;
        color = "bg-sky-100 dark:bg-sky-950/40";
      } else if (slug === "science-lab") {
        icon = <Puzzle className="w-6 h-6 text-sky-500" />;
        color = "bg-sky-100 dark:bg-sky-950/40";
      } else if (slug === "logic-puzzles") {
        icon = <Puzzle className="w-6 h-6 text-orange-500" />;
        color = "bg-orange-100 dark:bg-orange-950/30";
      } else if (
        slug === "memory-match" ||
        slug === "match-following" ||
        slug === "flashcards" ||
        slug === "quizzes" ||
        slug === "jigsaw-puzzle" ||
        slug === "color-mixer"
      ) {
        icon = <FileQuestion className="w-6 h-6 text-sky-500" />;
        color = "bg-sky-100 dark:bg-sky-950/40";
      }

      // Format date
      const dateStr = log.created_at
        ? new Date(log.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Recent";

      return {
        id: log.id,
        title,
        description: desc,
        slug,
        status: "Completed",
        difficulty: "Medium",
        dueDate: dateStr,
        score,
        icon,
        color,
      };
    });
  }, [data?.activities]);

  const activitiesPagination = usePagination(paginatedActivities, {
    pageSize,
    totalItems: activitiesCount,
    page: pageState,
    onPageChange: setPageState,
  });

  // Reset page state during render when filter or child changes
  const [prevChildId, setPrevChildId] = useState(activeChild?.user_id);
  const [prevFilter, setPrevFilter] = useState(activeFilter);
  if (activeChild?.user_id !== prevChildId || activeFilter !== prevFilter) {
    setPrevChildId(activeChild?.user_id);
    setPrevFilter(activeFilter);
    setPageState(1);
  }

  if (!activeChild) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] w-full">
        <Card className="rounded-[32px] border-slate-200 dark:border-slate-800 bg-white dark:bg-black/30 p-12 text-center max-w-2xl w-full">
          <CardContent className="space-y-4 pt-6">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto animate-pulse" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              No Completed Activities
            </h3>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Please link a child account under the{" "}
              <Link
                href="/dashboard/parent/children"
                className="text-sky-500 hover:underline font-bold"
              >
                My Children
              </Link>{" "}
              tab to view their completed milestones and activities.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex overflow-x-auto no-scrollbar lg:flex-wrap gap-2">
        {dynamicFilters.map((filter) => (
          <Button
            key={filter.slug}
            variant={activeFilter === filter.slug ? "default" : "outline"}
            className={`rounded-full font-bold px-5 h-10 text-xs transition-colors cursor-pointer ${
              activeFilter === filter.slug
                ? "bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 shadow-sm border-transparent"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
            onClick={() => setActiveFilter(filter.slug)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          </div>
        ) : paginatedActivities.length === 0 ? (
          <Card className="col-span-full rounded-[28px] border-slate-200 dark:border-slate-800 bg-white dark:bg-black/30 p-12 text-center">
            <CardContent className="space-y-3">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                {(details?.timeline ?? []).length === 0
                  ? "No completed activities yet."
                  : "No completed activities match this filter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          activitiesPagination.currentItems.map((activity) => (
            <Card
              key={activity.id}
              onClick={() => {
                if (loadingReviewId === null) {
                  handleCardClick(activity.id);
                }
              }}
              className="rounded-[28px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm hover:shadow-md transition-all group cursor-pointer hover:border-sky-200 dark:hover:border-sky-900 active:scale-98"
            >
              <CardContent className="p-6 flex flex-col h-full justify-between relative">
                {loadingReviewId === activity.id && (
                  <div className="absolute inset-0 bg-white/60 dark:bg-black/60 rounded-[28px] flex items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl ${activity.color} flex items-center justify-center shadow-sm border border-sky-100/10`}
                    >
                      {activity.icon}
                    </div>
                    <Badge
                      variant="secondary"
                      className="font-bold uppercase tracking-wider text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300 border border-emerald-100/50"
                    >
                      {activity.status}
                    </Badge>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 line-clamp-1">
                      {activity.title}
                    </h3>
                    {activity.description && activity.description !== activity.title && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> {activity.dueDate}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <span>{activity.difficulty}</span>
                    </div>
                  </div>
                </div>

                {activity.status === "Completed" && activity.score && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      Score Achieved
                    </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {activity.score}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination — always directly below the grid */}
      {activitiesCount > 0 && activitiesPagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/60 pt-5 animate-in fade-in duration-300">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {(() => {
              const start = activitiesPagination.startIndex + 1;
              const end = activitiesPagination.startIndex + paginatedActivities.length;
              const total = activitiesPagination.totalItems;
              if (start === end) return `Showing ${start} of ${total}`;
              return `Showing ${start}\u2013${end} of ${total}`;
            })()}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!activitiesPagination.hasPrevPage}
              onClick={activitiesPagination.prevPage}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 font-bold h-9 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!activitiesPagination.hasNextPage}
              onClick={activitiesPagination.nextPage}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 font-bold h-9 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ParentActivityReviewModal
        isOpen={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false);
          setSelectedReview(null);
        }}
        review={selectedReview}
        activityTitle={
          selectedReview?.review_data && "title" in selectedReview.review_data
            ? selectedReview.review_data.title
            : selectedReview?.activity_type || "Activity"
        }
      />
    </div>
  );
}
