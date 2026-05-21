"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Award,
  RotateCcw,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { APP_ROUTES } from "@/constant/AppRoutes";
import { saveKidActivityProgress } from "@/actions/dashboard.actions";
import { toast } from "sonner";

interface MatchItem {
  id: string;
  leftText: string; // e.g. "🦁 Lion"
  rightText: string; // e.g. "Wild Animal"
}

const matchPairsList: MatchItem[] = [
  { id: "1", leftText: "🦁 Lion", rightText: "Wild Animal 🐾" },
  { id: "2", leftText: "🍎 Apple", rightText: "Fruit 🌳" },
  { id: "3", leftText: "🚀 Rocket", rightText: "Space Vehicle 🌌" },
  { id: "4", leftText: "🐳 Whale", rightText: "Ocean Animal 🌊" },
];

export default function MatchFollowingPage() {
  const router = useRouter();
  const [leftSelected, setLeftSelected] = useState<string | null>(null);
  const [rightSelected, setRightSelected] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [incorrectFlash, setIncorrectFlash] = useState<boolean>(false);
  const [rightOrder, setRightOrder] = useState<MatchItem[]>([]);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const resetGame = () => {
    const scrambled = [...matchPairsList].sort(() => Math.random() - 0.5);
    setRightOrder(scrambled);
    setLeftSelected(null);
    setRightSelected(null);
    setMatchedIds([]);
    setAttemptCount(0);
    setIncorrectFlash(false);
    setGameCompleted(false);
  };

  // Scramble the right column on mount to avoid hydration mismatch
  useEffect(() => {
    const timer = setTimeout(() => {
      resetGame();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleLeftClick = (id: string) => {
    if (matchedIds.includes(id)) return;
    setLeftSelected(id);

    // If we already selected right, check match
    if (rightSelected) {
      checkMatch(id, rightSelected);
    }
  };

  const handleRightClick = (id: string) => {
    if (matchedIds.includes(id)) return;
    setRightSelected(id);

    // If we already selected left, check match
    if (leftSelected) {
      checkMatch(leftSelected, id);
    }
  };

  const checkMatch = (leftId: string, rightId: string) => {
    setAttemptCount((a) => a + 1);
    if (leftId === rightId) {
      // It's a match!
      setMatchedIds((prev) => [...prev, leftId]);
      setLeftSelected(null);
      setRightSelected(null);
      toast.success("Correct Match! 🎉", { duration: 800 });

      // Check if all matched
      if (matchedIds.length + 1 === matchPairsList.length) {
        setTimeout(() => {
          setGameCompleted(true);
        }, 800);
      }
    } else {
      // Incorrect match
      setIncorrectFlash(true);
      toast.error("Not quite a match! Try another pair.", { duration: 1000 });
      setTimeout(() => {
        setLeftSelected(null);
        setRightSelected(null);
        setIncorrectFlash(false);
      }, 800);
    }
  };

  const handleFinishMission = async () => {
    setIsSavingProgress(true);
    // Score calculation (fewer attempts means higher efficiency)
    const efficiency = Math.max(
      30,
      Math.min(100, Math.round((matchPairsList.length / attemptCount) * 100))
    );
    const scoreStr = `${efficiency}% Accuracy`;

    try {
      const res = await saveKidActivityProgress(
        "match-following",
        150, // Standardize to +150 XP
        "Match Pairs 🔗",
        scoreStr
      );

      if (res.success) {
        toast.success("Progress Saved!", {
          description: "+150 XP earned! Streak updated! 🎉",
        });
        router.push(APP_ROUTES.Activities);
      } else {
        toast.error("Failed to save progress", {
          description: res.error || "Please try again later.",
        });
      }
    } catch (err) {
      console.error("Error saving match following progress:", err);
      toast.error("Error saving progress");
    } finally {
      setIsSavingProgress(false);
    }
  };

  const progress = (matchedIds.length / matchPairsList.length) * 100;

  if (gameCompleted) {
    const accuracy = Math.max(
      30,
      Math.min(100, Math.round((matchPairsList.length / attemptCount) * 100))
    );

    return (
      <div className="h-full bg-background overflow-hidden flex flex-col relative min-h-screen">
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none" />

        <main className="relative z-10 flex-1 px-4 py-6 md:px-8 md:py-8 overflow-hidden flex flex-col min-h-0 justify-center">
          <div className="mx-auto max-w-xl w-full flex flex-col justify-between gap-4 min-h-0">
            <div className="flex items-center justify-between shrink-0 mb-2">
              <Link
                href={APP_ROUTES.Activities}
                className="inline-flex items-center gap-2 text-orange-600 font-bold hover:text-orange-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Activities
              </Link>

              <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border text-xs font-bold text-orange-600 animate-pulse">
                Mission Complete!
              </div>
            </div>

            <Card className="border-4 border-orange-500/30 shadow-2xl rounded-[32px] bg-card p-6 md:p-8 text-center flex flex-col justify-center items-center gap-4 my-2 animate-in zoom-in duration-300 relative overflow-hidden">
              <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-orange-500/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-yellow-500/10 blur-2xl pointer-events-none" />

              <div className="mb-2 flex h-24 w-24 items-center justify-center rounded-[32px] bg-orange-500/10 border-4 border-dashed border-orange-500 animate-bounce">
                <Award className="h-12 w-12 text-orange-600" />
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
                Perfect Matching! 🎉🔗
              </h2>

              <p className="text-muted-foreground text-sm md:text-base max-w-sm leading-relaxed">
                Super connection wizard! You matched all pairs correctly and linked all categories
                successfully.
              </p>

              <div className="grid grid-cols-3 gap-3 w-full max-w-md mt-6">
                <div className="bg-orange-500/10 rounded-2xl p-3 border border-orange-500/20 flex flex-col justify-center items-center">
                  <h4 className="text-[10px] font-black uppercase text-orange-600 tracking-wider">
                    Pairs Matched
                  </h4>
                  <p className="text-xl md:text-2xl font-black text-orange-600 mt-1">4 / 4</p>
                </div>
                <div className="bg-yellow-500/10 rounded-2xl p-3 border border-yellow-500/20 flex flex-col justify-center items-center">
                  <h4 className="text-[10px] font-black uppercase text-yellow-600 tracking-wider">
                    Accuracy
                  </h4>
                  <p className="text-xl md:text-2xl font-black text-yellow-600 mt-1">{accuracy}%</p>
                </div>
                <div className="bg-green-500/10 rounded-2xl p-3 border border-green-500/20 flex flex-col justify-center items-center">
                  <h4 className="text-[10px] font-black uppercase text-green-600 tracking-wider">
                    Reward
                  </h4>
                  <p className="text-xl md:text-2xl font-black text-green-600 mt-1">+150 XP</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-md relative z-10">
                <Button
                  onClick={handleFinishMission}
                  disabled={isSavingProgress}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold py-6 shadow-md transform hover:-translate-y-0.5 active:translate-y-px text-sm"
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
                  <RotateCcw className="mr-2 h-4 w-4" /> Start Over
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
      <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none" />

      <main className="relative z-10 flex-1 px-4 py-4 md:px-8 md:py-5 overflow-hidden flex flex-col min-h-0">
        <div className="mx-auto max-w-3xl w-full h-full flex flex-col justify-between gap-3 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <Link
              href={APP_ROUTES.Activities}
              className="inline-flex items-center gap-2 text-orange-600 font-bold hover:text-orange-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm shrink-0"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Activities
            </Link>

            <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border text-xs shrink-0 font-bold text-orange-600">
              Matched: {matchedIds.length} / 4
            </div>
          </div>

          <div className="space-y-1.5 shrink-0 mt-1">
            <div className="flex items-center justify-between text-xs text-orange-600 font-bold">
              <span>Match Pairs Progress</span>
              <span className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-0.5 shadow-sm border border-border">
                {Math.round(progress)}% Connected
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2 rounded-full bg-orange-500/10 [&>div]:bg-orange-500"
            />
          </div>

          {/* Columns Grid */}
          <div className="grid grid-cols-2 gap-8 flex-1 min-h-0 items-center py-4">
            {/* Left Column (Items) */}
            <div className="flex flex-col gap-3 justify-center h-full">
              <p className="text-xs font-black uppercase text-orange-600 text-center tracking-wider mb-1">
                Emoji Prompts
              </p>
              {matchPairsList.map((item) => {
                const isMatched = matchedIds.includes(item.id);
                const isSelected = leftSelected === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleLeftClick(item.id)}
                    disabled={isMatched || (leftSelected !== null && !isSelected && incorrectFlash)}
                    className={`p-4 md:p-6 rounded-[20px] border-4 text-center font-bold text-md md:text-lg transition-all duration-300 ${
                      isMatched
                        ? "border-green-500 bg-green-500/10 text-green-700 opacity-60 scale-95"
                        : isSelected
                          ? incorrectFlash
                            ? "border-red-500 bg-red-500/10 text-red-700 animate-shake"
                            : "border-orange-500 bg-orange-500/10 text-orange-700 scale-102"
                          : "border-orange-500/20 bg-card text-foreground hover:bg-orange-500/5 hover:-translate-y-0.5 active:translate-y-px active:shadow-none"
                    } flex items-center justify-between shadow-sm`}
                  >
                    <span>{item.leftText}</span>
                    {isMatched ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    ) : isSelected ? (
                      incorrectFlash ? (
                        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-orange-500 shrink-0 animate-pulse" />
                      )
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Right Column (Descriptions - scrambled) */}
            <div className="flex flex-col gap-3 justify-center h-full">
              <p className="text-xs font-black uppercase text-orange-600 text-center tracking-wider mb-1">
                Descriptions
              </p>
              {rightOrder.map((item) => {
                const isMatched = matchedIds.includes(item.id);
                const isSelected = rightSelected === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleRightClick(item.id)}
                    disabled={
                      isMatched || (rightSelected !== null && !isSelected && incorrectFlash)
                    }
                    className={`p-4 md:p-6 rounded-[20px] border-4 text-center font-bold text-md md:text-lg transition-all duration-300 ${
                      isMatched
                        ? "border-green-500 bg-green-500/10 text-green-700 opacity-60 scale-95"
                        : isSelected
                          ? incorrectFlash
                            ? "border-red-500 bg-red-500/10 text-red-700 animate-shake"
                            : "border-orange-500 bg-orange-500/10 text-orange-700 scale-102"
                          : "border-orange-500/20 bg-card text-foreground hover:bg-orange-500/5 hover:-translate-y-0.5 active:translate-y-px active:shadow-none"
                    } flex items-center justify-between shadow-sm`}
                  >
                    <span>{item.rightText}</span>
                    {isMatched ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    ) : isSelected ? (
                      incorrectFlash ? (
                        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-orange-500 shrink-0 animate-pulse" />
                      )
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-12 flex justify-center shrink-0 items-center">
            <Button
              onClick={resetGame}
              variant="ghost"
              className="text-orange-600 hover:bg-orange-500/10 font-bold rounded-full"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" /> Reset Links
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
