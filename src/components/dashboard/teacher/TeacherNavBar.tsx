"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Menu,
  X,
  GraduationCap,
  CheckCircle2,
  Users,
  Megaphone,
  BookOpen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { getRelativeTime } from "@/hooks/timeUtils";
import { APP_ROUTES } from "@/constant/AppRoutes";
import type { ClassroomNotification } from "@/types/classroom.types";

export const TEACHER_NAV_ITEMS = [
  { label: "Home", href: APP_ROUTES.TeacherDashboard, exact: true },
  { label: "Classrooms", href: APP_ROUTES.TeacherClassrooms, exact: false },
  { label: "Notifications", href: APP_ROUTES.TeacherNotifications, exact: false },
  { label: "Settings", href: APP_ROUTES.TeacherSettings, exact: false },
];

function getNotifIcon(type: string) {
  switch (type) {
    case "classroom_request":
      return <Users className="size-4 text-indigo-600 dark:text-indigo-400" />;
    case "assignment_submitted":
      return <BookOpen className="size-4 text-amber-600 dark:text-amber-400" />;
    case "assignment_graded":
      return <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />;
    case "announcement":
      return <Megaphone className="size-4 text-sky-600 dark:text-sky-400" />;
    default:
      return <GraduationCap className="size-4 text-indigo-600 dark:text-indigo-400" />;
  }
}

function getNotifBg(type: string) {
  switch (type) {
    case "classroom_request":
      return "bg-indigo-50 dark:bg-indigo-950/20";
    case "assignment_submitted":
      return "bg-amber-50 dark:bg-amber-950/20";
    case "assignment_graded":
      return "bg-emerald-50 dark:bg-emerald-950/20";
    default:
      return "bg-indigo-50 dark:bg-indigo-950/20";
  }
}

export default function TeacherNavBar() {
  const pathname = usePathname();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<ClassroomNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_role", "teacher")
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) {
        const typed = data as ClassroomNotification[];
        setNotifications(typed);
        setUnreadCount(typed.filter((n) => !n.is_read).length);
      }
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-dismiss mobile menu on scroll
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleDismiss = () => setIsMobileMenuOpen(false);
    window.addEventListener("scroll", handleDismiss, { passive: true });
    return () => window.removeEventListener("scroll", handleDismiss);
  }, [isMobileMenuOpen]);

  const markAsRead = async (id: string) => {
    try {
      const supabase = createClient();
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  };

  const markAllAsRead = async () => {
    try {
      const supabase = createClient();
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length === 0) return;
      await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  };

  const isLinkActive = (item: (typeof TEACHER_NAV_ITEMS)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-background/80 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile Branding */}
          <div className="flex lg:hidden items-center pl-1">
            <span className="font-extrabold text-lg bg-linear-to-r from-indigo-500 to-sky-500 bg-clip-text text-transparent">
              Teacher Hub
            </span>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden lg:flex items-center gap-1">
            {TEACHER_NAV_ITEMS.map((item) => {
              const active = isLinkActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right: Notifications Bell + Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell Dropdown */}
            <DropdownMenu open={isNotifOpen} onOpenChange={setIsNotifOpen}>
              <DropdownMenuTrigger className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer">
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[calc(100vw-32px)] sm:w-[360px] max-w-[360px] rounded-2xl p-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-xl overflow-hidden"
              >
                {/* Dropdown Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
                  <span className="font-black text-slate-900 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* Notification Items */}
                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                      <GraduationCap className="size-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                      No new notifications
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={`flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer ${
                          !notif.is_read ? "bg-indigo-50/20 dark:bg-indigo-900/5" : ""
                        }`}
                      >
                        <div
                          className={`size-8 rounded-full flex items-center justify-center shrink-0 ${getNotifBg(notif.type)}`}
                        >
                          {getNotifIcon(notif.type)}
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
                          <div className="size-2 rounded-full bg-indigo-500 shrink-0 self-center" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* View All Footer */}
                <Link
                  href={APP_ROUTES.TeacherNotifications}
                  onClick={() => setIsNotifOpen(false)}
                  className="block p-3 text-center text-xs font-black text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/60 cursor-pointer transition-colors"
                >
                  View all notifications
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer — rendered via React Portal at body level */}
      {isMounted && isMobileMenuOpen
        ? createPortal(
            <div className="lg:hidden fixed inset-0 z-[9999] flex">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md transition-opacity duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {/* Drawer Panel (slides in from right) */}
              <div className="relative ml-auto w-80 max-w-xs h-screen bg-white dark:bg-slate-900 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800 z-50">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800/60 mb-6">
                  <span className="font-black text-lg bg-linear-to-r from-indigo-500 to-sky-500 bg-clip-text text-transparent">
                    Teacher Hub
                  </span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:text-white dark:hover:bg-slate-900 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Nav Items */}
                <div className="flex-1 flex flex-col gap-2">
                  {TEACHER_NAV_ITEMS.map((item) => {
                    const active = isLinkActive(item);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`w-full block text-left px-4 py-3 rounded-2xl font-black transition-all cursor-pointer text-sm ${
                          active
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 border border-indigo-100/20 dark:border-indigo-500/20"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                {/* Drawer Footer */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 text-center">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Teacher Mode Active
                  </p>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </nav>
  );
}
