"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, Trophy, BookOpen, CheckCircle2, Check } from "lucide-react";
import {
  getParentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/actions/dashboard.actions";
import { createClient } from "@/lib/supabase/client";
import { getRelativeTime } from "@/hooks/timeUtils";
interface NotificationItem {
  id: string;
  parent_id: string;
  child_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export default function NotificationsSection() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await getParentNotifications();
      const items: NotificationItem[] = (data || []).map((n: Record<string, unknown>) => ({
        id: String(n.id ?? ""),
        parent_id: String(n.parent_id ?? ""),
        child_id: String(n.child_id ?? ""),
        type: String(n.type ?? ""),
        title: String(n.title ?? ""),
        message: String(n.message ?? ""),
        is_read: Boolean(n.is_read ?? false),
        metadata: (n.metadata ?? {}) as Record<string, unknown> | null,
        created_at: n.created_at ? String(n.created_at) : null,
      }));
      setNotifications(items);
    } catch (err) {
      console.error("Error fetching notifications in tab:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);

    const supabase = createClient();
    const channel = supabase
      .channel("parent-notifications-section-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parent_notifications",
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await markNotificationAsRead(id);
      if (res.success) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      }
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await markAllNotificationsAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  return (
    <div className="space-y-8">
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
            onClick={handleMarkAllAsRead}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer"
          >
            <Check className="w-4 h-4 mr-2" /> Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
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
            notifications.map((notif) => {
              let icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
              let bg = "bg-emerald-100 dark:bg-emerald-900/50";

              if (notif.type === "safety_alert") {
                icon = <AlertTriangle className="w-5 h-5 text-rose-500" />;
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
                            onClick={() => handleMarkAsRead(notif.id)}
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
        </div>
      )}
    </div>
  );
}
