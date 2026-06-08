"use client";

import { Card, CardContent } from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Bell, AlertTriangle, Trophy, BookOpen, CheckCircle2, Check, Clock } from "lucide-react";
import { useNotifications } from "@/hooks/parent/useNotifications";
import { getRelativeTime } from "@/hooks/shared/timeUtils";
import type { NotificationItem } from "@/types/parent";
import { usePagination } from "@/hooks/shared/use-pagination";

export default function NotificationsSection() {
  const { notifications, isLoadingNotifications, markAsRead, markAllAsRead } = useNotifications();
  const { currentItems, page, totalPages, nextPage, prevPage, hasNextPage, hasPrevPage } =
    usePagination(notifications);

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
        {notifications.some((n) => !n.is_read) && (
          <Button
            variant="ghost"
            onClick={markAllAsRead}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer"
          >
            <Check className="w-4 h-4 mr-2" /> Mark all as read
          </Button>
        )}
      </div>

      {isLoadingNotifications ? (
        <div className="space-y-4 max-w-4xl">
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
        <div className="space-y-4 max-w-4xl">
          {notifications.length === 0 ? (
            <Card className="rounded-[28px] border-dashed border-2 border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/10 p-12 text-center">
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
                      className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center shrink-0`}
                    >
                      {icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-1 mb-1">
                        <h3
                          className={`text-base font-black ${!notif.is_read ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}
                        >
                          {notif.title}
                        </h3>
                        <span
                          suppressHydrationWarning
                          className="text-xs font-bold text-slate-400 shrink-0"
                        >
                          {getRelativeTime(notif.created_at)}
                        </span>
                      </div>
                      <p
                        className={`text-sm leading-relaxed ${!notif.is_read ? "text-slate-600 dark:text-slate-300 font-semibold" : "text-slate-500 dark:text-slate-500"}`}
                      >
                        {notif.message}
                      </p>

                      {!notif.is_read && (
                        <div className="mt-4 flex gap-3">
                          <Button
                            size="sm"
                            onClick={() => markAsRead(notif.id)}
                            className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 px-4 cursor-pointer"
                          >
                            Mark as read
                          </Button>
                        </div>
                      )}
                    </div>

                    {!notif.is_read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0 mt-2" />
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}

          {/* Premium Pagination Controls */}
          {!isLoadingNotifications && totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 border-t border-slate-100 dark:border-slate-800/60 pt-6 animate-in fade-in duration-300">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!hasPrevPage}
                  onClick={prevPage}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 font-bold h-9 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!hasNextPage}
                  onClick={nextPage}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 font-bold h-9 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
