import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BookOpen, FlaskConical, Clock3, Sparkles } from "lucide-react";

type LessonCard = {
  subject: string;
  title: string;
  description: string;
  accent: string;
  badgeClassName: string;
  icon: React.ComponentType<{ className?: string }>;
};

const lessons: LessonCard[] = [
  {
    subject: "Math",
    title: "Introduction to Fractions",
    description: "Learn about halves, quarters and thirds using pizza slices!",
    accent: "from-indigo-50 via-white to-white border-indigo-200/70 shadow-indigo-100/60",
    badgeClassName: "bg-indigo-100 text-indigo-700",
    icon: BookOpen,
  },
  {
    subject: "Science",
    title: "The Water Cycle",
    description: "How does rain happen? Explore evaporation and condensation.",
    accent: "from-amber-50 via-white to-white border-amber-200/70 shadow-amber-100/60",
    badgeClassName: "bg-amber-100 text-amber-700",
    icon: FlaskConical,
  },
];

export default function TodaysLessonsGrid() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-violet-500" />
        <h2 className="text-xl font-black tracking-tight text-slate-950">Today&apos;s Lessons</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {lessons.map((lesson) => {
          const Icon = lesson.icon;

          return (
            <Card
              key={lesson.title}
              className={cn(
                "rounded-[28px] border bg-linear-to-br p-0 shadow-sm transition-transform duration-200 hover:-translate-y-0.5",
                lesson.accent
              )}
            >
              <CardContent className="flex h-full min-h-[220px] flex-col p-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                    <Icon className="h-6 w-6 text-slate-700" />
                  </div>
                  <Badge
                    className={cn(
                      "rounded-full px-3 py-1 font-bold uppercase tracking-wide",
                      lesson.badgeClassName
                    )}
                  >
                    {lesson.subject}
                  </Badge>
                </div>

                <div className="mt-5 space-y-2">
                  <h3 className="text-2xl font-black leading-tight text-slate-950">
                    {lesson.title}
                  </h3>
                  <p className="max-w-sm text-sm leading-6 text-slate-500">{lesson.description}</p>
                </div>

                <div className="mt-auto flex items-center justify-between pt-5">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock3 className="h-4 w-4" />
                    12 min lesson
                  </div>
                  <Button
                    className={cn(
                      "h-10 rounded-full px-5 font-semibold text-white shadow-sm",
                      lesson.subject === "Math"
                        ? "bg-indigo-500 hover:bg-indigo-600"
                        : "bg-amber-500 hover:bg-amber-600"
                    )}
                  >
                    Start Lesson
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
