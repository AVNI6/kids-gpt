import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, PlayCircle, Target } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import StreakDisplay from "@/components/dashboard/StreakDisplay";

type WelcomeHubProfile = {
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
};

type WelcomeHubDetails = {
  total_xp: number;
  total_completed: number;
  current_streak: number;
};

export function WelcomeHubSkeleton() {
  return (
    <Card className="rounded-[36px] border-sky-100 bg-white shadow-sm overflow-hidden">
      <CardContent className="p-8 space-y-6">
        <div className="flex gap-4 items-center">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WelcomeHub({
  profile,
  details,
}: {
  profile: WelcomeHubProfile;
  details: WelcomeHubDetails;
}) {
  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "Student";
  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.trim() || "K";
  const xp = details.total_xp || 0;
  const level = Math.floor(xp / 1000) + 1;
  const nextLevelXp = level * 1000;
  const progressToNext = (xp % 1000) / 10; // Percentage

  return (
    <Card className="relative overflow-hidden rounded-[36px] border-sky-100 bg-linear-to-br from-sky-400 via-blue-500 to-indigo-500 text-white shadow-xl shadow-sky-200/50">
      {/* Decorative background elements */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-10 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />

      <CardContent className="relative z-10 p-8 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Welcome Text & Avatar */}
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20 ring-4 ring-white/30 shadow-2xl">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-sky-200 text-sky-800 text-2xl font-black">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md">
                  Welcome back, {displayName}!{" "}
                  <span className="inline-block animate-bounce">👋</span>
                </h1>
              </div>
              <p className="mt-2 text-sky-100 font-medium text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                You&apos;ve completed {details.total_completed} activities and earned {xp} XP!
              </p>
            </div>
          </div>

          {/* Top Badges */}
          <div className="flex gap-3 flex-wrap">
            <StreakDisplay streak={details.current_streak} variant="glass-badge" />
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 shadow-inner">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase text-sky-100">Level {level}</span>
                <span className="font-black leading-none">{xp} XP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Progress to next level */}
          <div className="bg-white/10 rounded-3xl p-5 border border-white/20 backdrop-blur-sm">
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Target className="w-4 h-4 text-sky-200" />
                Next Goal: Level {level + 1}
              </div>
              <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
                {nextLevelXp - xp} XP to go
              </span>
            </div>
            <Progress
              value={progressToNext}
              className="h-3 bg-black/20"
              indicatorClassName="bg-gradient-to-r from-yellow-300 to-yellow-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 items-center">
            <Button
              size="lg"
              className="rounded-full bg-white text-sky-600 hover:bg-sky-50 shadow-xl flex-1 font-black text-lg h-14 transition-transform hover:-translate-y-1"
            >
              <PlayCircle className="w-6 h-6 mr-2" />
              Continue Learning
            </Button>
            <Link href="/dashboard/kid/ai-tutor">
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full bg-sky-800/40 text-white hover:bg-sky-800/60 border border-white/20 shadow-lg font-bold h-14 px-6 transition-transform hover:-translate-y-1"
              >
                AI Tutor
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
