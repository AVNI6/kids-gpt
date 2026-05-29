import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy } from "lucide-react";
import type { LinkedChildProfile } from "@/types/dashboard.types";
import { displayAge } from "@/utils/childAge";
import { displayGrade } from "@/utils/childGrade";
import { getSafeXP } from "@/hooks/useChildXP";

// --- Helpers ---
const getInitials = (child: LinkedChildProfile) =>
  ((child.first_name?.[0] || "") + (child.last_name?.[0] || "")).trim() || "C";

const getFullName = (child: LinkedChildProfile) =>
  [child.first_name, child.last_name].filter(Boolean).join(" ") || "Student";

const getUsername = (child: LinkedChildProfile) =>
  child.username ? `@${child.username}` : `@${child.first_name?.toLowerCase() || "student"}`;

type ChildOverviewCardProps = {
  child: LinkedChildProfile | null;
};

export default function ChildOverviewCard({ child }: ChildOverviewCardProps) {
  if (!child) {
    return (
      <Card className="rounded-[28px] border-sky-100 bg-white shadow-sm">
        <CardContent className="p-8 text-center text-slate-500 font-medium">
          No child profile selected.
        </CardContent>
      </Card>
    );
  }

  const initials = getInitials(child);
  const fullName = getFullName(child);
  const username = getUsername(child);

  const gradeText = displayGrade(child.standard);
  const ageText = displayAge(child.date_of_birth);

  return (
    <Card className="rounded-[32px] border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/40 shadow-sm relative overflow-hidden backdrop-blur-xl">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 relative z-10">
        {/* Left/Center Align: Avatar & Info */}
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 flex-1 text-center md:text-left">
          <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-white dark:border-slate-800 shadow-xl ring-4 ring-sky-500/10 dark:ring-sky-400/20 shrink-0 transition-transform duration-500 hover:scale-105">
            <AvatarImage
              src={child.avatar_url ?? undefined}
              alt={fullName}
              className="object-cover"
            />
            <AvatarFallback className="text-4xl font-black bg-gradient-to-br from-sky-400 to-sky-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {fullName}
            </h2>
            <p className="text-base font-semibold text-slate-500 dark:text-slate-400">{username}</p>
            <div className="pt-2 flex flex-wrap gap-2 justify-center md:justify-start">
              <Badge
                variant="secondary"
                className="bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-500/30 text-sm px-4 py-1.5 font-bold border-none rounded-full shadow-sm backdrop-blur-sm"
              >
                {gradeText}
              </Badge>
              {ageText && (
                <Badge
                  variant="secondary"
                  className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-500/30 text-sm px-4 py-1.5 font-bold border-none rounded-full shadow-sm backdrop-blur-sm"
                >
                  {ageText}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Right Align: Micro-stats container */}
        <div className="flex w-full md:w-auto gap-4 shrink-0">
          <div className="flex-1 md:flex-none flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 border border-orange-200/50 dark:border-orange-500/20 rounded-3xl p-5 md:px-8 shadow-sm backdrop-blur-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400 font-black text-[11px] uppercase tracking-widest relative z-10">
              <Flame className="w-5 h-5 fill-orange-500 text-orange-500" />
              <span>Streak</span>
            </div>
            <div className="flex items-baseline gap-1.5 relative z-10">
              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                {child.current_streak || 0}
              </span>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">days</span>
            </div>
          </div>

          <div className="flex-1 md:flex-none flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 border border-amber-200/50 dark:border-amber-500/20 rounded-3xl p-5 md:px-8 shadow-sm backdrop-blur-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400 font-black text-[11px] uppercase tracking-widest relative z-10">
              <Trophy className="w-5 h-5 fill-amber-500 text-amber-500" />
              <span>Lifetime XP</span>
            </div>
            <div className="flex items-baseline gap-1.5 relative z-10">
              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                {getSafeXP(child.total_experience_points)}
              </span>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">xp</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
