"use client";

import { useState } from "react";
import { Grid, RefreshCcw, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const initialCards = [
  { id: 1, emoji: "🐶", matched: false },
  { id: 2, emoji: "🐱", matched: false },
  { id: 3, emoji: "🐭", matched: false },
  { id: 4, emoji: "🐹", matched: false },
  { id: 5, emoji: "🐶", matched: false },
  { id: 6, emoji: "🐱", matched: false },
  { id: 7, emoji: "🐭", matched: false },
  { id: 8, emoji: "🐹", matched: false },
].sort(() => Math.random() - 0.5);

export default function MemoryMatchPage() {
  const [cards, setCards] = useState(initialCards);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [matches, setMatches] = useState(0);

  const handleCardClick = (index: number) => {
    if (disabled || flipped.includes(index) || cards[index].matched) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setDisabled(true);
      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        setCards((prev) =>
          prev.map((card, i) => (i === first || i === second ? { ...card, matched: true } : card))
        );
        setMatches((m) => m + 1);
        setFlipped([]);
        setDisabled(false);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, 1000);
      }
    }
  };

  const resetGame = () => {
    setCards(
      [...initialCards].sort(() => Math.random() - 0.5).map((c) => ({ ...c, matched: false }))
    );
    setFlipped([]);
    setMatches(0);
    setDisabled(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="px-8 py-8 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-8">
          <Link
            href="/activities"
            className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 hover:-translate-x-1 transition-transform bg-card px-4 py-2 rounded-full shadow-sm border border-border w-fit"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Activities
          </Link>

          <div className="flex items-center justify-between bg-card p-4 rounded-3xl border-4 border-indigo-500/20 shadow-sm">
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Grid className="text-indigo-500" /> Memory Match
            </h1>
            <div className="text-indigo-600 font-bold">Matches: {matches} / 4</div>
          </div>

          <div className="grid grid-cols-4 gap-4 sm:gap-6">
            {cards.map((card, i) => {
              const isFlipped = flipped.includes(i) || card.matched;
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(i)}
                  className={`aspect-square rounded-2xl border-4 transition-all duration-500 transform-gpu ${
                    isFlipped
                      ? "bg-card border-indigo-500/30 shadow-inner rotate-y-180"
                      : "bg-indigo-500 border-indigo-700 shadow-[0_6px_0px_0px_#4338ca] hover:-translate-y-1 hover:bg-indigo-400 dark:shadow-none"
                  }`}
                  style={{ perspective: "1000px" }}
                >
                  <div className="w-full h-full flex items-center justify-center text-4xl sm:text-6xl transition-opacity duration-300">
                    <span className={isFlipped ? "opacity-100" : "opacity-0"}>{card.emoji}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {matches === 4 && (
            <div className="flex flex-col items-center gap-6 mt-8 animate-in zoom-in">
              <div className="text-3xl font-black text-indigo-600 flex items-center gap-2">
                <Sparkles className="text-yellow-400" /> You Won!{" "}
                <Sparkles className="text-yellow-400" />
              </div>
              <Button
                onClick={resetGame}
                className="h-16 px-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-xl font-bold shadow-[0_8px_0px_0px_#3730a3] active:translate-y-2 active:shadow-none transition-all"
              >
                <RefreshCcw className="mr-2" /> Play Again
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
