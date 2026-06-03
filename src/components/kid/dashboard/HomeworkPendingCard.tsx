import { Badge } from "@/components/shared/ui/badge";
import { Card, CardContent } from "@/components/shared/ui/card";
import { CheckCircle2, ClipboardList, FileText, BookOpenText } from "lucide-react";

type HomeworkTask = {
  title: string;
  due: string;
  icon: React.ComponentType<{ className?: string }>;
};

const homeworkTasks: HomeworkTask[] = [
  {
    title: "Math: Homework Sheet 4",
    due: "Due tomorrow at 8:00 AM",
    icon: FileText,
  },
  {
    title: "English: Spelling Bee prep",
    due: "Due Friday",
    icon: BookOpenText,
  },
];

export default function HomeworkPendingCard() {
  return (
    <Card className="rounded-[28px] border-violet-200 bg-linear-to-br from-violet-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-200/50">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
              <ClipboardList className="h-4 w-4" />
              Homework
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Pending</h2>
          </div>
          <Badge className="rounded-full bg-white/20 px-3 py-1 text-white hover:bg-white/20">
            2 tasks
          </Badge>
        </div>

        <div className="space-y-3">
          {homeworkTasks.map((task) => {
            const Icon = task.icon;
            return (
              <div key={task.title} className="rounded-3xl bg-white/12 p-4 ring-1 ring-white/15">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold leading-6 text-white">{task.title}</p>
                    <p className="mt-1 text-sm text-white/75">{task.due}</p>
                  </div>
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-white/40" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
