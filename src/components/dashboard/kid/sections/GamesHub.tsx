import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Gamepad2, Brain, Puzzle, Calculator, Play, Star } from "lucide-react";
import Link from "next/link";

export function GamesHubSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48 bg-slate-100" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-[24px] bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

export default function GamesHub() {
  const games = [
    {
      id: "math",
      title: "Math Challenge",
      difficulty: "Medium",
      xp: 50,
      icon: Calculator,
      color: "bg-rose-50 text-rose-600",
      iconBg: "bg-rose-500 text-white",
      href: "/activity/math-challenge",
    },
    {
      id: "word",
      title: "Word Scramble",
      difficulty: "Easy",
      xp: 30,
      icon: Puzzle,
      color: "bg-blue-50 text-blue-600",
      iconBg: "bg-blue-500 text-white",
      href: "/activity/word-scramble",
    },
    {
      id: "memory",
      title: "Memory Match",
      difficulty: "Hard",
      xp: 100,
      icon: Brain,
      color: "bg-emerald-50 text-emerald-600",
      iconBg: "bg-emerald-500 text-white",
      href: "/activity/memory-match",
    },
    {
      id: "logic",
      title: "Logic Puzzle",
      difficulty: "Hard",
      xp: 80,
      icon: Gamepad2,
      color: "bg-amber-50 text-amber-600",
      iconBg: "bg-amber-500 text-white",
      href: "/activity/logic-puzzle",
    },
  ];

  return (
    <section className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Games Hub 🎮
        </h2>
        <Button
          variant="ghost"
          className="text-sky-600 font-bold hover:text-sky-700 hover:bg-sky-50 rounded-full"
        >
          View All
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
        {games.map((game) => {
          const Icon = game.icon;
          return (
            <Card
              key={game.id}
              className={`rounded-[28px] border-none ${game.color} shadow-sm hover:shadow-md transition-shadow group overflow-hidden`}
            >
              <CardContent className="p-5 flex items-center gap-4 h-full">
                <div
                  className={`p-4 rounded-2xl ${game.iconBg} shadow-inner group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-8 h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-lg truncate text-slate-900">{game.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                      {game.difficulty}
                    </span>
                    <span className="text-xs font-bold flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-full text-slate-700">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />+{game.xp} XP
                    </span>
                  </div>
                </div>
                <Link href={game.href}>
                  <Button
                    size="icon"
                    className="rounded-full bg-white text-slate-900 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-colors"
                  >
                    <Play className="w-4 h-4 ml-0.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
