"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { BookOpen, FlaskConical, Blocks, RotateCcw, Play, PlayCircle } from "lucide-react";

export function ContinueLearningSkeleton() {
  return (
    <Card className="rounded-[32px] border-sky-100 bg-white shadow-sm">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-8 w-48 bg-slate-100" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-72 rounded-[28px] bg-slate-100 shrink-0" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ContinueLearning() {
  // Mocking unfinished activities since the schema doesn't support them natively yet
  const unfinishedActivities = [
    {
      id: "1",
      title: "Science Quiz: Space",
      subject: "Science",
      progress: 65,
      timeRemaining: "5 mins",
      lastPlayed: "Today",
      xpReward: 50,
      icon: FlaskConical,
      color: "from-sky-50 to-indigo-50",
      borderColor: "border-sky-100",
      iconColor: "text-sky-600 bg-sky-100",
      progressColor: "bg-sky-500",
      progressBg: "bg-sky-100",
    },
    {
      id: "2",
      title: "Word Puzzle: Animals",
      subject: "English",
      progress: 40,
      timeRemaining: "10 mins",
      lastPlayed: "Yesterday",
      xpReward: 30,
      icon: BookOpen,
      color: "from-emerald-50 to-teal-50",
      borderColor: "border-emerald-100",
      iconColor: "text-emerald-600 bg-emerald-100",
      progressColor: "bg-emerald-500",
      progressBg: "bg-emerald-100",
    },
    {
      id: "3",
      title: "Logic Builder",
      subject: "Coding",
      progress: 20,
      timeRemaining: "15 mins",
      lastPlayed: "2 days ago",
      xpReward: 100,
      icon: Blocks,
      color: "from-amber-50 to-orange-50",
      borderColor: "border-amber-100",
      iconColor: "text-amber-600 bg-amber-100",
      progressColor: "bg-amber-500",
      progressBg: "bg-amber-100",
    },
  ];

  return (
    <Card className="rounded-[32px] border-sky-100 bg-white shadow-sm">
      <CardContent className="p-6 sm:p-7 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <PlayCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Continue Learning</h2>
            <p className="text-sm leading-6 text-slate-500 font-medium">
              Pick up right where you left off.
            </p>
          </div>
        </div>

        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {unfinishedActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <CarouselItem key={activity.id} className="pl-4 md:basis-1/2">
                  <div
                    className={`rounded-[28px] border ${activity.borderColor} bg-linear-to-br ${activity.color} p-5 h-full flex flex-col justify-between shadow-sm`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${activity.iconColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="bg-white/60 px-3 py-1 rounded-full text-xs font-bold text-slate-700">
                          +{activity.xpReward} XP
                        </span>
                      </div>
                      <h3 className="font-bold text-lg leading-tight text-slate-900 mb-1">
                        {activity.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mb-4">
                        {activity.timeRemaining} left • Played {activity.lastPlayed}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>Progress</span>
                          <span>{activity.progress}%</span>
                        </div>
                        <Progress
                          value={activity.progress}
                          className={`h-2 ${activity.progressBg}`}
                          indicatorClassName={activity.progressColor}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button className="flex-1 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold shadow-sm h-10">
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl border-slate-200 bg-white/50 text-slate-600 hover:bg-white h-10 w-10"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </CardContent>
    </Card>
  );
}
