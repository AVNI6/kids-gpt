"use client";

import { useState } from "react";
import { ArrowRight, RotateCcw, Sparkles, Timer } from "lucide-react";

import { Button } from "@/components/shared/ui/button";
import { Progress } from "@/components/shared/ui/progress";
import { Card, CardContent } from "@/components/shared/ui/card";

export type ActivityStep = {
  title: string;
  detail: string;
};

type ActivityPracticeProps = {
  title: string;
  tag: string;
  description: string;
  tip: string;
  steps: ActivityStep[];
  reward: string;
};

export default function ActivityPractice({
  title,
  tag,
  description,
  tip,
  steps,
  reward,
}: ActivityPracticeProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  const handleNext = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const handleReset = () => {
    setCurrentStep(0);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="px-8 py-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span className="font-semibold">Your Mission Progress</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                <Timer className="h-4 w-4 text-orange-500" /> Step {currentStep + 1} of{" "}
                {steps.length}
              </span>
            </div>
            <Progress value={progress} className="h-3 rounded-full" />
          </div>

          <Card className="border-2 border-slate-100 shadow-sm">
            <CardContent className="grid gap-6 p-6 md:grid-cols-[1.1fr_1fr]">
              <div className="rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white p-6 flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider">{tag}</span>
                <p className="text-lg font-semibold">{title}</p>
                <p className="text-sm opacity-90">{description}</p>
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-slate-800">{step.title}</h2>
                <p className="text-sm text-slate-500">{step.detail}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-600 text-white flex items-center justify-center">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Keep going!</h3>
                  <p className="text-sm text-slate-600">{reward}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="rounded-full" onClick={handleReset}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button onClick={handleNext} className="rounded-full bg-sky-600 hover:bg-sky-700">
                  Next Challenge <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardContent className="flex flex-col gap-3 p-6">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Pro Explorer Tip
              </span>
              <p className="text-slate-700">{tip}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
