"use client";

import { useMatchGame } from "./hooks/useMatchGame";
import { MatchBoard } from "./components/MatchBoard";
import { ScoreCard } from "./components/ScoreCard";
import { MatchItem } from "./types";
import { Button } from "@/components/shared/ui/button";
import { Progress } from "@/components/shared/ui/progress";
import { ArrowLeft, RotateCcw, HelpCircle } from "lucide-react";
import Link from "next/link";
import { APP_ROUTES } from "@/lib/constants/common";
import { toast } from "sonner";

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
  const game = useMatchGame({ pairs, matchTitle });

  if (game.showScorecard) {
    return (
      <ScoreCard
        pairs={pairs}
        rightOrder={game.rightOrder}
        connections={game.connections}
        correctCount={game.correctCount}
        scaledXpEarned={game.scaledXpEarned}
        showAnswers={game.showAnswers}
        toggleShowAnswers={game.toggleShowAnswers}
        handleFinishMission={game.handleFinishMission}
        resetGame={game.resetGame}
      />
    );
  }

  return (
    <div className="h-full bg-background overflow-hidden flex flex-col relative min-h-screen">
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

      <main className="relative z-10 flex-1 px-4 py-4 md:px-8 md:py-5 overflow-hidden flex flex-col min-h-0">
        <div className="mx-auto max-w-3xl w-full h-full flex flex-col justify-between gap-3 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <Link
              href={APP_ROUTES.Activities}
              className="inline-flex items-center gap-2 text-orange-600 font-bold hover:text-orange-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm shrink-0"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Activities
            </Link>

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
    </div>
  );
}
