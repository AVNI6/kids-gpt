import { CalendarDays, Crown, UserRound, WandSparkles } from "lucide-react";

import { getKidStats } from "@/actions/dashboard.actions";
import { getSafeXP } from "@/hooks/useChildXP";
import { getSafeStreak } from "@/hooks/useChildStreak";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

import KidProfileEditorDialog from "./KidProfileEditorDialog";

function getInitials(firstName: string | null, lastName: string | null) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim();
  return initials || "K";
}

function formatDateOfBirth(dateOfBirth: string | null) {
  if (!dateOfBirth) {
    return "Not set yet";
  }

  const parsedDate = new Date(dateOfBirth);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateOfBirth;
  }

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);

  const age = new Date().getFullYear() - parsedDate.getFullYear();
  return `${formattedDate} (${age} Yrs)`;
}

export default async function KidProfileManager() {
  const profile = await getKidStats();
  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();

  return (
    <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start gap-4">
          <Avatar
            size="lg"
            className="h-20 w-20 rounded-3xl border-2 border-sky-100 shadow-sm shrink-0 dark:border-slate-800"
          >
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="rounded-3xl bg-sky-100 text-sky-700 font-black text-2xl dark:bg-sky-950/60 dark:text-sky-400">
              {getInitials(profile.first_name, profile.last_name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
              <UserRound className="h-4 w-4" />
              Profile summary
            </div>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">
              {displayName || "Your profile"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Keep your kid profile up to date right from the dashboard.
            </p>
          </div>

          <Badge className="rounded-full bg-sky-100 px-3 py-1 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-400 dark:hover:bg-sky-950/60">
            Active
          </Badge>
        </div>

        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              <Crown className="h-4 w-4 text-amber-500" />
              Points
            </div>
            <div className="mt-2 text-2xl font-black text-slate-950 dark:text-slate-50">
              {getSafeXP(profile.total_experience_points)}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              <CalendarDays className="h-4 w-4 text-violet-500" />
              Birthday
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
              {formatDateOfBirth(profile.date_of_birth)}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-linear-to-br from-sky-50 to-emerald-50 p-4 ring-1 ring-sky-100 dark:from-sky-950/20 dark:to-emerald-950/20 dark:ring-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-400">
            <WandSparkles className="h-4 w-4" />
            Learning streak
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-black leading-none text-slate-950 dark:text-slate-50">
              {profile.current_streak}
            </span>
            <span className="pb-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              days straight
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-transparent px-5 pb-5 pt-0">
        <KidProfileEditorDialog profile={profile} />
      </CardFooter>
    </Card>
  );
}
