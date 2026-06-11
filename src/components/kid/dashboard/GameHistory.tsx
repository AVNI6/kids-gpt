import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Clock, Gamepad2, Activity } from "lucide-react";

type GameHistoryItem = {
  id: string | number;
  created_at: string | number | Date | null;
  description?: string | null;
  rewards_amount?: number | string | null;
  activity_settings?: {
    id: string;
    slug: string;
    title: string;
  } | null;
};

export function GameHistorySkeleton() {
  return (
    <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm h-full">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-8 w-48 bg-slate-100 dark:bg-slate-800" />
        <div className="space-y-4 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full bg-slate-100 shrink-0 dark:bg-slate-800" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32 bg-slate-100 dark:bg-slate-800" />
                <Skeleton className="h-4 w-24 bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function GameHistory({ timeline }: { timeline: GameHistoryItem[] }) {
  const gameTimeline = timeline.slice(0, 10);

  return (
    <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm h-105.75 flex flex-col overflow-hidden">
      <CardContent className="p-6 sm:p-7 flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight dark:text-slate-50">
              Activity History
            </h2>
            <p className="text-sm leading-6 text-slate-500 font-medium dark:text-slate-400">
              What you&apos;ve done recently.
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4 h-full">
          {gameTimeline.length === 0 ? (
            <div className="text-center text-slate-500 py-8 dark:text-slate-400">
              <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No activities played yet!</p>
            </div>
          ) : (
            <div className="space-y-6 pb-15 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
              {gameTimeline.map((item) => {
                const date = item.created_at
                  ? new Date(item.created_at).toLocaleDateString("en-US")
                  : "";
                const isTopScore = (item.description || "").toLowerCase().includes("100%");

                return (
                  <div key={item.id} className="relative flex items-start gap-4 group is-active">
                    {/* Timeline dot */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-sky-50 text-sky-600 shadow-sm shrink-0 z-10 dark:border-slate-900 dark:bg-sky-950/40 dark:text-sky-400 dark:shadow-none">
                      {isTopScore ? (
                        <Trophy className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm transition-colors group-hover:bg-slate-100/50 dark:bg-slate-950 dark:border-slate-800/80 dark:group-hover:bg-slate-850/40">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-sky-600 text-sm dark:text-sky-400">
                          +{item.rewards_amount} XP
                        </div>
                        <time className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                          {date}
                        </time>
                      </div>
                      <div className="text-sm font-bold leading-tight text-slate-900 dark:text-slate-50">
                        {item.activity_settings?.title ||
                          (item.description
                            ? item.description
                                .replace(/^Completed\s+/i, "")
                                .replace(/\s*\(Score:\s*\d+%\)/i, "")
                            : "Completed Activity")}
                      </div>
                      {item.activity_settings &&
                        item.description &&
                        item.description !== item.activity_settings.title && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-snug">
                            {item.description}
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
