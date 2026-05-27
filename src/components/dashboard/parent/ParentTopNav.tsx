"use client";

import { useState, useEffect } from "react";
import { Bell, Menu, AlertTriangle, Trophy, BookOpen, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DashboardUserProfile } from "@/types/dashboard.types";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getParentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/actions/dashboard.actions";
import { getRelativeTime } from "@/hooks/timeUtils";

export const PARENT_NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "children", label: "My Children" },
  { id: "progress", label: "Learning Progress" },
  { id: "activities", label: "Activities" },
  { id: "monitoring", label: "Monitoring" },
];

type Props = {
  profile: DashboardUserProfile;
};

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

export default function ParentTopNav({ profile }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") || "home";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const data = await getParentNotifications();
      // Map returned array to standard NotificationItem elements
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
      setUnreadCount(items.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    // Schedule asynchronous execution to avoid synchronous setState inside render-effect warning
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);

    const supabase = createClient();
    const channel = supabase
      .channel("parent-notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parent_notifications",
          filter: `parent_id=eq.${profile.user_id}`,
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
  }, [profile.user_id]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await markNotificationAsRead(id);
      if (res.success) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await markAllNotificationsAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const setActiveTab = (id: string) => {
    router.push(`?tab=${id}`);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-background/80 backdrop-blur-xl">
      <div className="max-w-400 mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {PARENT_NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeTab === item.id
                    ? "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Section: Notifications & Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
                    {unreadCount}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[330px] md:w-[360px] rounded-2xl p-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-xl overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
                  <span className="font-black text-slate-900 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                      No new updates
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notif) => {
                      let icon = (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      );
                      let bg = "bg-emerald-50 dark:bg-emerald-950/20";

                      if (notif.type === "safety_alert") {
                        icon = (
                          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        );
                        bg = "bg-rose-50 dark:bg-rose-950/20";
                      } else if (notif.type === "quiz_completed") {
                        icon = <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
                        bg = "bg-sky-50 dark:bg-sky-950/20";
                      } else if (notif.type === "streak_milestone" || notif.type === "milestone") {
                        icon = <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
                        bg = "bg-amber-50 dark:bg-amber-950/20";
                      }

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkAsRead(notif.id)}
                          className={`flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer ${
                            !notif.is_read ? "bg-sky-50/20 dark:bg-sky-900/5" : ""
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bg}`}
                          >
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                              <span
                                className={`text-xs font-extrabold truncate ${
                                  !notif.is_read
                                    ? "text-slate-900 dark:text-white"
                                    : "text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {notif.title}
                              </span>
                              <span
                                suppressHydrationWarning
                                className="text-[10px] font-bold text-slate-400 shrink-0 ml-2"
                              >
                                {getRelativeTime(notif.created_at)}
                              </span>
                            </div>
                            <p
                              className={`text-xs leading-relaxed truncate ${
                                !notif.is_read
                                  ? "text-slate-600 dark:text-slate-300 font-semibold"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {notif.message}
                            </p>
                          </div>
                          {!notif.is_read && (
                            <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0 self-center" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <div
                  onClick={() => setActiveTab("notifications")}
                  className="block p-3 text-center text-xs font-black text-sky-600 dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/60 cursor-pointer"
                >
                  View all notifications
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden items-end p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-white dark:bg-card border-b border-slate-200 dark:border-slate-800 shadow-lg animate-in slide-in-from-top-2">
          <div className="px-4 py-4 space-y-2">
            {PARENT_NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-colors ${
                  activeTab === item.id
                    ? "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
