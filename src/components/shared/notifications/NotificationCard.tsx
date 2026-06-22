"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Check,
  Trash2,
  AlertTriangle,
  Trophy,
  BookOpen,
  Clock,
  CheckCircle2,
  Users,
  Megaphone,
  GraduationCap,
} from "lucide-react";
import { getRelativeTime } from "@/hooks/shared/timeUtils";

interface NotificationCardProps {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  type: string;
  role: "parent" | "teacher";
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationCard({
  id,
  title,
  message,
  created_at,
  is_read,
  type,
  role,
  onMarkAsRead,
  onDelete,
}: NotificationCardProps) {
  // Determine icon & background based on role & type
  let icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  let bgClass = "bg-emerald-100 dark:bg-emerald-900/50";

  if (role === "parent") {
    if (type === "safety_alert") {
      icon = <AlertTriangle className="w-5 h-5 text-rose-500" />;
      bgClass = "bg-rose-100 dark:bg-rose-900/50";
    } else if (type === "SCREEN_TIME_LIMIT") {
      icon = <Clock className="w-5 h-5 text-rose-500" />;
      bgClass = "bg-rose-100 dark:bg-rose-900/50";
    } else if (type === "quiz_completed") {
      icon = <BookOpen className="w-5 h-5 text-purple-500" />;
      bgClass = "bg-purple-100 dark:bg-purple-900/50";
    } else if (type === "streak_milestone" || type === "milestone") {
      icon = <Trophy className="w-5 h-5 text-amber-500" />;
      bgClass = "bg-amber-100 dark:bg-amber-900/50";
    }
  } else {
    switch (type) {
      case "classroom_request":
        icon = <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
        bgClass = "bg-indigo-100 dark:bg-indigo-950/20";
        break;
      case "assignment_submitted":
        icon = <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
        bgClass = "bg-amber-100 dark:bg-amber-950/20";
        break;
      case "assignment_graded":
        icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
        bgClass = "bg-emerald-100 dark:bg-emerald-950/20";
        break;
      case "announcement":
        icon = <Megaphone className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
        bgClass = "bg-sky-100 dark:bg-sky-950/20";
        break;
      default:
        icon = <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
        bgClass = "bg-indigo-100 dark:bg-indigo-950/20";
        break;
    }
  }

  const ringClass =
    role === "parent"
      ? "ring-purple-100 dark:ring-purple-950/30"
      : "ring-indigo-150 dark:ring-indigo-950/30";

  const activeColorClass = role === "parent" ? "hover:text-purple-600" : "hover:text-indigo-650";

  return (
    <Card
      className={`rounded-[24px] border-slate-200/60 dark:border-slate-800/60 transition-colors shadow-sm hover:shadow-md ${
        !is_read
          ? `bg-white dark:bg-slate-900/80 ring-1 ${ringClass}`
          : "bg-slate-50/50 dark:bg-slate-900/40"
      }`}
    >
      <CardContent className="p-6 flex gap-4 md:gap-6 items-start">
        <div
          className={`relative w-12 h-12 rounded-full ${bgClass} flex items-center justify-center shrink-0`}
        >
          {icon}
          {!is_read && (
            <div className="absolute -top-0.5 -right-0.5 z-10 w-3 h-3 rounded-full bg-purple-500 ring-2 ring-white dark:ring-slate-900 shrink-0" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4 mb-2">
            <div className="space-y-1 min-w-0 text-left">
              <h3
                className={`text-base font-black ${
                  !is_read ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                } leading-tight`}
              >
                {title}
              </h3>
              <span suppressHydrationWarning className="text-xs font-bold text-slate-400 block">
                {getRelativeTime(created_at)}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-lg">
              {!is_read && (
                <button
                  onClick={() => onMarkAsRead(id)}
                  title="Mark as read"
                  className={`p-1 rounded-md text-slate-500 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer border-none bg-transparent ${activeColorClass}`}
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onDelete(id)}
                title="Delete notification"
                className="p-1 rounded-md text-slate-500 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer border-none bg-transparent"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p
            className={`text-sm leading-relaxed text-left ${
              !is_read
                ? "text-slate-600 dark:text-slate-300 font-semibold"
                : "text-slate-500 dark:text-slate-500"
            }`}
          >
            {message}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
