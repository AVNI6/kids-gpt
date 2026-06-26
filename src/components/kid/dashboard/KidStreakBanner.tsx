import { getKidStats } from "@/lib/services/kid/dashboard.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getSafeXP } from "@/hooks/kid/useChildXP";
import StreakDisplay from "@/components/ui/StreakDisplay";

function getInitials(firstName: string | null, lastName: string | null) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim();
  return initials || "K";
}

export default async function KidStreakBanner() {
  const stats = await getKidStats();
  const greetingName = stats.first_name ?? "there";

  return (
    <Card className="overflow-hidden rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm">
      <CardContent className="flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between min-w-0">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Avatar
            size="lg"
            className="h-16 w-16 rounded-3xl border-2 border-white shadow-md dark:border-slate-800 dark:shadow-none shrink-0"
          >
            <AvatarImage src={stats.avatar_url ?? undefined} />
            <AvatarFallback className="rounded-3xl bg-slate-200 text-slate-800 font-black dark:bg-slate-800 dark:text-slate-200">
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
          <StreakDisplay streak={stats.current_streak} variant="kid-card" />

          <div className="rounded-[28px] border border-slate-200/60 bg-white/90 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em] sm:tracking-[0.16em] text-sky-700 dark:text-sky-400">
              Experience points
            </div>
            <div className="mt-2.5 flex flex-col">
              <span className="text-3xl sm:text-4xl font-black leading-none text-slate-950 dark:text-slate-50">
                {getSafeXP(stats.total_experience_points)}
              </span>
              <span className="mt-1 text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
                total xp
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
