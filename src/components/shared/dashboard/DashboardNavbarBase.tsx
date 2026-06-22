"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import NotificationBell, { type NotificationItem } from "./NotificationBell";
import MobileNavDrawer from "./MobileNavDrawer";
import type { NavItemConfig } from "@/config/navigation/kid-nav";

interface DashboardNavbarBaseProps {
  role: "kid" | "parent" | "teacher";
  navItems: NavItemConfig[];
  pathname: string;
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  viewAllNotificationsHref?: string;
  isLoadingNotifications?: boolean;
  showSidebarToggle?: boolean;
  dueCount?: number;
  getNavItemHref: (item: NavItemConfig) => string;
  isLinkActive: (item: NavItemConfig) => boolean;
}

export default function DashboardNavbarBase({
  role,
  navItems,
  pathname,
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  viewAllNotificationsHref,
  isLoadingNotifications,
  showSidebarToggle = true,
  dueCount = 0,
  getNavItemHref,
  isLinkActive,
}: DashboardNavbarBaseProps) {
  const { toggleSidebar } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Logo branding and mobile triggers
  const brandText = pathname.startsWith("/dashboard/kid")
    ? "Explorer Hub"
    : pathname.startsWith("/dashboard/teacher")
      ? "Teacher Hub"
      : pathname.startsWith("/dashboard/parent")
        ? "Parent Hub"
        : "Kidoza";

  const activeLinkClass =
    role === "teacher"
      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
      : "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300";

  const toggleSidebarRing =
    role === "teacher" ? "focus:ring-indigo-500/20" : "focus:ring-sky-500/20";

  const sidebarBtnBg = "bg-sky-500 hover:bg-sky-600 shadow-sky-500/20";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md">
      <div className="px-4 md:px-6 lg:px-8 w-full">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left Section: Mobile Sidebar Hamburger & Brand */}
          <div className="flex items-center shrink-0 gap-3">
            {showSidebarToggle && (
              <button
                onClick={toggleSidebar}
                title="Open Chat Sidebar"
                suppressHydrationWarning
                className={cn(
                  "lg:hidden h-7 w-7 rounded-lg text-white flex items-center justify-center shrink-0 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer border-none",
                  sidebarBtnBg
                )}
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center shrink-0">
              <span className="font-extrabold text-xl tracking-tight bg-linear-to-r from-sky-500 to-sky-700 bg-clip-text text-transparent">
                {brandText}
              </span>
            </div>
          </div>

          {/* Right Section holding Desktop Links & Notification/Menu Utilities */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const active = isLinkActive(item);
                const isClassrooms = item.label === "Classrooms";
                return (
                  <Link
                    key={item.href}
                    href={getNavItemHref(item)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer flex items-center gap-2",
                      active
                        ? activeLinkClass
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                    )}
                  >
                    <span>{item.label}</span>
                    {isClassrooms && dueCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-1 ring-white dark:ring-slate-950">
                        {dueCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Notification Bell Dropdown & Mobile Menu Toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              {role !== "kid" && (
                <NotificationBell
                  role={role}
                  notifications={notifications}
                  unreadCount={unreadCount}
                  markAsRead={markAsRead}
                  markAllAsRead={markAllAsRead}
                  viewAllHref={viewAllNotificationsHref}
                  isLoading={isLoadingNotifications}
                />
              )}

              {/* Mobile Navigation Drawer Toggle */}
              {pathname.startsWith("/dashboard") && navItems && navItems.length > 0 && (
                <button
                  className={cn(
                    "lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none focus:ring-2 cursor-pointer",
                    toggleSidebarRing
                  )}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                >
                  <Menu className="size-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Drawer (general page navigation sliding from the right) */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        role={role}
        navItems={navItems}
        getNavItemHref={getNavItemHref}
        isLinkActive={isLinkActive}
        dueCount={dueCount}
      />
    </nav>
  );
}
