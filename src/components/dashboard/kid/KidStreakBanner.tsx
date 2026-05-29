import { Flame } from "lucide-react";

import { getKidStats } from "@/actions/dashboard.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getSafeXP } from "@/hooks/useChildXP";
import { getSafeStreak } from "@/hooks/useChildStreak";

function getInitials(firstName: string | null, lastName: string | null) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim();
  return initials || "K";
}

export default async function KidStreakBanner() {
  const stats = await getKidStats();
  const greetingName = stats.first_name ?? "there";

  return (
    <Card className="overflow-hidden rounded-[32px] border-amber-200/70 bg-linear-to-br from-amber-50 via-yellow-50 to-white shadow-sm dark:border-slate-800 dark:bg-linear-to-br dark:from-slate-900 dark:to-slate-950">
      <CardContent className="flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between min-w-0">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Avatar
            size="lg"
            className="h-16 w-16 rounded-3xl border-2 border-white shadow-lg shadow-amber-200/60 dark:border-slate-800 dark:shadow-none shrink-0"
          >
            <AvatarImage src={stats.avatar_url ?? undefined} />
            <AvatarFallback className="rounded-3xl bg-linear-to-br from-amber-400 to-yellow-500 text-white font-black">
              {getInitials(stats.first_name, stats.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-slate-50 truncate">
              Hi, {greetingName}! 👋
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-400 break-words">
              You&apos;re doing great. Keep learning, keep exploring, and protect your streak.
            </p>
          </div>
        </div>

        <div className="grid gap-3 grid-cols-2 lg:w-[340px] shrink-0">
          <div className="rounded-[28px] border border-amber-100 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-none">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
              <Flame className="h-4 w-4" />
              Learning streak
            </div>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-4xl font-black leading-none text-slate-950 dark:text-slate-50">
                {getSafeStreak(stats.current_streak)}
              </span>
              <span className="pb-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                days straight!
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400 dark:hover:bg-amber-950/60">
                Today&apos;s streak
              </Badge>
            </div>
          </div>

          <div className="rounded-[28px] border border-amber-100 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-none">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Experience points
            </div>
            <div className="mt-3 text-4xl font-black leading-none text-slate-950 dark:text-slate-50">
              {getSafeXP(stats.total_experience_points)}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-1 dark:bg-slate-850 dark:text-slate-300"
              >
                Longest: {getSafeStreak(stats.longest_streak)} days
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
