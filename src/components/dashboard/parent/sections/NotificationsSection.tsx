"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, MessageCircle, FileText, Sparkles, CreditCard, Check } from "lucide-react";

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "teacher",
    title: "New feedback from Mr. Davis",
    message: "Emma did a great job on her Science Quiz today!",
    time: "10 mins ago",
    unread: true,
    icon: <MessageCircle className="w-5 h-5 text-blue-500" />,
    bg: "bg-blue-100 dark:bg-blue-900/50",
  },
  {
    id: 2,
    type: "activity",
    title: "Activity Completed",
    message: "Solar System Puzzle was completed with a score of 95%.",
    time: "2 hours ago",
    unread: true,
    icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
    bg: "bg-emerald-100 dark:bg-emerald-900/50",
  },
  {
    id: 3,
    type: "assignment",
    title: "New Assignment",
    message: "Basic Fractions Worksheet is due tomorrow.",
    time: "Yesterday",
    unread: false,
    icon: <FileText className="w-5 h-5 text-purple-500" />,
    bg: "bg-purple-100 dark:bg-purple-900/50",
  },
  {
    id: 4,
    type: "subscription",
    title: "Subscription Reminder",
    message: "Your Family Premium plan renews in 3 days.",
    time: "2 days ago",
    unread: false,
    icon: <CreditCard className="w-5 h-5 text-slate-500" />,
    bg: "bg-slate-100 dark:bg-slate-800",
  },
];

export default function NotificationsSection() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8 text-purple-500" /> Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
            Stay updated on your child&apos;s progress and account alerts.
          </p>
        </div>
        <Button
          variant="ghost"
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold"
        >
          <Check className="w-4 h-4 mr-2" /> Mark all as read
        </Button>
      </div>

      <div className="space-y-4 max-w-4xl">
        {MOCK_NOTIFICATIONS.map((notif) => (
          <Card
            key={notif.id}
            className={`rounded-[24px] border-slate-200/60 dark:border-slate-800/60 transition-colors shadow-sm hover:shadow-md ${notif.unread ? "bg-white dark:bg-slate-900/80" : "bg-slate-50/50 dark:bg-slate-900/40"}`}
          >
            <CardContent className="p-6 flex gap-4 md:gap-6 items-start">
              <div
                className={`w-12 h-12 rounded-full ${notif.bg} flex items-center justify-center shrink-0`}
              >
                {notif.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-1 mb-1">
                  <h3
                    className={`text-base font-bold ${notif.unread ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}
                  >
                    {notif.title}
                  </h3>
                  <span className="text-xs font-bold text-slate-400 shrink-0">{notif.time}</span>
                </div>
                <p
                  className={`text-sm ${notif.unread ? "text-slate-600 dark:text-slate-300 font-medium" : "text-slate-500 dark:text-slate-500"}`}
                >
                  {notif.message}
                </p>

                {notif.unread && (
                  <div className="mt-4 flex gap-3">
                    <Button
                      size="sm"
                      className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 px-4"
                    >
                      View Details
                    </Button>
                  </div>
                )}
              </div>

              {notif.unread && (
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0 mt-2" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
