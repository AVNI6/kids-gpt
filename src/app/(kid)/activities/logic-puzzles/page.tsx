"use client";

import { useState } from "react";
import { Puzzle, Star, Brain, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/constant/AppRoutes";

const puzzles = [
  {
    sequence: ["🔴", "🔵", "🔴", "🔵", "🔴", "?"],
    options: [
      { id: "A", label: "🔴" },
      { id: "B", label: "🔵", correct: true },
      { id: "C", label: "🟡" },
    ],
    hint: "Notice how it alternates between red and blue!",
  },
  {
    sequence: ["⭐", "🌙", "⭐", "🌙", "⭐", "?"],
    options: [
      { id: "A", label: "⭐" },
      { id: "B", label: "🌙", correct: true },
      { id: "C", label: "☀️" },
    ],
    hint: "It goes star, moon, star, moon...",
  },
  {
    sequence: ["1", "2", "3", "1", "2", "?"],
    options: [
      { id: "A", label: "1" },
      { id: "B", label: "2" },
      { id: "C", label: "3", correct: true },
    ],
    hint: "The pattern is 1, 2, 3 repeating.",
  },
];

export default function LogicPuzzlesPage() {
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const puzzle = puzzles[currentPuzzle];
  const progress = ((currentPuzzle + 1) / puzzles.length) * 100;

  const handleNext = () => {
    setCurrentPuzzle((prev) => (prev + 1) % puzzles.length);
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="px-8 py-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <Link
            href={APP_ROUTES.Activities}
            className="inline-flex items-center gap-2 text-purple-600 font-bold hover:text-purple-800 hover:-translate-x-1 transition-transform bg-card px-4 py-2 rounded-full shadow-sm border border-border w-fit"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Activities
          </Link>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-purple-600 font-bold">
              <span>Detective Progress</span>
              <span className="flex items-center gap-2 rounded-full bg-card px-3 py-1 shadow-sm border border-border">
                <Brain className="h-4 w-4 text-purple-500" /> Level {currentPuzzle + 1}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-3 rounded-full bg-purple-500/10 [&>div]:bg-purple-500"
            />
          </div>

          <Card className="border-4 border-purple-500/20 shadow-xl rounded-[2rem] bg-card">
            <CardContent className="p-8 text-center space-y-8">
              <div className="mx-auto bg-purple-500/10 w-20 h-20 rounded-full flex items-center justify-center">
                <Puzzle className="h-10 w-10 text-purple-600" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-foreground mb-2">What comes next?</h2>
                <p className="text-purple-500 font-medium">{puzzle.hint}</p>
              </div>

              <div className="flex justify-center gap-4 text-5xl bg-background/50 p-8 rounded-[2rem] shadow-inner border-2 border-border">
                {puzzle.sequence.map((item, i) => (
                  <span key={i} className={item === "?" ? "text-purple-400 animate-pulse" : ""}>
                    {item}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {puzzle.options.map((option) => {
              const isSelected = selected === option.id;
              const isCorrect = option.correct;
              const showSuccess = isSelected && isCorrect;
              const showError = isSelected && !isCorrect;

              return (
                <button
                  key={option.id}
                  onClick={() => !selected && setSelected(option.id)}
                  disabled={selected !== null}
                  className={`relative flex flex-col items-center justify-center gap-4 rounded-[2rem] border-4 p-8 text-4xl transition-all duration-300 ${
                    showSuccess
                      ? "border-green-500 bg-green-500/10 scale-105"
                      : showError
                        ? "border-red-500 bg-red-500/10 opacity-50"
                        : "border-purple-500/20 bg-card hover:-translate-y-2 hover:shadow-xl hover:border-purple-500/50"
                  }`}
                >
                  {option.label}
                  {showSuccess && (
                    <CheckCircle2 className="absolute top-4 right-4 h-8 w-8 text-green-500" />
                  )}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4">
              <Button
                onClick={handleNext}
                className="h-16 px-12 rounded-full bg-purple-600 hover:bg-purple-700 text-xl font-bold shadow-[0_8px_0px_0px_#581c87] active:translate-y-2 active:shadow-none transition-all"
              >
                Next Puzzle <Star className="ml-2 h-6 w-6" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
