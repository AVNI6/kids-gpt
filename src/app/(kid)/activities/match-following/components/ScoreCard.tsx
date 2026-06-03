"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Award, RotateCcw } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Card } from "@/components/shared/ui/card";
import { APP_ROUTES } from "@/lib/constants/common";
import { MatchItem, ConnectionState } from "../types";

interface ScoreCardProps {
  pairs: MatchItem[];
  rightOrder: MatchItem[];
  connections: ConnectionState;
  correctCount: number;
  scaledXpEarned: number;
  showAnswers: boolean;
  toggleShowAnswers: () => void;
  handleFinishMission: () => void;
  resetGame: () => void;
  matchTitle: string;
}

export const ScoreCard = React.memo(function ScoreCard({
  pairs,
  rightOrder,
  connections,
  correctCount,
  scaledXpEarned,
  showAnswers,
  toggleShowAnswers,
  handleFinishMission,
  resetGame,
  matchTitle,
}: ScoreCardProps) {
  const accuracy = Math.round((correctCount / pairs.length) * 100);

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
              Game Complete!
            </div>
          </div>

          <Card className="border-4 border-orange-500/30 shadow-2xl rounded-[32px] bg-card p-6 md:p-8 text-center flex flex-col justify-center items-center gap-4 my-2 animate-in zoom-in duration-300 relative overflow-hidden">
            <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-orange-500/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-yellow-500/10 blur-2xl pointer-events-none" />

            <div className="mb-2 flex h-24 w-24 items-center justify-center rounded-[32px] bg-orange-500/10 border-4 border-dashed border-orange-500 animate-bounce">
              <Award className="h-12 w-12 text-orange-600" />
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
              {accuracy === 100 ? "Perfect Pairing! 🎉🔗" : "Good Try! Keep Learning! 🧠🌟"}
            </h2>

            <p className="text-muted-foreground text-sm md:text-base max-w-sm leading-relaxed">
              {accuracy === 100
                ? "Super connection wizard! You matched all pairs correctly and linked everything perfectly!"
                : "You've successfully finished pairing! Let's check your results and grab your rewards."}
            </p>

            <div className="grid grid-cols-3 gap-3 w-full max-w-md mt-6">
              <div className="bg-orange-500/10 rounded-2xl p-3 border border-orange-500/20 flex flex-col justify-center items-center">
                <h4 className="text-[10px] font-black uppercase text-orange-600 tracking-wider">
                  Score
                </h4>
                <p className="text-xl md:text-2xl font-black text-orange-600 mt-1">
                  {correctCount} / {pairs.length}
                </p>
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
                <p className="text-xl md:text-2xl font-black text-green-600 mt-1">
                  +{scaledXpEarned} XP
                </p>
              </div>
            </div>

            <Button
              onClick={toggleShowAnswers}
              variant="ghost"
              className="mt-4 text-orange-600 hover:bg-orange-500/10 font-black rounded-xl text-xs py-2 h-fit"
            >
              {showAnswers ? "Hide Answers 🙈" : "See Answers 🔍"}
            </Button>

            {showAnswers && (
              <div className="mt-4 w-full max-w-md bg-orange-500/[0.02] dark:bg-orange-500/[0.01] rounded-[24px] p-4 text-left border-2 border-dashed border-orange-500/20 animate-in slide-in-from-top-4 duration-300 max-h-[250px] overflow-y-auto pr-1">
                <h3 className="text-[10px] font-black uppercase text-orange-600 tracking-wider mb-3 select-none text-center">
                  Correct Pairings & Your Results 🧩
                </h3>
                <div className="space-y-3">
                  {pairs.map((item) => {
                    const matchedRightId = connections[item.id];
                    const userMatchedRightItem = rightOrder.find((r) => r.id === matchedRightId);
                    const isUserCorrect = matchedRightId === item.id;

                    return (
                      <div
                        key={`ans-${item.id}`}
                        className="bg-card rounded-xl p-3 border-2 border-border/80 flex flex-col gap-2 shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <span className="font-extrabold text-xs text-foreground/90 whitespace-normal break-words leading-relaxed">
                            {item.leftText}
                          </span>
                          <span className="hidden sm:inline text-muted-foreground/60 text-xs">
                            ➔
                          </span>
                          <span className="font-black text-xs text-emerald-600 whitespace-normal break-words leading-relaxed sm:text-right">
                            {item.rightText}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-border/40 pt-1.5 text-[10px] font-bold">
                          <span className="text-muted-foreground/75">Your Choice:</span>
                          {isUserCorrect ? (
                            <span className="text-emerald-600 flex items-center gap-1">
                              Perfect Match! ✓
                            </span>
                          ) : (
                            <span className="text-rose-500 flex items-center gap-1 whitespace-normal break-words text-right max-w-[200px]">
                              {userMatchedRightItem ? userMatchedRightItem.rightText : "None"} ❌
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-md relative z-10">
              <Button
                onClick={handleFinishMission}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold py-6 shadow-md transform hover:-translate-y-0.5 active:translate-y-px text-sm"
              >
                Continue 🎉
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
});
