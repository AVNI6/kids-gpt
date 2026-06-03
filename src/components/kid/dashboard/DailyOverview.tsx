import { Card, CardContent } from "@/components/shared/ui/card";
import { Skeleton } from "@/components/shared/ui/skeleton";
import { Trophy, Clock, Target, ActivitySquare } from "lucide-react";
import { getSafeStreak } from "@/hooks/kid/useChildStreak";

type DailyOverviewDetails = {
  total_completed: number;
  learning_time_mins: number;
  quiz_accuracy: number;
};

type DailyOverviewProfile = {
  current_streak: number;
  longest_streak: number;
};

export function DailyOverviewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48 bg-slate-100" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-36 rounded-[28px] bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

export default function DailyOverview({
  details,
  profile,
}: {
  details: DailyOverviewDetails;
  profile: DailyOverviewProfile;
}) {
  const stats = [
    {
      label: "Activities Done",
      value: details.total_completed,
      icon: ActivitySquare,
      color: "from-sky-100 to-blue-50",
      iconColor: "text-blue-500 bg-blue-100",
      trend: "+2 today",
      trendColor: "text-blue-600",
    },
    {
      label: "Learning Time",
      value: `${details.learning_time_mins}m`,
      icon: Clock,
      color: "from-emerald-100 to-teal-50",
      iconColor: "text-emerald-500 bg-emerald-100",
      trend: "Awesome!",
      trendColor: "text-emerald-600",
    },
    {
      label: "Quiz Accuracy",
      value: `${details.quiz_accuracy}%`,
      icon: Target,
      color: "from-fuchsia-100 to-pink-50",
      iconColor: "text-pink-500 bg-pink-100",
      trend: "Top 10%",
      trendColor: "text-pink-600",
    },
    {
      label: "Current Streak",
      value: getSafeStreak(profile.current_streak),
      icon: Trophy,
      color: "from-amber-100 to-yellow-50",
      iconColor: "text-amber-500 bg-amber-100",
      trend: `Best: ${getSafeStreak(profile.longest_streak)}`,
      trendColor: "text-amber-600",
    },
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
        Your Stats 📊
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card
              key={i}
              className={`rounded-[28px] border-none bg-linear-to-br ${stat.color} shadow-sm hover:-translate-y-1 transition-transform cursor-default`}
            >
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl ${stat.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                  <div className="text-sm font-bold text-slate-600 mb-2">{stat.label}</div>
                  <div
                    className={`text-xs font-bold px-2 py-1 bg-white/50 inline-block rounded-lg ${stat.trendColor}`}
                  >
                    {stat.trend}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
