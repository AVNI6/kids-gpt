"use client";

import { useState, useEffect } from "react";
import { RefreshCcw, ArrowLeft, Award, RotateCcw, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { APP_ROUTES } from "@/constant/AppRoutes";
import { saveKidActivityProgress } from "@/actions/dashboard.actions";
import { getActivityXp } from "@/actions/activity.actions";
import { toast } from "sonner";

interface MemoryCard {
  id: number;
  emoji: string;
  matched: boolean;
  uniqueId: number;
}

const emojiPool = ["🦁", "🐯", "🐼", "🦊", "🐨", "🐰", "🐸", "🐳"];

export default function MemoryMatchPage() {
  const router = useRouter();
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [matches, setMatches] = useState(0);
  const [flipsCount, setFlipsCount] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [xpReward, setXpReward] = useState<number>(80);

  useEffect(() => {
    getActivityXp("memory-match").then(setXpReward);
  }, []);

  const resetGame = () => {
    // Generate pairs of 6 unique emojis for a 3x4 grid (12 cards total) or 8 unique emojis for 4x4 (16 cards total)
    const selectedEmojis = emojiPool.slice(0, 8); // 8 pairs = 16 cards
    const deck = [...selectedEmojis, ...selectedEmojis].map((emoji, index) => ({
      id: index,
      emoji,
      matched: false,
      uniqueId: Math.random(),
    }));

    // Shuffle deck
    const shuffled = deck.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlipped([]);
    setMatches(0);
    setFlipsCount(0);
    setDisabled(false);
    setGameCompleted(false);
  };

  // Initialize cards on mount to avoid hydration mismatch
  useEffect(() => {
    const timer = setTimeout(() => {
      resetGame();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleCardClick = (index: number) => {
    if (disabled || flipped.includes(index) || cards[index].matched) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setDisabled(true);
      setFlipsCount((f) => f + 1);
      const [first, second] = newFlipped;

      if (cards[first].emoji === cards[second].emoji) {
        setCards((prev) =>
          prev.map((card, i) => (i === first || i === second ? { ...card, matched: true } : card))
        );
        setMatches((m) => m + 1);
        setFlipped([]);
        setDisabled(false);

        // Check completion (8 matches means all 16 matched)
        if (matches + 1 === 8) {
          setTimeout(() => {
            setGameCompleted(true);
          }, 600);
        }
      } else {
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, 1000);
      }
    }
  };

  const handleFinishMission = async () => {
    setIsSavingProgress(true);
    // Score based on efficiency (fewer flips means higher score)
    // Minimal flips for 8 pairs is 8. Perfect is 100%.
    const efficiency = Math.max(20, Math.min(100, Math.round((8 / flipsCount) * 100)));
    const scoreStr = `${efficiency}% Accuracy`;

    try {
      const res = await saveKidActivityProgress(
        "memory-match",
        xpReward,
        "Memory Match 🧠",
        scoreStr
      );

      if (res.success) {
        toast.success("Progress Saved!", {
          description: `+${xpReward} XP earned! Streak updated! 🎉`,
        });
        router.push(APP_ROUTES.Activities);
      } else {
        toast.error("Failed to save progress", {
          description: res.error || "Please try again later.",
        });
      }
    } catch (err) {
      console.error("Error saving kid memory match progress:", err);
      toast.error("Error saving progress");
    } finally {
      setIsSavingProgress(false);
    }
  };

  const progress = (matches / 8) * 100;

  if (gameCompleted) {
    const accuracy = Math.max(20, Math.min(100, Math.round((8 / flipsCount) * 100)));

    return (
      <div className="h-full bg-background overflow-hidden flex flex-col relative min-h-screen">
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-pink-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

        <main className="relative z-10 flex-1 px-4 py-6 md:px-8 md:py-8 overflow-hidden flex flex-col min-h-0 justify-center">
          <div className="mx-auto max-w-xl w-full flex flex-col justify-between gap-4 min-h-0">
            <div className="flex items-center justify-between shrink-0 mb-2">
              <Link
                href={APP_ROUTES.Activities}
                className="inline-flex items-center gap-2 text-pink-600 font-bold hover:text-pink-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Activities
              </Link>

              <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border text-xs font-bold text-pink-600 animate-pulse">
                Mission Complete!
              </div>
            </div>

            <Card className="border-4 border-pink-500/30 shadow-2xl rounded-[32px] bg-card p-6 md:p-8 text-center flex flex-col justify-center items-center gap-4 my-2 animate-in zoom-in duration-300 relative overflow-hidden">
              <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-pink-500/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

              <div className="mb-2 flex h-24 w-24 items-center justify-center rounded-[32px] bg-pink-500/10 border-4 border-dashed border-pink-500 animate-bounce">
                <Award className="h-12 w-12 text-pink-600" />
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
                Memory Mastered! 🎉🧠
              </h2>

              <p className="text-muted-foreground text-sm md:text-base max-w-sm leading-relaxed">
                Super memory match skill! You matched all animal cards and finished with flying
                colors!
              </p>

              <div className="grid grid-cols-3 gap-3 w-full max-w-md mt-6">
                <div className="bg-pink-500/10 rounded-2xl p-3 border border-pink-500/20 flex flex-col justify-center items-center">
                  <h4 className="text-[10px] font-black uppercase text-pink-600 tracking-wider">
                    Flips
                  </h4>
                  <p className="text-xl md:text-2xl font-black text-pink-600 mt-1">{flipsCount}</p>
                </div>
                <div className="bg-purple-500/10 rounded-2xl p-3 border border-purple-500/20 flex flex-col justify-center items-center">
                  <h4 className="text-[10px] font-black uppercase text-purple-600 tracking-wider">
                    Accuracy
                  </h4>
                  <p className="text-xl md:text-2xl font-black text-purple-600 mt-1">{accuracy}%</p>
                </div>
                <div className="bg-green-500/10 rounded-2xl p-3 border border-green-500/20 flex flex-col justify-center items-center">
                  <h4 className="text-[10px] font-black uppercase text-green-600 tracking-wider">
                    Reward
                  </h4>
                  <p className="text-xl md:text-2xl font-black text-green-600 mt-1">
                    +{xpReward} XP
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-md relative z-10">
                <Button
                  onClick={handleFinishMission}
                  disabled={isSavingProgress}
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold py-6 shadow-md transform hover:-translate-y-0.5 active:translate-y-px text-sm"
                >
                  {isSavingProgress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Claim Rewards 🎉"
                  )}
                </Button>
                <Button
                  onClick={resetGame}
                  variant="outline"
                  className="flex-1 border-2 border-border hover:bg-muted text-foreground rounded-2xl font-bold py-6 shadow-sm text-sm"
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Play Again
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-hidden flex flex-col relative min-h-screen">
      <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-pink-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

      <main className="relative z-10 flex-1 px-4 py-4 md:px-8 md:py-5 overflow-hidden flex flex-col min-h-0">
        <div className="mx-auto max-w-2xl w-full h-full flex flex-col justify-between gap-3 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <Link
              href={APP_ROUTES.Activities}
              className="inline-flex items-center gap-2 text-pink-600 font-bold hover:text-pink-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm shrink-0"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Activities
            </Link>

            <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border text-xs shrink-0 font-bold text-pink-600">
              Matches: {matches} / 8 | Flips: {flipsCount}
            </div>
          </div>

          <div className="space-y-1.5 shrink-0 mt-1">
            <div className="flex items-center justify-between text-xs text-pink-600 font-bold">
              <span>Memory Match Progress</span>
              <span className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-0.5 shadow-sm border border-border">
                {Math.round(progress)}% Matched
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2 rounded-full bg-pink-500/10 [&>div]:bg-pink-500"
            />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-4 gap-3 md:gap-4 flex-1 min-h-0 items-center justify-center py-4">
            {cards.map((card, i) => {
              const isFlipped = flipped.includes(i) || card.matched;
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(i)}
                  disabled={card.matched}
                  className={`aspect-square w-full h-full rounded-[24px] border-4 transition-all duration-300 transform ${
                    isFlipped
                      ? "bg-card border-pink-500/30 rotate-y-180 scale-95 opacity-90"
                      : "bg-gradient-to-br from-pink-500 to-purple-600 border-pink-600 shadow-lg hover:-translate-y-1 hover:scale-105 active:scale-95 duration-150"
                  } flex items-center justify-center`}
                >
                  <div className="w-full h-full flex items-center justify-center text-4xl md:text-5xl transition-opacity duration-300">
                    {isFlipped ? (
                      <span className="animate-in zoom-in-75 duration-200">{card.emoji}</span>
                    ) : (
                      <span className="text-white font-black text-xl md:text-2xl select-none animate-pulse">
                        ?
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="h-12 flex justify-center shrink-0 items-center">
            <Button
              onClick={resetGame}
              variant="ghost"
              className="text-pink-600 hover:bg-pink-500/10 font-bold rounded-full"
            >
              <RefreshCcw className="mr-1.5 h-4 w-4" /> Reset Grid
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
