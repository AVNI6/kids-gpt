import { Card, CardContent } from "@/components/shared/ui/card";
import { Skeleton } from "@/components/shared/ui/skeleton";
import { BellRing, Gift, Star, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/shared/ui/scroll-area";

export function NotificationsUpdatesSkeleton() {
  return (
    <Card className="rounded-[36px] border-sky-100 bg-white shadow-sm h-full">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-8 w-32 bg-slate-100" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl bg-slate-100" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function NotificationsUpdates() {
  const notifications = [
    {
      id: "1",
      title: "New Badge Unlocked!",
      desc: "You earned the Fast Learner badge.",
      time: "10 mins ago",
      icon: Gift,
      color: "text-rose-500 bg-rose-100",
    },
    {
      id: "2",
      title: "Teacher Feedback",
      desc: "Mrs. Smith graded your math quiz.",
      time: "1 hour ago",
      icon: Star,
      color: "text-amber-500 bg-amber-100",
    },
    {
      id: "3",
      title: "New Assignment",
      desc: "Science Lab: Planets added.",
      time: "2 hours ago",
      icon: BookOpen,
      color: "text-blue-500 bg-blue-100",
    },
  ];

  return (
    <Card className="rounded-[36px] border-slate-200 bg-slate-950 text-white shadow-xl h-full flex flex-col overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <BellRing className="w-32 h-32 text-white" />
      </div>
      <CardContent className="p-6 flex flex-col h-full relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <BellRing className="w-5 h-5 text-sky-400" />
          <h2 className="text-xl font-black tracking-tight">Alerts</h2>
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-3">
            {notifications.map((notif) => {
              const Icon = notif.icon;
              return (
                <div
                  key={notif.id}
                  className="flex gap-3 items-start p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:bg-slate-800 transition-colors"
                >
                  <div className={`p-2 rounded-full ${notif.color} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight text-slate-200">
                      {notif.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{notif.desc}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">{notif.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
