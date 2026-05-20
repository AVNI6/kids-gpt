"use client";

import { useState } from "react";
import { Calculator, Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/constant/AppRoutes";

const equations = [
  { question: "5 + 3 = ?", answer: 8, options: [6, 7, 8, 9] },
  { question: "10 - 4 = ?", answer: 6, options: [4, 5, 6, 7] },
  { question: "2 × 3 = ?", answer: 6, options: [5, 6, 7, 8] },
];

export default function MathChallengesPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const eq = equations[currentIndex];
  const progress = ((currentIndex + 1) / equations.length) * 100;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % equations.length);
    setSelected(null);
  };

  return (
    <div className="h-full bg-background overflow-hidden flex flex-col">
      <main className="flex-1 px-4 py-4 md:px-8 md:py-5 overflow-hidden flex flex-col min-h-0">
        <div className="mx-auto max-w-4xl w-full h-full flex flex-col justify-between gap-3 min-h-0">
          <Link
            href={APP_ROUTES.Activities}
            className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm shrink-0"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Activities
          </Link>

          <div className="space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-xs text-blue-600 font-bold">
              <span>Math Hero Progress</span>
              <span className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-0.5 shadow-sm border border-border">
                <Calculator className="h-3.5 w-3.5 text-blue-500" /> Score: {currentIndex * 10}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2 rounded-full bg-blue-500/10 [&>div]:bg-blue-500"
            />
          </div>

          <Card className="border-4 border-blue-500/20 shadow-md rounded-[1.5rem] bg-card overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="bg-blue-500 p-2.5 text-center shrink-0">
              <h2 className="text-white font-black text-sm uppercase tracking-widest">
                Solve the Equation
              </h2>
            </div>
            <CardContent className="p-6 text-center flex-1 flex items-center justify-center min-h-0 overflow-y-auto bg-blue-500/5">
              <div className="text-4xl md:text-5xl font-black text-foreground tracking-widest font-mono">
                {eq.question.replace("?", selected !== null ? selected.toString() : "?")}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4 mt-2 shrink-0">
            {eq.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrect = opt === eq.answer;
              const showSuccess = isSelected && isCorrect;
              const showError = isSelected && !isCorrect;

              return (
                <button
                  key={opt}
                  onClick={() => !selected && setSelected(opt)}
                  disabled={selected !== null}
                  className={`h-16 rounded-2xl border-4 text-2xl font-black transition-all duration-200 ${
                    showSuccess
                      ? "border-green-500 bg-green-500 text-white shadow-md translate-y-0.5"
                      : showError
                        ? "border-red-500 bg-red-500 text-white opacity-70 translate-y-0.5"
                        : "border-blue-400/50 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 shadow-sm hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none dark:shadow-none"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          <div className="h-12 flex justify-center shrink-0 mt-2">
            {selected !== null && (
              <div className="animate-in fade-in">
                <Button
                  onClick={handleNext}
                  className="h-10 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-base font-bold shadow-md active:translate-y-0.5 active:shadow-sm transition-all"
                >
                  Next Challenge <Trophy className="ml-1.5 h-4 w-4 text-yellow-400" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
