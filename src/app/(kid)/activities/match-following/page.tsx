"use client";

import { useRef, useEffect, useState } from "react";
import { useMatchGame } from "./hooks/useMatchGame";
import { MatchBoard } from "./components/MatchBoard";
import VictoryModal from "@/components/shared/VictoryModal";
import { MatchItem } from "./types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RotateCcw, HelpCircle } from "lucide-react";
import Link from "next/link";
import { APP_ROUTES } from "@/lib/constants/app_routes";
import { toast } from "sonner";
import type { MatchFollowingReviewData } from "@/types/activity-review.types";

interface MatchFollowingPageProps {
  matchTitle?: string;
  pairs?: MatchItem[];
}

const defaultPairs: MatchItem[] = [
  { id: "1", leftText: "🦁 Lion", rightText: "Wild Animal 🐾" },
  { id: "2", leftText: "🍎 Apple", rightText: "Fruit 🌳" },
  { id: "3", leftText: "🚀 Rocket", rightText: "Space Vehicle 🌌" },
  { id: "4", leftText: "🐳 Whale", rightText: "Ocean Animal 🌊" },
];

export default function MatchFollowingPage({
  matchTitle = "Match Pairs",
  pairs = defaultPairs,
}: MatchFollowingPageProps) {
  const game = useMatchGame({ pairs });
  const gameStartedAtRef = useRef<number>(0);
  const [finalGameStartedAt, setFinalGameStartedAt] = useState<number>(0);

  useEffect(() => {
    if (!game.hasSubmitted && !game.showScorecard) {
      gameStartedAtRef.current = Date.now();
    }
  }, [game.hasSubmitted, game.showScorecard]);

  useEffect(() => {
    if (game.showScorecard) {
      setFinalGameStartedAt(gameStartedAtRef.current);
    } else {
      setFinalGameStartedAt(0);
    }
  }, [game.showScorecard]);

  return (
    <div className="bg-background overflow-y-auto flex flex-col relative min-h-full">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.6s ease-in-out; }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.95; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow { animation: pulse-slow 2s infinite ease-in-out; }
      `}</style>

      <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none" />

      <main className="relative z-10 flex-1 px-4 py-4 md:px-8 md:py-5 flex flex-col min-h-0">
        <div className="mx-auto max-w-3xl w-full flex-1 flex flex-col justify-between gap-3 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <Link
              href={APP_ROUTES.Activities}
              className="inline-flex items-center gap-2 text-orange-600 font-bold hover:text-orange-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm shrink-0"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Activities
            </Link>

            <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border text-xs shrink-0 font-bold text-orange-600 max-w-[200px] truncate">
              {matchTitle}
            </div>

            <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border text-xs shrink-0 font-bold text-orange-600 flex items-center gap-1">
              <span>
                Links: {game.activeCount} / {pairs.length}
              </span>
              <HelpCircle
                className="h-3.5 w-3.5 text-orange-400 cursor-pointer"
                onClick={() =>
                  toast.info(
                    "Drag from a dot to connect pairs! Or click a left card and a right card! ✨",
                    { duration: 3000 }
                  )
                }
              />
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 shrink-0 mt-1">
            <div className="flex items-center justify-between text-xs text-orange-600 font-bold">
              <span>Matching Progress</span>
              <span className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-0.5 shadow-sm border border-border">
                {Math.round(game.progressPercent)}% Linked
              </span>
            </div>
            <Progress
              value={game.progressPercent}
              className="h-2 rounded-full bg-orange-500/10 [&>div]:bg-orange-500 transition-all duration-300"
            />
          </div>

          {/* Board */}
          <MatchBoard
            pairs={pairs}
            rightOrder={game.rightOrder}
            connections={game.connections}
            selectedDot={game.selectedDot}
            drawingState={game.drawingState}
            setDrawingState={game.setDrawingState}
            coords={game.coords}
            recalculateCoords={game.recalculateCoords}
            hasSubmitted={game.hasSubmitted}
            incorrectItems={game.incorrectItems}
            handleTapDot={game.handleTapDot}
            connectPairs={game.connectPairs}
            disconnectPair={game.disconnectPair}
            playSound={game.playSound}
          />

          {/* Action row */}
          <div className="flex justify-between items-center px-2 shrink-0 py-2">
            <Button
              onClick={game.resetGame}
              variant="ghost"
              className="text-orange-600 hover:bg-orange-500/10 font-bold rounded-full transition-colors"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" /> Reset Links
            </Button>

            <Button
              onClick={game.handleSubmitGame}
              disabled={game.activeCount < pairs.length || game.hasSubmitted}
              className={`font-black px-8 py-5 rounded-[20px] shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                game.activeCount === pairs.length && !game.hasSubmitted
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white cursor-pointer hover:shadow-orange-500/20 animate-pulse"
                  : "bg-muted text-muted-foreground cursor-not-allowed shadow-none border-transparent"
              }`}
            >
              Submit Answers 🚀
            </Button>
          </div>
        </div>
      </main>

      <VictoryModal
        isOpen={game.showScorecard}
        onReplay={game.resetGame}
        onContinue={game.handleFinishMission}
        xpEarned={game.scaledXpEarned}
        activitySlug="match-following"
        activityTitle="Match Following"
        score={`${Math.round((game.correctCount / pairs.length) * 100)}%`}
        scoreDescription={
          game.correctCount === pairs.length
            ? "Super connection wizard! You matched all pairs correctly and linked everything perfectly!"
            : "You've successfully finished pairing! Let's check your results and grab your rewards."
        }
        rewardsDescription={`${game.correctCount}/${pairs.length} Correct Connections`}
        gameStartedAt={finalGameStartedAt}
        reviewData={
          {
            type: "match-following",
            title: matchTitle,
            connections: pairs.map((item) => {
              const matchedRightId = game.connections[item.id];
              const userMatchedRightItem = game.rightOrder.find((r) => r.id === matchedRightId);
              return {
                left_text: item.leftText,
                right_text: item.rightText,
                kid_right_text: userMatchedRightItem ? userMatchedRightItem.rightText : null,
                is_correct: matchedRightId === item.id,
              };
            }),
            total_pairs: pairs.length,
            correct_count: game.correctCount,
          } satisfies MatchFollowingReviewData
        }
      >
        <Button
          onClick={game.toggleShowAnswers}
          variant="ghost"
          className="mt-2 text-orange-600 hover:bg-orange-500/10 font-black rounded-xl text-xs py-2 h-fit"
        >
          {game.showAnswers ? "Hide Answers 🙈" : "See Answers 🔍"}
        </Button>

        {game.showAnswers && (
          <div className="mt-4 w-full text-left bg-orange-500/[0.02] dark:bg-orange-500/[0.01] rounded-[24px] p-4 border-2 border-dashed border-orange-500/20 animate-in slide-in-from-top-4 duration-300 max-h-[250px] overflow-y-auto pr-1">
            <h3 className="text-[10px] font-black uppercase text-orange-600 tracking-wider mb-3 select-none text-center">
              Correct Pairings & Your Results 🧩
            </h3>
            <div className="space-y-3">
              {pairs.map((item) => {
                const matchedRightId = game.connections[item.id];
                const userMatchedRightItem = game.rightOrder.find((r) => r.id === matchedRightId);
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
                      <span className="hidden sm:inline text-muted-foreground/60 text-xs">➔</span>
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
      </VictoryModal>
    </div>
  );
}
