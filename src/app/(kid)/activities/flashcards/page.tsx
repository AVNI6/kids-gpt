"use client";

import { useState } from "react";
import { RefreshCcw, CheckCircle2, RotateCcw, Sparkles, Rocket, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

const flashcards = [
  {
    question: 'Which planet is known as the "Red Planet"?',
    answer: "Mars",
    fact: "Mars gets its red color from iron oxide (rust).",
  },
  {
    question: "Which planet is the biggest in our solar system?",
    answer: "Jupiter",
    fact: "Jupiter has more than 95 moons!",
  },
];

export default function FlashcardsPage() {
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = flashcards[currentCard];
  const progress = ((currentCard + 1) / flashcards.length) * 100;

  const handleNext = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard((prev) => prev + 1);
      setFlipped(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="relative px-8 py-8">
        {/* Background blobs - modernized for theme compatibility */}
        <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-green-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <Link
            href="/activities"
            className="inline-flex items-center gap-2 text-sky-600 font-bold hover:text-sky-800 hover:-translate-x-1 transition-transform bg-card px-4 py-2 rounded-full shadow-sm border border-border w-fit mb-6"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Activities
          </Link>

          {/* Deck Info */}
          <div className="mb-8 space-y-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Current Deck
                </p>
                <h2 className="text-3xl font-black text-foreground">Solar System Wonders 🌍</h2>
              </div>

              <div>
                <p className="font-bold text-sky-600">
                  Card {currentCard + 1} of {flashcards.length}
                </p>
              </div>
            </div>

            <Progress value={progress} className="h-4 rounded-full bg-muted" />
          </div>

          {/* Flashcard Area */}
          <div className="relative">
            {/* Mascot Bubble */}
            <div className="absolute -top-20 left-0 z-20">
              <div className="rounded-3xl border-4 border-sky-500/20 bg-card p-4 shadow-xl max-w-[220px]">
                <p className="font-bold text-sky-600">{card.fact}</p>
              </div>
            </div>

            {/* Flashcard */}
            <Card className="border-4 border-sky-500 shadow-[12px_12px_0px_0px_rgba(14,165,233,0.2)] rounded-[30px] min-h-[500px] bg-card">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[500px]">
                {!flipped ? (
                  <>
                    <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-[30px] bg-sky-500/10">
                      <Rocket className="h-16 w-16 text-sky-600" />
                    </div>

                    <h2 className="text-4xl font-black text-foreground leading-tight">
                      {card.question}
                    </h2>

                    <p className="mt-6 text-sm font-bold uppercase text-muted-foreground">
                      Click to flip
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-[30px] bg-green-500/10">
                      <Sparkles className="h-16 w-16 text-green-600" />
                    </div>

                    <h2 className="text-5xl font-black text-green-600">{card.answer}</h2>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Flip button */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
              <Button
                onClick={() => setFlipped(!flipped)}
                className="h-16 rounded-2xl px-8 text-lg font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-[0_8px_0px_0px_rgba(12,74,110,0.5)] active:translate-y-1 active:shadow-none"
              >
                <RefreshCcw className="mr-2 h-5 w-5" />
                Flip Card
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Study Again */}
            <Card className="border-4 border-red-500/50 rounded-[24px] shadow-[0_8px_0px_0px_rgba(153,27,27,0.3)] cursor-pointer hover:-translate-y-1 transition-all bg-card">
              <CardContent className="flex flex-col items-center gap-3 py-8">
                <div className="rounded-full bg-red-500/10 p-4">
                  <RotateCcw className="h-8 w-8 text-red-600" />
                </div>

                <h3 className="text-2xl font-black text-red-600">Study Again</h3>

                <p className="text-muted-foreground">Need more practice</p>
              </CardContent>
            </Card>

            {/* Know This */}
            <Card
              onClick={handleNext}
              className="border-4 border-green-500/50 rounded-[24px] shadow-[0_8px_0px_0px_rgba(22,101,52,0.3)] cursor-pointer hover:-translate-y-1 transition-all bg-card"
            >
              <CardContent className="flex flex-col items-center gap-3 py-8">
                <div className="rounded-full bg-green-500/10 p-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>

                <h3 className="text-2xl font-black text-green-600">I Know This</h3>

                <p className="text-muted-foreground">Mastered it!</p>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <div className="rounded-full bg-card px-6 py-3 shadow-md border border-border">
              <span className="font-bold text-green-600">3 Mastered</span>
            </div>

            <div className="rounded-full bg-card px-6 py-3 shadow-md border border-border">
              <span className="font-bold text-red-500">1 Review</span>
            </div>

            <div className="rounded-full bg-card px-6 py-3 shadow-md border border-border">
              <span className="font-bold text-sky-600">8 Remaining</span>
            </div>
          </div>
        </div>
      </main>

      {/* Floating AI Help Button */}
      <Button
        size="icon"
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-sky-500 shadow-lg hover:bg-sky-600"
      >
        <Sparkles className="h-8 w-8" />
      </Button>
    </div>
  );
}
