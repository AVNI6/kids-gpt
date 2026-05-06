"use client";

import { useState } from "react";
import { Terminal, CheckCircle2, ChevronRight, Bot, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="min-h-screen bg-background">
      <main className="px-8 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <Link
            href="/activities"
            className="inline-flex items-center gap-2 text-muted-foreground font-bold hover:text-foreground hover:-translate-x-1 transition-transform bg-card px-4 py-2 rounded-full shadow-sm border border-border w-fit"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Activities
          </Link>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-foreground font-bold">
              <span>Hacker Progress</span>
              <span className="flex items-center gap-2 rounded-full bg-card px-3 py-1 shadow-sm border border-border">
                <Terminal className="h-4 w-4 text-muted-foreground" /> Quest {currentQuest + 1}
              </span>
            </div>
            <Progress value={progress} className="h-3 rounded-full bg-muted [&>div]:bg-sky-500" />
          </div>

          <Card className="border-4 border-border shadow-xl rounded-[2rem] bg-card text-foreground overflow-hidden">
            <div className="bg-muted p-4 flex items-center gap-2 border-b-4 border-border">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-4 font-mono text-sm text-muted-foreground">quest.exe</span>
            </div>
            <CardContent className="p-8 md:p-12 space-y-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Bot className="h-8 w-8 text-sky-500" />
                {quest.goal}
              </h2>

              <div className="bg-muted/50 p-6 rounded-2xl border-2 border-border flex justify-around text-5xl">
                {quest.grid.map((item, i) => (
                  <span key={i}>{item}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
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
                  className={`flex items-center justify-between p-6 rounded-2xl border-4 font-mono text-xl md:text-2xl font-bold transition-all duration-200 ${
                    showSuccess
                      ? "border-green-500 bg-green-500/10 text-green-600 scale-[1.02]"
                      : showError
                        ? "border-red-500 bg-red-500/10 text-red-600 opacity-60"
                        : "border-border bg-card text-muted-foreground hover:border-sky-500/50 hover:bg-sky-500/5 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <ChevronRight
                      className={`h-6 w-6 ${isSelected ? "opacity-0" : "text-muted-foreground/50"}`}
                    />
                    {opt.code}
                  </div>
                  {showSuccess && <CheckCircle2 className="h-8 w-8 text-green-500" />}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div className="flex justify-center mt-8 animate-in fade-in">
              <Button
                onClick={handleNext}
                className="h-16 px-12 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-xl font-bold shadow-[0_8px_0px_0px_rgba(2,132,199,0.5)] active:translate-y-2 active:shadow-none transition-all dark:shadow-none"
              >
                Run Next Program
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
