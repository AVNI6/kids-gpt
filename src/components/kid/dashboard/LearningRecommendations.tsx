import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Lightbulb, PlayCircle, BookmarkPlus } from "lucide-react";

export function LearningRecommendationsSkeleton() {
  return (
    <Card className="rounded-[32px] border-sky-100 bg-white shadow-sm h-full">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LearningRecommendations() {
  const recommendations = [
    {
      id: "1",
      title: "Fractions Practice",
      type: "Math Quiz",
      xp: 60,
      duration: "10 mins",
      color: "from-blue-500 to-sky-400",
      iconColor: "text-blue-100 bg-white/20",
    },
    {
      id: "2",
      title: "Solar System Explorer",
      type: "Science Game",
      xp: 80,
      duration: "15 mins",
      color: "from-emerald-500 to-teal-400",
      iconColor: "text-emerald-100 bg-white/20",
    },
  ];

  return (
    <section className="space-y-4 h-full flex flex-col">
      <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
        Picked For You <Lightbulb className="w-6 h-6 text-yellow-500 fill-yellow-500" />
      </h2>
      <Card className="rounded-[32px] border-sky-100 bg-white shadow-sm flex-1 dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="p-6 h-full flex flex-col gap-4">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            Based on your recent activities, AI Tutor suggests:
          </p>

          <div className="space-y-3 flex-1">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className={`rounded-2xl bg-gradient-to-r ${rec.color} p-4 text-white shadow-md flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-black text-lg leading-tight">{rec.title}</h4>
                    <p className="text-xs font-bold text-white/80 mt-1">
                      {rec.type} • {rec.duration}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full bg-white/20 text-white hover:bg-white/30 border-none"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="rounded-full bg-white text-slate-900 hover:bg-slate-100 shadow-sm"
                  >
                    <PlayCircle className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
