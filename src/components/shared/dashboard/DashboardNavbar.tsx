"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useNotifications } from "@/hooks/parent/useNotifications";
import { useClassroomNotifications } from "@/hooks/shared/useClassroomNotifications";
import { useParentDashboard } from "@/hooks/parent/useParentDashboard";
import { getKidPendingAssignmentsCount } from "@/lib/services/kid/classroom.actions";
import { APP_ROUTES } from "@/lib/constants/app_routes";

// Configs
import { kidNavItems } from "@/config/navigation/kid-nav";
import { parentNavItems } from "@/config/navigation/parent-nav";
import { teacherNavItems } from "@/config/navigation/teacher-nav";
import type { NavItemConfig } from "@/config/navigation/kid-nav";

// Presentation Base
import DashboardNavbarBase from "./DashboardNavbarBase";

interface DashboardNavbarProps {
  role: "kid" | "parent" | "teacher";
}

let pendingAssignmentsPromise: Promise<number> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 8000; // 8 seconds cache window

function getKidPendingAssignmentsCountCached(): Promise<number> {
  const now = Date.now();
  if (pendingAssignmentsPromise && now - lastFetchTime < CACHE_DURATION) {
    return pendingAssignmentsPromise;
  }

  lastFetchTime = now;
  pendingAssignmentsPromise = getKidPendingAssignmentsCount().catch((err) => {
    pendingAssignmentsPromise = null;
    throw err;
  });
  return pendingAssignmentsPromise;
}

function KidNavbarWrapper({ pathname }: { pathname: string }) {
  const [dueCount, setDueCount] = useState(0);
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } =
    useClassroomNotifications("kid", { limit: 10 });

  useEffect(() => {
    getKidPendingAssignmentsCountCached().then(setDueCount);
  }, [pathname]);

  const isLinkActive = (item: NavItemConfig) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const getNavItemHref = (item: NavItemConfig) => item.href;

  const isDashboard = pathname.startsWith("/dashboard/kid");
  const navItems = isDashboard ? kidNavItems : [];

  return (
    <DashboardNavbarBase
      role="kid"
      navItems={navItems}
      pathname={pathname}
      notifications={notifications}
      unreadCount={unreadCount}
      markAsRead={markAsRead}
      markAllAsRead={markAllAsRead}
      isLoadingNotifications={isLoading}
      showSidebarToggle={true}
      dueCount={dueCount}
      getNavItemHref={getNavItemHref}
      isLinkActive={isLinkActive}
    />
  );
}

function ParentNavbarWrapper({ pathname }: { pathname: string }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoadingNotifications } =
    useNotifications();
  const { activeChildId } = useParentDashboard();

  const isLinkActive = (item: NavItemConfig) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const getNavItemHref = (item: NavItemConfig) => {
    if (item.isParameterized && activeChildId) {
      return `${item.href}?childId=${activeChildId}`;
    }
    return item.href;
  };

  return (
    <DashboardNavbarBase
      role="parent"
      navItems={parentNavItems}
      pathname={pathname}
      notifications={notifications}
      unreadCount={unreadCount}
      markAsRead={markAsRead}
      markAllAsRead={markAllAsRead}
      viewAllNotificationsHref={APP_ROUTES.ParentNotifications}
      isLoadingNotifications={isLoadingNotifications}
      showSidebarToggle={true}
      getNavItemHref={getNavItemHref}
      isLinkActive={isLinkActive}
    />
  );
}

function TeacherNavbarWrapper({ pathname }: { pathname: string }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } =
    useClassroomNotifications("teacher", { limit: 10 });

  const isLinkActive = (item: NavItemConfig) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const getNavItemHref = (item: NavItemConfig) => item.href;

  return (
    <DashboardNavbarBase
      role="teacher"
      navItems={teacherNavItems}
      pathname={pathname}
      notifications={notifications}
      unreadCount={unreadCount}
      markAsRead={markAsRead}
      markAllAsRead={markAllAsRead}
      viewAllNotificationsHref={APP_ROUTES.TeacherNotifications}
      isLoadingNotifications={isLoading}
      showSidebarToggle={true}
      getNavItemHref={getNavItemHref}
      isLinkActive={isLinkActive}
    />
  );
}

export default function DashboardNavbar({ role }: DashboardNavbarProps) {
  const pathname = usePathname() || "";

  switch (role) {
    case "kid":
      return <KidNavbarWrapper pathname={pathname} />;
    case "parent":
      return <ParentNavbarWrapper pathname={pathname} />;
    case "teacher":
      return <TeacherNavbarWrapper pathname={pathname} />;
    default:
      return null;
  }
}
