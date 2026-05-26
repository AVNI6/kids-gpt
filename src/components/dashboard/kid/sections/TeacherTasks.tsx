import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, BookOpenText, CheckCircle2, AlertCircle } from "lucide-react";

export function TeacherTasksSkeleton() {
  return (
    <Card className="rounded-[32px] border-sky-100 bg-white shadow-sm">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-8 w-48 bg-slate-100" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl bg-slate-100" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeacherTasks() {
  const tasks = [
    {
      id: "1",
      title: "Math: Homework Sheet 4",
      subject: "Math",
      dueDate: "Tomorrow at 8:00 AM",
      xpReward: 50,
      icon: FileText,
      status: "pending",
      color: "bg-violet-50 text-violet-600 border-violet-100",
      iconColor: "bg-violet-100 text-violet-600",
    },
    {
      id: "2",
      title: "English: Spelling Bee prep",
      subject: "English",
      dueDate: "Friday",
      xpReward: 30,
      icon: BookOpenText,
      status: "started",
      color: "bg-blue-50 text-blue-600 border-blue-100",
      iconColor: "bg-blue-100 text-blue-600",
    },
  ];

  return (
    <section className="space-y-4 h-full flex flex-col">
      <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
        Homework & Tasks 📝
      </h2>
      <Card className="rounded-[32px] border-violet-200 bg-linear-to-br from-violet-500 to-fuchsia-600 shadow-sm flex-1">
        <CardContent className="p-6 text-white h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <p className="font-bold text-violet-100">You have {tasks.length} tasks pending</p>
            <Badge className="bg-white/20 hover:bg-white/30 text-white rounded-full">New</Badge>
          </div>

          <div className="space-y-3 flex-1">
            {tasks.map((task) => {
              const Icon = task.icon;
              return (
                <div
                  key={task.id}
                  className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-md flex items-center justify-between group hover:bg-white/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${task.iconColor} bg-white shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg leading-tight">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-violet-100 text-sm font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Due {task.dueDate} • +{task.xpReward} XP
                      </div>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    className="rounded-full bg-white text-violet-600 hover:bg-violet-50 shadow-md group-hover:scale-110 transition-transform"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </Button>
                </div>
              );
            })}
          </div>

          <Button className="w-full mt-6 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold backdrop-blur-sm">
            View All Assignments
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
