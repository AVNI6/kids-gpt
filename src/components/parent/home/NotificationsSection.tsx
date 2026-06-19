"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  AlertTriangle,
  Trophy,
  BookOpen,
  CheckCircle2,
  Check,
  Clock,
  Trash2,
} from "lucide-react";
import { useNotifications } from "@/hooks/parent/useNotifications";
import { useParentDashboard } from "@/hooks/parent/useParentDashboard";
import { getRelativeTime } from "@/hooks/shared/timeUtils";
import type { NotificationItem } from "@/types/parent";
import { usePagination } from "@/hooks/shared/use-pagination";

export default function NotificationsSection() {
  const { profile } = useParentDashboard();
  const queryClient = useQueryClient();
  const [pageState, setPageState] = useState(1);
  const pageSize = 9;

  const {
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications();

  const { data, isLoading } = useQuery({
    queryKey: ["parent-dashboard", "notifications-paginated", profile.user_id, pageState, pageSize],
    queryFn: async () => {
      const supabase = createClient();
      const from = (pageState - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await supabase
        .from("parent_notifications")
        .select("*", { count: "exact" })
        .eq("parent_id", profile.user_id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return {
        items: (data as NotificationItem[]) || [],
        totalCount: count || 0,
      };
    },
    enabled: !!profile.user_id,
  });

  const paginatedNotifications = data?.items || [];
  const totalCount = data?.totalCount || 0;

  const { currentItems, page, totalPages, nextPage, prevPage, hasNextPage, hasPrevPage } =
    usePagination(paginatedNotifications, {
      pageSize,
      totalItems: totalCount,
      page: pageState,
      onPageChange: setPageState,
    });

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update — no refetch needed, setQueryData is the source of truth
    queryClient.setQueryData(
      ["parent-dashboard", "notifications-paginated", profile.user_id, pageState, pageSize],
      (old: { items: NotificationItem[]; totalCount: number } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((n: NotificationItem) => (n.id === id ? { ...n, is_read: true } : n)),
        };
      }
    );
    // Also update the navbar preview cache directly so the badge badge count drops instantly
    queryClient.setQueryData(
      ["parent-dashboard", "notifications"],
      (old: { items: NotificationItem[]; unreadCount: number } | undefined) => {
        if (!old) return old;
        const wasUnread = old.items.find((n) => n.id === id)?.is_read === false;
        return {
          items: old.items.map((n: NotificationItem) => (n.id === id ? { ...n, is_read: true } : n)),
          unreadCount: wasUnread ? Math.max(0, old.unreadCount - 1) : old.unreadCount,
        };
      }
    );
    await markAsRead(id);
    // No invalidateQueries — optimistic update is sufficient for a read toggle
  };

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    queryClient.setQueryData(
      ["parent-dashboard", "notifications-paginated", profile.user_id, pageState, pageSize],
      (old: { items: NotificationItem[]; totalCount: number } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((n: NotificationItem) => ({ ...n, is_read: true })),
        };
      }
    );
    queryClient.setQueryData(
      ["parent-dashboard", "notifications"],
      (old: { items: NotificationItem[]; unreadCount: number } | undefined) => {
        if (!old) return old;
        return {
          items: old.items.map((n: NotificationItem) => ({ ...n, is_read: true })),
          unreadCount: 0,
        };
      }
    );
    await markAllAsRead();
    // No invalidateQueries — optimistic update is sufficient
  };

  const handleDelete = async (id: string) => {
    queryClient.setQueryData(
      ["parent-dashboard", "notifications-paginated", profile.user_id, pageState, pageSize],
      (old: { items: NotificationItem[]; totalCount: number } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((n: NotificationItem) => n.id !== id),
          totalCount: Math.max(0, old.totalCount - 1),
        };
      }
    );
    await deleteNotification(id);
    // Invalidate after delete — total count and page structure changed
    queryClient.invalidateQueries({ queryKey: ["parent-dashboard", "notifications-paginated"] });
    queryClient.invalidateQueries({ queryKey: ["parent-dashboard", "notifications"] });
  };

  const handleDeleteAll = async () => {
    queryClient.setQueryData(
      ["parent-dashboard", "notifications-paginated", profile.user_id, pageState, pageSize],
      (_old: { items: NotificationItem[]; totalCount: number } | undefined) => ({
        items: [],
        totalCount: 0,
      })
    );
    queryClient.setQueryData(
      ["parent-dashboard", "notifications"],
      (_old: { items: NotificationItem[]; unreadCount: number } | undefined) => ({
        items: [],
        unreadCount: 0,
      })
    );
    await deleteAllNotifications();
    // Invalidate after delete-all — everything cleared
    queryClient.invalidateQueries({ queryKey: ["parent-dashboard", "notifications-paginated"] });
    queryClient.invalidateQueries({ queryKey: ["parent-dashboard", "notifications"] });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8 text-purple-500" /> Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
            Stay updated on your child&apos;s progress and account alerts in real-time.
          </p>
        </div>
        {totalCount > 0 && (
          <div className="flex gap-2">
            {paginatedNotifications.some((n) => !n.is_read) && (
              <Button
                variant="ghost"
                onClick={handleMarkAllAsRead}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer"
              >
                <Check className="w-4 h-4 mr-2" /> Mark all as read
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleDeleteAll}
              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Clear all
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4 w-full">
          {[1, 2, 3].map((n) => (
            <Card
              key={n}
              className="rounded-[24px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 animate-pulse"
            >
              <CardContent className="p-6 h-24 flex items-center justify-between" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-4 w-full">
            {paginatedNotifications.length === 0 ? (
              <Card className="rounded-[28px] border-2 border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/10 p-12 text-center">
                <CardContent className="p-0 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                    All caught up!
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    No new learning or safety notifications at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              currentItems.map((notif: NotificationItem) => {
                let icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
                let bg = "bg-emerald-100 dark:bg-emerald-900/50";

                if (notif.type === "safety_alert") {
                  icon = <AlertTriangle className="w-5 h-5 text-rose-500" />;
                  bg = "bg-rose-100 dark:bg-rose-900/50";
                } else if (notif.type === "SCREEN_TIME_LIMIT") {
                  icon = <Clock className="w-5 h-5 text-rose-500" />;
                  bg = "bg-rose-100 dark:bg-rose-900/50";
                } else if (notif.type === "quiz_completed") {
                  icon = <BookOpen className="w-5 h-5 text-purple-500" />;
                  bg = "bg-purple-100 dark:bg-purple-900/50";
                } else if (notif.type === "streak_milestone" || notif.type === "milestone") {
                  icon = <Trophy className="w-5 h-5 text-amber-500" />;
                  bg = "bg-amber-100 dark:bg-amber-900/50";
                }

                return (
                  <Card
                    key={notif.id}
                    className={`rounded-[24px] border-slate-200/60 dark:border-slate-800/60 transition-colors shadow-sm hover:shadow-md ${
                      !notif.is_read
                        ? "bg-white dark:bg-slate-900/80 ring-1 ring-purple-100 dark:ring-purple-950/30"
                        : "bg-slate-50/50 dark:bg-slate-900/40"
                    }`}
                  >
                    <CardContent className="p-6 flex gap-4 md:gap-6 items-start">
                      <div
                        className={`relative w-12 h-12 rounded-full ${bg} flex items-center justify-center shrink-0`}
                      >
                        {icon}
                        {!notif.is_read && (
                          <div className="absolute -top-0.5 -right-0.5 z-10 w-3 h-3 rounded-full bg-purple-500 ring-2 ring-white dark:ring-slate-900 shrink-0" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-1">
                          <h3
                            className={`text-base font-black ${!notif.is_read ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}
                          >
                            {notif.title}
                          </h3>
                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-start">
                            <span
                              suppressHydrationWarning
                              className="text-xs font-bold text-slate-400"
                            >
                              {getRelativeTime(notif.created_at)}
                            </span>
                            <div className="flex items-center gap-1.5 border-l border-slate-100 dark:border-slate-800 pl-3">
                              {!notif.is_read && (
                                <button
                                  onClick={() => handleMarkAsRead(notif.id)}
                                  title="Mark as read"
                                  className="p-1 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notif.id)}
                                title="Delete notification"
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <p
                          className={`text-sm leading-relaxed ${!notif.is_read ? "text-slate-600 dark:text-slate-300 font-semibold" : "text-slate-500 dark:text-slate-500"}`}
                        >
                          {notif.message}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Pagination — rendered directly below cards, not inside space-y-4 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-5 animate-in fade-in duration-300">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!hasPrevPage}
                  onClick={prevPage}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 font-bold h-9 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!hasNextPage}
                  onClick={nextPage}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 font-bold h-9 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
