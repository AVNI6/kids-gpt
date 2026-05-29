"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, AlertTriangle, Trophy, BookOpen, CheckCircle2 } from "lucide-react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Retrieve unified notifications from the shared notifications hook
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const isLinkActive = (item: (typeof PARENT_NAV_ITEMS)[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  const getNavItemHref = (item: (typeof PARENT_NAV_ITEMS)[0]) => {
    if (item.href === APP_ROUTES.ParentChildren) {
      return item.href;
    }
    return activeChildId ? `${item.href}?childId=${activeChildId}` : item.href;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-background/80 backdrop-blur-xl">
      <div className="max-w-400 mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-end lg:justify-between gap-4">
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
                  className="block p-3 text-center text-xs font-black text-sky-600 dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/60 cursor-pointer"
                >
                  View all notifications
                </Link>
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
            {PARENT_NAV_ITEMS.map((item) => {
              const active = isLinkActive(item);
              return (
                <Link
                  key={item.href}
                  href={getNavItemHref(item)}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full block text-left px-4 py-3 rounded-xl font-bold transition-colors cursor-pointer ${
                    active
                      ? "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
