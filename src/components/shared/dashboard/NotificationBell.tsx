"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  School,
  XCircle,
  ClipboardList,
  Trophy,
  FolderOpen,
  Megaphone,
  AlertTriangle,
  Clock,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getRelativeTime } from "@/hooks/shared/timeUtils";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string | null;
}

interface NotificationBellProps {
  role: "kid" | "parent" | "teacher";
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  viewAllHref?: string;
  isLoading?: boolean;
}

function getNotificationStyle(type: string) {
  switch (type) {
    case "classroom_approved":
      return {
        icon: <School className="size-4 text-emerald-600 dark:text-emerald-400" />,
        bg: "bg-emerald-50 dark:bg-emerald-950/20",
      };
    case "classroom_rejected":
      return {
        icon: <XCircle className="size-4 text-rose-600 dark:text-rose-400" />,
        bg: "bg-rose-50 dark:bg-rose-950/20",
      };
    case "ASSIGNMENT_PUBLISHED":
      return {
        icon: <ClipboardList className="size-4 text-sky-600 dark:text-sky-400" />,
        bg: "bg-sky-50 dark:bg-sky-950/20",
      };
    case "ASSIGNMENT_GRADED":
      return {
        icon: <Trophy className="size-4 text-amber-600 dark:text-amber-400" />,
        bg: "bg-amber-50 dark:bg-amber-950/20",
      };
    case "RESOURCE_UPLOADED":
      return {
        icon: <FolderOpen className="size-4 text-purple-600 dark:text-purple-400" />,
        bg: "bg-purple-50 dark:bg-purple-950/20",
      };
    case "ANNOUNCEMENT_POSTED":
      return {
        icon: <Megaphone className="size-4 text-rose-600 dark:text-rose-400" />,
        bg: "bg-rose-50 dark:bg-rose-950/20",
      };
    case "safety_alert":
      return {
        icon: <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400" />,
        bg: "bg-rose-50 dark:bg-rose-950/20",
      };
    case "SCREEN_TIME_LIMIT":
      return {
        icon: <Clock className="size-4 text-rose-600 dark:text-rose-400" />,
        bg: "bg-rose-50 dark:bg-rose-950/20",
      };
    case "quiz_completed":
      return {
        icon: <BookOpen className="size-4 text-sky-600 dark:text-sky-400" />,
        bg: "bg-sky-50 dark:bg-sky-950/20",
      };
    case "streak_milestone":
    case "milestone":
      return {
        icon: <Trophy className="size-4 text-amber-600 dark:text-amber-400" />,
        bg: "bg-amber-50 dark:bg-amber-950/20",
      };
    case "classroom_request":
    case "ASSIGNMENT_SUBMITTED":
      return {
        icon: <School className="size-4 text-indigo-600 dark:text-indigo-400" />,
        bg: "bg-indigo-50 dark:bg-indigo-950/20",
      };
    default:
      return {
        icon: <Bell className="size-4 text-slate-500" />,
        bg: "bg-slate-50 dark:bg-slate-900",
      };
  }
}

export default function NotificationBell({
  role,
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  viewAllHref,
  isLoading,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Set ring colors based on dashboard roles
  const activeRingClass =
    role === "teacher"
      ? "focus:ring-indigo-500/20 hover:bg-slate-100 dark:hover:bg-slate-800"
      : "focus:ring-sky-500/20 hover:bg-slate-100 dark:hover:bg-slate-800";

  const markAllTextClass =
    role === "teacher"
      ? "text-indigo-650 dark:text-indigo-400 hover:text-indigo-750"
      : "text-sky-600 dark:text-sky-400 hover:text-sky-750";

  const viewAllTextClass =
    role === "teacher" ? "text-indigo-650 dark:text-indigo-400" : "text-sky-600 dark:text-sky-400";

  const readDotBg = role === "teacher" ? "bg-indigo-500" : "bg-sky-500";
  const unreadItemBg =
    role === "teacher" ? "bg-indigo-50/20 dark:bg-indigo-900/5" : "bg-sky-50/20 dark:bg-sky-900/5";

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        className={cn(
          "relative p-2 text-slate-500 rounded-full transition-colors focus:outline-none focus:ring-2 cursor-pointer",
          activeRingClass
        )}
      >
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
          <span className="font-black text-slate-900 dark:text-white">Alerts</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className={cn(
                "text-xs font-bold hover:underline cursor-pointer transition-colors",
                markAllTextClass
              )}
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Dropdown Content */}
        <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
          {isLoading ? (
            <div className="p-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
              <GraduationCap className="size-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
              All caught up!
            </div>
          ) : (
            notifications.slice(0, 10).map((notif) => {
              const { icon, bg } = getNotificationStyle(notif.type);
              return (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={cn(
                    "flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer",
                    !notif.is_read ? unreadItemBg : ""
                  )}
                >
                  <div
                    className={cn(
                      "size-8 rounded-full flex items-center justify-center shrink-0",
                      bg
                    )}
                  >
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span
                        className={cn(
                          "text-xs font-extrabold truncate",
                          !notif.is_read
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-700 dark:text-slate-300"
                        )}
                      >
                        {notif.title}
                      </span>
                      <span
                        suppressHydrationWarning
                        className="text-[9px] font-bold text-slate-400 shrink-0 ml-2"
                      >
                        {getRelativeTime(notif.created_at)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-xs leading-relaxed truncate",
                        !notif.is_read
                          ? "text-slate-600 dark:text-slate-300 font-semibold"
                          : "text-slate-500 dark:text-slate-400"
                      )}
                    >
                      {notif.message}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className={cn("size-2 rounded-full shrink-0 self-center", readDotBg)} />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Dropdown Footer (View All link if provided) */}
        {viewAllHref && (
          <Link
            href={viewAllHref}
            onClick={() => setIsOpen(false)}
            className={cn(
              "block p-3 text-center text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/60 cursor-pointer transition-colors",
              viewAllTextClass
            )}
          >
            View all notifications
          </Link>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
