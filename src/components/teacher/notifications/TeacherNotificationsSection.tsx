"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2 } from "lucide-react";
import { getRelativeTime } from "@/hooks/shared/timeUtils";
import type { ClassroomNotification } from "@/types/classroom.types";
import { usePagination } from "@/hooks/shared/use-pagination";
import { useClassroomNotifications } from "@/hooks/shared/useClassroomNotifications";
import { getNotifIcon, getNotifBg } from "@/utils/teacherNotificationHelpers";

export default function TeacherNotificationsSection() {
  // Use the single custom hook definition for all data fetching and actions
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useClassroomNotifications("teacher");

  const { currentItems, page, totalPages, nextPage, prevPage, hasNextPage, hasPrevPage } =
    usePagination(notifications);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8 text-indigo-500" /> Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
            Track student submissions, enrollment requests, and announcements in real-time.
          </p>
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            {notifications.some((n) => !n.is_read) && (
              <Button
                variant="ghost"
                onClick={markAllAsRead}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer"
              >
                <Check className="w-4 h-4 mr-2" /> Mark all as read
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={deleteAllNotifications}
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
              <CardContent className="p-6 h-24" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4 w-full">
          {notifications.length === 0 ? (
            <Card className="rounded-[28px] border-2 border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/10 p-12 text-center">
              <CardContent className="p-0 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                  All caught up!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  No new classroom or student alerts at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            currentItems.map((notif: ClassroomNotification) => {
              const icon = getNotifIcon(notif.type);
              const bg = getNotifBg(notif.type);

              return (
                <Card
                  key={notif.id}
                  className={`rounded-[24px] border-slate-200/60 dark:border-slate-800/60 transition-colors shadow-sm hover:shadow-md ${
                    !notif.is_read
                      ? "bg-white dark:bg-slate-900/80 ring-1 ring-indigo-150 dark:ring-indigo-950/30"
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
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-1">
                        <h3
                          className={`text-base font-black ${
                            !notif.is_read
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
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
                                onClick={() => markAsRead(notif.id)}
                                title="Mark as read"
                                className="p-1 rounded-lg text-slate-400 hover:text-indigo-650 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notif.id)}
                              title="Delete notification"
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <p
                        className={`text-sm leading-relaxed ${
                          !notif.is_read
                            ? "text-slate-600 dark:text-slate-300 font-semibold"
                            : "text-slate-500 dark:text-slate-500"
                        }`}
                      >
                        {notif.message}
                      </p>
                    </div>

                    {!notif.is_read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 mt-2" />
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}

          {/* Pagination Controls */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 border-t border-slate-100 dark:border-slate-800/60 pt-6">
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
