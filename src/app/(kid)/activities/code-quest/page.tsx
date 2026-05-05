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
    <div className="min-h-screen bg-slate-100">
      <main className="px-8 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <Link
            href="/activities"
            className="inline-flex items-center gap-2 text-slate-600 font-bold hover:text-slate-800 hover:-translate-x-1 transition-transform bg-white px-4 py-2 rounded-full shadow-sm border border-slate-300 w-fit"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Activities
          </Link>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-700 font-bold">
              <span>Hacker Progress</span>
              <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm border border-slate-300">
                <Terminal className="h-4 w-4 text-slate-500" /> Quest {currentQuest + 1}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-3 rounded-full bg-slate-200 [&>div]:bg-slate-700"
            />
          </div>

          <Card className="border-4 border-slate-300 shadow-xl rounded-[2rem] bg-white text-slate-800 overflow-hidden">
            <div className="bg-slate-100 p-4 flex items-center gap-2 border-b-4 border-slate-200">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-4 font-mono text-sm text-slate-500">quest.exe</span>
            </div>
            <CardContent className="p-8 md:p-12 space-y-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Bot className="h-8 w-8 text-sky-500" />
                {quest.goal}
              </h2>

              <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 flex justify-around text-5xl">
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
                      ? "border-green-500 bg-green-100 text-green-800 scale-[1.02]"
                      : showError
                        ? "border-red-500 bg-red-100 text-red-800 opacity-60"
                        : "border-slate-300 bg-white text-slate-700 hover:border-sky-400 hover:bg-sky-50 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <ChevronRight
                      className={`h-6 w-6 ${isSelected ? "opacity-0" : "text-slate-400"}`}
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
                className="h-16 px-12 rounded-full bg-slate-700 hover:bg-slate-800 text-white text-xl font-bold shadow-[0_8px_0px_0px_#334155] active:translate-y-2 active:shadow-none transition-all"
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
