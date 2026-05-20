"use client";

import { useState } from "react";
import { Terminal, CheckCircle2, ChevronRight, Bot, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/constant/AppRoutes";

const quests = [
  {
    goal: "Get the robot to the star!",
    grid: ["🤖", "⬜", "⬜", "⭐"],
    options: [
      { id: "A", code: "MOVE_FORWARD(1)", correct: false },
      { id: "B", code: "MOVE_FORWARD(3)", correct: true },
      { id: "C", code: "TURN_LEFT()", correct: false },
    ],
  },
  {
    goal: "Make the robot jump over the rock!",
    grid: ["🤖", "🪨", "⭐", "⬜"],
    options: [
      { id: "A", code: "JUMP()", correct: true },
      { id: "B", code: "MOVE_FORWARD(2)", correct: false },
    ],
  },
];

export default function CodeQuestPage() {
  const [currentQuest, setCurrentQuest] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const quest = quests[currentQuest];
  const progress = ((currentQuest + 1) / quests.length) * 100;

  const handleNext = () => {
    setCurrentQuest((prev) => (prev + 1) % quests.length);
    setSelected(null);
  };

  return (
    <div className="h-full bg-background overflow-hidden flex flex-col">
      <main className="flex-1 px-4 py-4 md:px-8 md:py-5 overflow-hidden flex flex-col min-h-0">
        <div className="mx-auto max-w-4xl w-full h-full flex flex-col justify-between gap-3 min-h-0">
          <Link
            href={APP_ROUTES.Activities}
            className="inline-flex items-center gap-2 text-muted-foreground font-bold hover:text-foreground hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm shrink-0"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Activities
          </Link>

          <div className="space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-xs text-foreground font-bold">
              <span>Hacker Progress</span>
              <span className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-0.5 shadow-sm border border-border">
                <Terminal className="h-3.5 w-3.5 text-muted-foreground" /> Quest {currentQuest + 1}
              </span>
            </div>
            <Progress value={progress} className="h-2 rounded-full bg-muted [&>div]:bg-sky-500" />
          </div>

          <Card className="border-4 border-border shadow-md rounded-[1.5rem] bg-card text-foreground overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="bg-muted p-2.5 flex items-center gap-1.5 border-b-4 border-border shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span className="ml-2 font-mono text-xs text-muted-foreground">quest.exe</span>
            </div>
            <CardContent className="p-4 md:p-6 flex-1 flex flex-col justify-center gap-4 min-h-0 overflow-y-auto">
              <h2 className="text-xl font-bold flex items-center gap-2.5 shrink-0">
                <Bot className="h-6 w-6 text-sky-500" />
                {quest.goal}
              </h2>

              <div className="bg-muted/50 p-4 rounded-xl border-2 border-border flex justify-around text-4xl shrink-0">
                {quest.grid.map((item, i) => (
                  <span key={i}>{item}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-2 shrink-0">
            {quest.options.map((opt) => {
              const isSelected = selected === opt.id;
              const isCorrect = opt.correct;
              const showSuccess = isSelected && isCorrect;
              const showError = isSelected && !isCorrect;

              return (
                <button
                  key={opt.id}
                  onClick={() => !selected && setSelected(opt.id)}
                  disabled={selected !== null}
                  className={`flex items-center justify-between p-3.5 rounded-xl border-4 font-mono text-base md:text-lg font-bold transition-all duration-200 ${
                    showSuccess
                      ? "border-green-500 bg-green-500/10 text-green-600 scale-[1.01]"
                      : showError
                        ? "border-red-500 bg-red-500/10 text-red-600 opacity-60"
                        : "border-border bg-card text-muted-foreground hover:border-sky-500/50 hover:bg-sky-500/5 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ChevronRight
                      className={`h-5 w-5 ${isSelected ? "opacity-0" : "text-muted-foreground/50"}`}
                    />
                    {opt.code}
                  </div>
                  {showSuccess && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                </button>
              );
            })}
          </div>

          <div className="h-12 flex justify-center shrink-0">
            {selected !== null && (
              <div className="animate-in fade-in">
                <Button
                  onClick={handleNext}
                  className="h-10 px-8 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-base font-bold shadow-[0_4px_0px_0px_rgba(2,132,199,0.5)] active:translate-y-1 active:shadow-none transition-all dark:shadow-none"
                >
                  Run Next Program
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
