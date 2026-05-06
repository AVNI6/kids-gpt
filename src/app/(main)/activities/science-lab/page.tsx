"use client";

import { useState } from "react";
import { Beaker, CheckCircle2, FlaskConical, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="min-h-screen bg-background">
      <main className="px-8 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <Link
            href="/activities"
            className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-800 hover:-translate-x-1 transition-transform bg-card px-4 py-2 rounded-full shadow-sm border border-border w-fit"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Activities
          </Link>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-emerald-600 font-bold">
              <span>Lab Notes</span>
              <span className="flex items-center gap-2 rounded-full bg-card px-3 py-1 shadow-sm border border-border">
                <FlaskConical className="h-4 w-4 text-emerald-500" /> Experiment {currentExp + 1}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-3 rounded-full bg-emerald-500/10 [&>div]:bg-emerald-500"
            />
          </div>

          <Card className="border-4 border-emerald-500/20 shadow-xl rounded-[2rem] overflow-hidden bg-card">
            <div className="bg-emerald-500 p-6 flex justify-center">
              <div className="bg-white p-4 rounded-full shadow-inner">
                <Beaker className="h-12 w-12 text-emerald-600" />
              </div>
            </div>
            <CardContent className="p-10 text-center space-y-6">
              <h2 className="text-3xl font-black text-foreground">{exp.title}</h2>
              <p className="text-xl text-muted-foreground font-medium bg-emerald-500/5 p-6 rounded-2xl border-2 border-emerald-500/10">
                {exp.setup}
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
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
                  className={`p-8 rounded-3xl border-4 text-2xl font-bold transition-all duration-300 ${
                    showSuccess
                      ? "border-green-500 bg-green-500/10 text-green-600 scale-105"
                      : showError
                        ? "border-red-500 bg-red-500/10 text-red-600 opacity-50"
                        : "border-emerald-500/20 bg-card text-emerald-600 hover:bg-emerald-500/5 hover:-translate-y-2 hover:shadow-xl"
                  }`}
                >
                  {opt.label}
                  {showSuccess && (
                    <CheckCircle2 className="inline-block ml-3 h-8 w-8 text-green-500" />
                  )}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <Card className="bg-emerald-500/10 border-none shadow-none rounded-3xl">
                <CardContent className="p-6">
                  <p className="text-emerald-600 font-bold text-lg flex items-start gap-3">
                    <span className="text-3xl">🔬</span>
                    {exp.explanation}
                  </p>
                </CardContent>
              </Card>
              <div className="flex justify-center">
                <Button
                  onClick={handleNext}
                  className="h-16 px-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-xl font-bold shadow-[0_8px_0px_0px_#047857] active:translate-y-2 active:shadow-none transition-all"
                >
                  Next Experiment
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
