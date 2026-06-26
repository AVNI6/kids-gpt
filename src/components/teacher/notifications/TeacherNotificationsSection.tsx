"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2 } from "lucide-react";
import type { ClassroomNotification } from "@/types/classroom.types";
import { usePagination } from "@/hooks/shared/use-pagination";
import { useClassroomNotifications } from "@/hooks/shared/useClassroomNotifications";
import NotificationCard from "@/components/shared/notifications/NotificationCard";

export default function TeacherNotificationsSection() {
  const [pageState, setPageState] = useState(1);
  const pageSize = 9;

  // Use the single custom hook definition for all data fetching and actions
  const {
    notifications,
    totalCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useClassroomNotifications("teacher", { page: pageState, pageSize });

  const { currentItems, page, totalPages, nextPage, prevPage, hasNextPage, hasPrevPage } =
    usePagination(notifications, {
      pageSize,
      totalItems: totalCount,
      page: pageState,
      onPageChange: setPageState,
    });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
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
            currentItems.map((notif: ClassroomNotification) => (
              <NotificationCard
                key={notif.id}
                id={notif.id}
                title={notif.title}
                message={notif.message ?? ""}
                created_at={notif.created_at}
                is_read={notif.is_read}
                type={notif.type}
                role="teacher"
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))
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
