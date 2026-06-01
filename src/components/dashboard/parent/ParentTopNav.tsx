"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, X, AlertTriangle, Trophy, BookOpen, CheckCircle2, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NotificationItem } from "@/types/parent-dashboard/dashboard.types";
import { useNotifications } from "@/hooks/parent-dashboard/useNotifications";
import { useParentDashboard } from "@/hooks/parent-dashboard/useParentDashboard";
import { getRelativeTime } from "@/hooks/timeUtils";
import { APP_ROUTES } from "@/constant/AppRoutes";

export const PARENT_NAV_ITEMS = [
  { label: "Home", href: APP_ROUTES.ParentDashboard, exact: true },
  { label: "My Children", href: APP_ROUTES.ParentChildren },
  { label: "Learning Progress", href: APP_ROUTES.ParentProgress },
  { label: "Activities", href: APP_ROUTES.ParentActivities },
];

export default function ParentTopNav() {
  const pathname = usePathname();
  const { activeChildId } = useParentDashboard();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Retrieve unified notifications from the shared notifications hook
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Auto-dismiss mobile menu drawer on scroll
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleDismiss = () => setIsMobileMenuOpen(false);
    window.addEventListener("scroll", handleDismiss, { passive: true });
    return () => window.removeEventListener("scroll", handleDismiss);
  }, [isMobileMenuOpen]);

  const isLinkActive = (item: (typeof PARENT_NAV_ITEMS)[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  const getNavItemHref = (item: (typeof PARENT_NAV_ITEMS)[0]) => {
    if (item.href === APP_ROUTES.ParentDashboard || item.href === APP_ROUTES.ParentChildren) {
      return item.href;
    }
    return activeChildId ? `${item.href}?childId=${activeChildId}` : item.href;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-background/80 backdrop-blur-xl">
      <div className="max-w-400 mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile Branding / Offset Title */}
          <div className="flex lg:hidden items-center pl-12">
            <span className="font-extrabold text-lg bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
              Parent Hub
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {PARENT_NAV_ITEMS.map((item) => {
              const active = isLinkActive(item);
              return (
                <Link
                  key={item.href}
                  href={getNavItemHref(item)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right Section: Notifications & Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            <DropdownMenu open={isNotifOpen} onOpenChange={setIsNotifOpen}>
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
                className="w-[calc(100vw-32px)] sm:w-[360px] max-w-[360px] rounded-2xl p-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-xl overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
                  <span className="font-black text-slate-900 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
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
                    notifications.slice(0, 5).map((notif: NotificationItem) => {
                      let icon = (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      );
                      let bg = "bg-emerald-50 dark:bg-emerald-950/20";

                      if (notif.type === "safety_alert") {
                        icon = (
                          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        );
                        bg = "bg-rose-50 dark:bg-rose-950/20";
                      } else if (notif.type === "SCREEN_TIME_LIMIT") {
                        icon = <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
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
                          onClick={() => markAsRead(notif.id)}
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
                <Link
                  href={APP_ROUTES.ParentNotifications}
                  onClick={() => setIsNotifOpen(false)}
                  className="block p-3 text-center text-xs font-black text-sky-600 dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/60 cursor-pointer"
                >
                  View all notifications
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle (on the right side next to notifications) */}
            <button
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Sidedrawer rendered via React Portal at body level */}
      {isMobileMenuOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="lg:hidden fixed inset-0 z-[9999] flex">
              {/* Backdrop Blur Overlay */}
              <div
                className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md transition-opacity duration-350"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {/* Drawer Body Panel (Slides in from the right, full screen height) */}
              <div className="relative ml-auto w-80 max-w-xs h-screen bg-white dark:bg-slate-900 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800 z-50">
                {/* Header / Brand */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800/60 mb-6">
                  <span className="font-black text-lg bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
                    Parent Hub
                  </span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:text-white dark:hover:bg-slate-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Nav items list */}
                <div className="flex-1 space-y-2">
                  {PARENT_NAV_ITEMS.map((item) => {
                    const active = isLinkActive(item);
                    return (
                      <Link
                        key={item.href}
                        href={getNavItemHref(item)}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`w-full block text-left px-4.5 py-3 rounded-2xl font-black transition-all cursor-pointer ${
                          active
                            ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 border border-sky-100/20 dark:border-sky-500/20"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 text-center">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Parent Mode Enforced
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
