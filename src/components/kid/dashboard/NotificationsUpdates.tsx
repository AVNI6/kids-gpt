"use client";

import { Card, CardContent } from "@/components/shared/ui/card";
import { Skeleton } from "@/components/shared/ui/skeleton";
import {
  BellRing,
  School,
  Trophy,
  ClipboardList,
  FolderOpen,
  Megaphone,
  XCircle,
  Bell,
} from "lucide-react";
import { ScrollArea } from "@/components/shared/ui/scroll-area";
import { useKidNotifications } from "@/hooks/kid/useKidNotifications";
import { getRelativeTime } from "@/hooks/shared/timeUtils";

export function NotificationsUpdatesSkeleton() {
  return (
    <Card className="rounded-[36px] border-sky-100 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm h-full">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-8 w-32 bg-slate-100 dark:bg-slate-800" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function NotificationsUpdates() {
  const { notifications, isLoading } = useKidNotifications(10);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "classroom_approved":
        return School;
      case "classroom_rejected":
        return XCircle;
      case "ASSIGNMENT_PUBLISHED":
        return ClipboardList;
      case "ASSIGNMENT_GRADED":
        return Trophy;
      case "RESOURCE_UPLOADED":
        return FolderOpen;
      case "ANNOUNCEMENT_POSTED":
        return Megaphone;
      default:
        return Bell;
    }
  };

  const getNotifColors = (type: string) => {
    switch (type) {
      case "classroom_approved":
        return "text-emerald-500 bg-emerald-100/70 dark:text-emerald-400 dark:bg-emerald-950/40";
      case "classroom_rejected":
        return "text-rose-500 bg-rose-100/70 dark:text-rose-400 dark:bg-rose-950/40";
      case "ASSIGNMENT_PUBLISHED":
        return "text-sky-500 bg-sky-100/70 dark:text-sky-400 dark:bg-sky-950/40";
      case "ASSIGNMENT_GRADED":
        return "text-amber-500 bg-amber-100/70 dark:text-amber-400 dark:bg-amber-950/40";
      case "RESOURCE_UPLOADED":
        return "text-purple-500 bg-purple-100/70 dark:text-purple-400 dark:bg-purple-950/40";
      case "ANNOUNCEMENT_POSTED":
        return "text-rose-500 bg-rose-100/70 dark:text-rose-400 dark:bg-rose-950/40";
      default:
        return "text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800";
    }
  };

  if (isLoading) {
    return <NotificationsUpdatesSkeleton />;
  }

  return (
    <Card className="rounded-[36px] border-slate-200 bg-slate-950 text-white shadow-xl h-full flex flex-col overflow-hidden relative min-h-[280px]">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <BellRing className="w-32 h-32 text-white" />
      </div>
      <CardContent className="p-6 flex flex-col h-full relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <BellRing className="w-5 h-5 text-sky-400" />
          <h2 className="text-xl font-black tracking-tight">Alerts & Updates</h2>
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4 max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
              <Bell className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
              <p className="text-sm font-semibold">No new alerts right now.</p>
              <p className="text-xs text-slate-600 mt-1">Enjoy your day!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => {
                const Icon = getNotifIcon(notif.type);
                const colorClass = getNotifColors(notif.type);
                return (
                  <div
                    key={notif.id}
                    className={`flex gap-3 items-start p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:bg-slate-800 transition-colors ${
                      !notif.is_read ? "ring-1 ring-sky-500/30 bg-slate-900/90" : ""
                    }`}
                  >
                    <div className={`p-2 rounded-full ${colorClass} shrink-0`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="font-bold text-sm leading-tight text-slate-200 truncate">
                          {notif.title}
                        </h4>
                        <span
                          suppressHydrationWarning
                          className="text-[10px] text-slate-500 shrink-0 font-medium"
                        >
                          {getRelativeTime(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed break-words">
                        {notif.message}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0 self-center" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
