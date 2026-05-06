"use client";

import { useState } from "react";
import { Type, Sparkles, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="min-h-screen bg-background">
      <main className="px-8 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <Link
            href="/activities"
            className="inline-flex items-center gap-2 text-pink-600 font-bold hover:text-pink-800 hover:-translate-x-1 transition-transform bg-card px-4 py-2 rounded-full shadow-sm border border-border w-fit"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Activities
          </Link>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-pink-600 font-bold">
              <span>Word Magic Progress</span>
              <span className="flex items-center gap-2 rounded-full bg-card px-3 py-1 shadow-sm border border-border">
                Word {currentWord + 1}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-3 rounded-full bg-pink-500/10 [&>div]:bg-pink-500"
            />
          </div>

          <Card className="border-4 border-pink-500/20 shadow-xl rounded-[2rem] bg-card">
            <CardContent className="p-12 text-center space-y-8">
              <div className="mx-auto bg-pink-500/10 w-24 h-24 rounded-full flex items-center justify-center mb-4">
                <Type className="h-12 w-12 text-pink-600" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-muted-foreground mb-2">
                  Unscramble the letters!
                </h2>
                <div className="flex justify-center gap-4">
                  {word.scrambled.split(" ").map((letter, i) => (
                    <div
                      key={i}
                      className="bg-background border-4 border-pink-500/30 w-16 h-20 rounded-2xl flex items-center justify-center text-4xl font-black text-pink-600 shadow-sm rotate-[-2deg] hover:rotate-[2deg] transition-transform"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 flex flex-col items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  disabled={showResult}
                  placeholder="Type your answer..."
                  className="w-full max-w-sm text-center text-3xl font-black uppercase tracking-widest p-6 rounded-2xl border-4 border-border bg-background focus:border-pink-500 focus:outline-none shadow-inner text-foreground"
                  maxLength={word.answer.length}
                />
              </div>

              <p className="text-pink-500 font-medium">💡 Hint: {word.hint}</p>
            </CardContent>
          </Card>

          <div className="flex justify-center h-20">
            {!showResult ? (
              <Button
                onClick={handleCheck}
                className="h-16 px-12 rounded-full bg-pink-500 hover:bg-pink-600 text-xl font-bold shadow-[0_8px_0px_0px_#be185d] active:translate-y-2 active:shadow-none transition-all"
              >
                Check Word <Sparkles className="ml-2 h-6 w-6" />
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-4 animate-in zoom-in">
                {isCorrect ? (
                  <div className="flex items-center gap-2 text-2xl font-black text-green-500">
                    <CheckCircle2 className="h-8 w-8" /> You got it!
                  </div>
                ) : (
                  <div className="text-xl font-bold text-red-500">Oops! It was {word.answer}.</div>
                )}
                <Button
                  onClick={handleNext}
                  className="h-16 px-12 rounded-full bg-pink-500 hover:bg-pink-600 text-xl font-bold shadow-[0_8px_0px_0px_#be185d] active:translate-y-2 active:shadow-none transition-all"
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
