"use client";

import { useState } from "react";
import { Type, Sparkles, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/constant/AppRoutes";

const words = [
  { scrambled: "A T C", answer: "CAT", hint: "Meow!" },
  { scrambled: "O D G", answer: "DOG", hint: "Woof!" },
  { scrambled: "R I B D", answer: "BIRD", hint: "Tweet tweet!" },
];

export default function WordScramblesPage() {
  const [currentWord, setCurrentWord] = useState(0);
  const [input, setInput] = useState("");
  const [showResult, setShowResult] = useState(false);

  const word = words[currentWord];
  const progress = ((currentWord + 1) / words.length) * 100;

  const isCorrect = input.toUpperCase() === word.answer;

  const handleCheck = () => {
    if (input) setShowResult(true);
  };

  const handleNext = () => {
    setCurrentWord((prev) => (prev + 1) % words.length);
    setInput("");
    setShowResult(false);
  };

  return (
    <div className="h-full bg-background overflow-hidden flex flex-col">
      <main className="flex-1 px-4 py-4 md:px-8 md:py-5 overflow-hidden flex flex-col min-h-0">
        <div className="mx-auto max-w-3xl w-full h-full flex flex-col justify-between gap-3 min-h-0">
          <Link
            href={APP_ROUTES.Activities}
            className="inline-flex items-center gap-2 text-pink-600 font-bold hover:text-pink-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm shrink-0"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Activities
          </Link>

          <div className="space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-xs text-pink-600 font-bold">
              <span>Word Magic Progress</span>
              <span className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-0.5 shadow-sm border border-border">
                Word {currentWord + 1}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2 rounded-full bg-pink-500/10 [&>div]:bg-pink-500"
            />
          </div>

          <Card className="border-4 border-pink-500/20 shadow-md rounded-[1.5rem] bg-card flex-1 flex flex-col min-h-0 overflow-hidden">
            <CardContent className="p-4 md:p-6 text-center flex-1 flex flex-col justify-center gap-4 min-h-0 overflow-y-auto">
              <div className="mx-auto bg-pink-500/10 w-16 h-16 rounded-full flex items-center justify-center shrink-0">
                <Type className="h-8 w-8 text-pink-600" />
              </div>

              <div className="shrink-0">
                <h2 className="text-lg md:text-xl font-bold text-muted-foreground mb-2">
                  Unscramble the letters!
                </h2>
                <div className="flex justify-center gap-3">
                  {word.scrambled.split(" ").map((letter, i) => (
                    <div
                      key={i}
                      className="bg-background border-4 border-pink-500/30 w-12 h-16 md:w-14 md:h-18 rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-black text-pink-600 shadow-sm rotate-[-2deg] hover:rotate-[2deg] transition-transform"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center shrink-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  disabled={showResult}
                  placeholder="Type your answer..."
                  className="w-full max-w-xs text-center text-2xl font-black uppercase tracking-widest p-3 rounded-2xl border-4 border-border bg-background focus:border-pink-500 focus:outline-none shadow-inner text-foreground"
                  maxLength={word.answer.length}
                />
              </div>

              <p className="text-pink-500 font-medium text-sm shrink-0">💡 Hint: {word.hint}</p>
            </CardContent>
          </Card>

          <div className="flex justify-center h-16 shrink-0">
            {!showResult ? (
              <Button
                onClick={handleCheck}
                className="h-10 px-8 rounded-full bg-pink-500 hover:bg-pink-600 text-base font-bold shadow-[0_4px_0px_0px_#be185d] active:translate-y-1 active:shadow-none transition-all"
              >
                Check Word <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-4 animate-in zoom-in">
                {isCorrect ? (
                  <div className="flex items-center gap-1.5 text-lg font-black text-green-500">
                    <CheckCircle2 className="h-5 w-5" /> You got it!
                  </div>
                ) : (
                  <div className="text-base font-bold text-red-500">
                    Oops! It was {word.answer}.
                  </div>
                )}
                <Button
                  onClick={handleNext}
                  className="h-10 px-8 rounded-full bg-pink-500 hover:bg-pink-600 text-base font-bold shadow-[0_4px_0px_0px_#be185d] active:translate-y-1 active:shadow-none transition-all"
                >
                  Next Word
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
