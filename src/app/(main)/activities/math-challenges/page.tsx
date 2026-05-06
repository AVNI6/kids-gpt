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
    <div className="min-h-screen bg-background">
      <main className="px-8 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <Link
            href={APP_ROUTES.Activities}
            className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 hover:-translate-x-1 transition-transform bg-card px-4 py-2 rounded-full shadow-sm border border-border w-fit"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Activities
          </Link>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-blue-600 font-bold">
              <span>Math Hero Progress</span>
              <span className="flex items-center gap-2 rounded-full bg-card px-3 py-1 shadow-sm border border-border">
                <Calculator className="h-4 w-4 text-blue-500" /> Score: {currentIndex * 10}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-3 rounded-full bg-blue-500/10 [&>div]:bg-blue-500"
            />
          </div>

          <Card className="border-4 border-blue-500/20 shadow-[0_12px_0px_0px_rgba(59,130,246,0.2)] rounded-[2rem] bg-card overflow-hidden">
            <div className="bg-blue-500 p-4 text-center">
              <h2 className="text-white font-black text-xl uppercase tracking-widest">
                Solve the Equation
              </h2>
            </div>
            <CardContent className="p-12 text-center">
              <div className="text-7xl font-black text-foreground tracking-widest font-mono">
                {eq.question.replace("?", selected !== null ? selected.toString() : "?")}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-6 mt-12">
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
                  className={`h-24 rounded-3xl border-4 text-4xl font-black transition-all duration-200 ${
                    showSuccess
                      ? "border-green-500 bg-green-500 text-white shadow-[0_8px_0px_0px_#16a34a] translate-y-2"
                      : showError
                        ? "border-red-500 bg-red-500 text-white opacity-70 translate-y-2"
                        : "border-blue-400/50 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 shadow-[0_8px_0px_0px_rgba(59,130,246,0.3)] hover:-translate-y-1 active:translate-y-2 active:shadow-none dark:shadow-none"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div className="flex justify-center mt-12 animate-in fade-in">
              <Button
                onClick={handleNext}
                className="h-16 px-12 rounded-full bg-blue-600 hover:bg-blue-700 text-xl font-bold shadow-[0_8px_0px_0px_#1d4ed8] active:translate-y-2 active:shadow-none transition-all"
              >
                Next Challenge <Trophy className="ml-2 h-6 w-6 text-yellow-400" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
