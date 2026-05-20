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
    <div className="h-full bg-background overflow-hidden flex flex-col">
      <main className="flex-1 px-4 py-4 md:px-8 md:py-5 overflow-hidden flex flex-col items-center min-h-0">
        <div className="w-full max-w-2xl h-full flex flex-col justify-between gap-3 min-h-0">
          <Link
            href="/activities"
            className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm shrink-0"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Activities
          </Link>

          <div className="flex items-center justify-between bg-card p-3 rounded-2xl border-4 border-indigo-500/20 shadow-sm shrink-0">
            <h1 className="text-md md:text-xl font-black text-foreground flex items-center gap-1 sm:gap-2">
              <Grid className="text-indigo-500 h-5 w-5" /> Memory Match
            </h1>
            <div className="text-indigo-600 font-bold text-sm">Matches: {matches} / 4</div>
          </div>

          <div className="grid grid-cols-4 gap-3 md:gap-4 flex-1 min-h-0 items-center justify-center py-2">
            {cards.map((card, i) => {
              const isFlipped = flipped.includes(i) || card.matched;
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(i)}
                  className={`aspect-square rounded-2xl border-4 transition-all duration-500 transform-gpu ${
                    isFlipped
                      ? "bg-card border-indigo-500/30 shadow-inner rotate-y-180"
                      : "bg-indigo-500 border-indigo-700 shadow-md hover:-translate-y-0.5 hover:bg-indigo-400 dark:shadow-none"
                  }`}
                  style={{ perspective: "1000px" }}
                >
                  <div className="w-full h-full flex items-center justify-center text-3xl md:text-5xl transition-opacity duration-300">
                    <span className={isFlipped ? "opacity-100" : "opacity-0"}>{card.emoji}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="h-24 flex flex-col justify-center items-center shrink-0">
            {matches === 4 && (
              <div className="flex flex-col items-center gap-2 animate-in zoom-in w-full">
                <div className="text-2xl font-black text-indigo-600 flex items-center gap-1.5 justify-center">
                  <Sparkles className="text-yellow-400 h-5 w-5" /> You Won!{" "}
                  <Sparkles className="text-yellow-400 h-5 w-5" />
                </div>
                <Button
                  onClick={resetGame}
                  className="h-10 px-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-base font-bold shadow-md active:translate-y-0.5 active:shadow-sm transition-all"
                >
                  <RefreshCcw className="mr-1.5 h-4 w-4" /> Play Again
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
