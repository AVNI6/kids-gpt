"use client";

import { useState } from "react";
import { Beaker, CheckCircle2, FlaskConical, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/constant/AppRoutes";

const experiments = [
  {
    title: "The Floating Egg",
    setup: "What happens when you add lots of salt to a glass of water with an egg in it?",
    options: [
      { id: "A", label: "The egg sinks faster", correct: false },
      { id: "B", label: "The egg floats!", correct: true },
    ],
    explanation: "Salt makes the water more dense than the egg, causing it to float up to the top!",
  },
  {
    title: "Volcano Eruption",
    setup: "What do you mix with baking soda to make a fizzy eruption?",
    options: [
      { id: "A", label: "Vinegar", correct: true },
      { id: "B", label: "Water", correct: false },
    ],
    explanation:
      "Baking soda and vinegar create a chemical reaction that releases carbon dioxide gas bubbles!",
  },
];

export default function ScienceLabPage() {
  const [currentExp, setCurrentExp] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const exp = experiments[currentExp];
  const progress = ((currentExp + 1) / experiments.length) * 100;

  const handleNext = () => {
    setCurrentExp((prev) => (prev + 1) % experiments.length);
    setSelected(null);
  };

  return (
    <div className="h-full bg-background overflow-hidden flex flex-col">
      <main className="flex-1 px-4 py-4 md:px-8 md:py-5 overflow-hidden flex flex-col min-h-0">
        <div className="mx-auto max-w-4xl w-full h-full flex flex-col justify-between gap-3 min-h-0">
          <Link
            href={APP_ROUTES.Activities}
            className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm shrink-0"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Activities
          </Link>

          <div className="space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-xs text-emerald-600 font-bold">
              <span>Lab Notes</span>
              <span className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-0.5 shadow-sm border border-border">
                <FlaskConical className="h-3.5 w-3.5 text-emerald-500" /> Experiment{" "}
                {currentExp + 1}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2 rounded-full bg-emerald-500/10 [&>div]:bg-emerald-500"
            />
          </div>

          <Card className="border-4 border-emerald-500/20 shadow-md rounded-[1.5rem] overflow-hidden bg-card flex-1 flex flex-col min-h-0">
            <div className="bg-emerald-500 p-2.5 flex justify-center shrink-0">
              <div className="bg-white p-2 rounded-full shadow-inner">
                <Beaker className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <CardContent className="p-4 md:p-6 text-center flex-1 flex flex-col justify-center gap-3 min-h-0 overflow-y-auto">
              <h2 className="text-xl md:text-2xl font-black text-foreground shrink-0">
                {exp.title}
              </h2>
              <p className="text-base md:text-lg text-muted-foreground font-medium bg-emerald-500/5 p-4 rounded-xl border-2 border-emerald-500/10">
                {exp.setup}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            {exp.options.map((opt) => {
              const isSelected = selected === opt.id;
              const isCorrect = opt.correct;
              const showSuccess = isSelected && isCorrect;
              const showError = isSelected && !isCorrect;

              return (
                <button
                  key={opt.id}
                  onClick={() => !selected && setSelected(opt.id)}
                  disabled={selected !== null}
                  className={`p-4 md:p-6 rounded-2xl border-4 text-lg md:text-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    showSuccess
                      ? "border-green-500 bg-green-500/10 text-green-600 scale-[1.01]"
                      : showError
                        ? "border-red-500 bg-red-500/10 text-red-600 opacity-50"
                        : "border-emerald-500/20 bg-card text-emerald-600 hover:bg-emerald-500/5 hover:-translate-y-1 hover:shadow-md"
                  }`}
                >
                  <span>{opt.label}</span>
                  {showSuccess && <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="h-20 shrink-0 flex items-center justify-center">
            {selected !== null && (
              <div className="w-full flex items-center gap-3 bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex-1 text-emerald-600 font-bold text-sm md:text-base flex items-start gap-2 min-w-0">
                  <span className="text-2xl shrink-0">🔬</span>
                  <p className="truncate md:whitespace-normal md:line-clamp-2">{exp.explanation}</p>
                </div>
                <Button
                  onClick={handleNext}
                  className="h-10 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-[0_4px_0px_0px_#047857] active:translate-y-1 active:shadow-none transition-all shrink-0"
                >
                  Next Experiment
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
