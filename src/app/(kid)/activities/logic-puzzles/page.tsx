"use client";

import { useState, useEffect, useRef } from "react";
import { getActivityXp } from "@/lib/services/kid/activities/activity.actions";
import { Puzzle, Star, Brain, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/lib/constants/common";
import VictoryModal from "@/components/shared/VictoryModal";
import type { QuizReviewData, LogicPuzzleReviewItem } from "@/types/activity-review.types";

interface OptionItem {
  label: string;
  correct: boolean;
}

interface PuzzleItem {
  sequence: string[];
  options: OptionItem[];
  hint: string;
}

interface LogicPuzzlesPageProps {
  puzzleTitle?: string;
  puzzles?: PuzzleItem[];
  assignmentId?: string;
}

const defaultPuzzles: PuzzleItem[] = [
  {
    sequence: ["🔴", "🔵", "🔴", "🔵", "🔴", "?"],
    options: [
      { label: "🔴", correct: false },
      { label: "🔵", correct: true },
      { label: "🟡", correct: false },
    ],
    hint: "Notice how it alternates between red and blue!",
  },
  {
    sequence: ["⭐", "🌙", "⭐", "🌙", "⭐", "?"],
    options: [
      { label: "⭐", correct: false },
      { label: "🌙", correct: true },
      { label: "☀️", correct: false },
    ],
    hint: "It goes star, moon, star, moon...",
  },
  {
    sequence: ["1", "2", "3", "1", "2", "?"],
    options: [
      { label: "1", correct: false },
      { label: "2", correct: false },
      { label: "3", correct: true },
    ],
    hint: "The pattern is 1, 2, 3 repeating.",
  },
];

export default function LogicPuzzlesPage({
  puzzleTitle = "Logic Puzzles",
  puzzles = defaultPuzzles,
  assignmentId,
}: LogicPuzzlesPageProps) {
  const router = useRouter();
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpReward, setXpReward] = useState<number>(150);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const answersRef = useRef<LogicPuzzleReviewItem[]>([]);
  const gameStartedAtRef = useRef<number>(0);
  const [finalGameStartedAt, setFinalGameStartedAt] = useState<number>(0);
  const [finalReviewItems, setFinalReviewItems] = useState<LogicPuzzleReviewItem[]>([]);

  useEffect(() => {
    gameStartedAtRef.current = Date.now();
    getActivityXp("logic-puzzles").then(setXpReward);
  }, []);

  // Fallback to avoid out-of-bounds error
  const safePuzzles = puzzles.length > 0 ? puzzles : defaultPuzzles;
  const rawPuzzle = safePuzzles[currentPuzzle] || safePuzzles[0];

  // Map options to include stable string IDs dynamically
  const puzzle = {
    ...rawPuzzle,
    options: rawPuzzle.options.map((opt, index) => ({
      ...opt,
      id: index === 0 ? "A" : index === 1 ? "B" : "C",
    })),
  };

  const progress = ((currentPuzzle + 1) / safePuzzles.length) * 100;

  const handleNext = () => {
    if (currentPuzzle < safePuzzles.length - 1) {
      setCurrentPuzzle((prev) => prev + 1);
      setSelected(null);
    }
  };

  const handleFinish = () => {
    setFinalGameStartedAt(gameStartedAtRef.current);
    setFinalReviewItems(answersRef.current);
    setChallengeCompleted(true);
  };

  const handleFinishMission = () => {
    if (assignmentId) {
      router.push("/dashboard/kid");
    } else {
      router.push(APP_ROUTES.Activities);
    }
  };

  const handleRestart = () => {
    answersRef.current = [];
    gameStartedAtRef.current = Date.now();
    setFinalGameStartedAt(0);
    setFinalReviewItems([]);
    setCurrentPuzzle(0);
    setSelected(null);
    setCorrectCount(0);
    setChallengeCompleted(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />

      <main className="px-8 py-8 relative z-10">
        <div className="mx-auto max-w-5xl space-y-8">
          <Link
            href={APP_ROUTES.Activities}
            className="inline-flex items-center gap-2 text-purple-600 font-bold hover:text-purple-800 hover:-translate-x-1 transition-transform bg-card px-4 py-2 rounded-full shadow-sm border border-border w-fit"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Activities
          </Link>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-purple-600 font-bold">
              <span>{puzzleTitle} 🧩</span>
              <span className="flex items-center gap-2 rounded-full bg-card px-3 py-1 shadow-sm border border-border">
                <Brain className="h-4 w-4 text-purple-500" /> Level {currentPuzzle + 1} of{" "}
                {safePuzzles.length}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-3 rounded-full bg-purple-500/10 [&>div]:bg-purple-500"
            />
          </div>

          <Card className="border-4 border-purple-500/20 shadow-xl rounded-[2rem] bg-card">
            <CardContent className="p-8 text-center space-y-8">
              <div className="mx-auto bg-purple-500/10 w-20 h-20 rounded-full flex items-center justify-center">
                <Puzzle className="h-10 w-10 text-purple-600" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-foreground mb-2">What comes next?</h2>
                <p className="text-purple-500 font-medium">{puzzle.hint}</p>
              </div>

              <div className="flex justify-center gap-4 text-5xl bg-background/50 p-8 rounded-[2rem] shadow-inner border-2 border-border">
                {puzzle.sequence.map((item, i) => (
                  <span key={i} className={item === "?" ? "text-purple-400 animate-pulse" : ""}>
                    {item}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {puzzle.options.map((option) => {
              const isSelected = selected === option.id;
              const isCorrect = option.correct;
              const showSuccess = isSelected && isCorrect;
              const showError = isSelected && !isCorrect;

              return (
                <button
                  key={option.id}
                  onClick={() => {
                    if (!selected) {
                      setSelected(option.id);
                      if (option.correct) {
                        setCorrectCount((prev) => prev + 1);
                      }
                      // Record this selection for the review snapshot
                      answersRef.current.push({
                        sequence: rawPuzzle.sequence,
                        kid_answer: option.label,
                        correct_answer: rawPuzzle.options.find((o) => o.correct)?.label ?? "",
                        is_correct: option.correct,
                        hint: rawPuzzle.hint,
                      });
                    }
                  }}
                  disabled={selected !== null}
                  className={`relative flex flex-col items-center justify-center gap-4 rounded-[2rem] border-4 p-8 text-4xl transition-all duration-300 ${
                    showSuccess
                      ? "border-green-500 bg-green-500/10 scale-105 animate-in zoom-in-95 duration-200"
                      : showError
                        ? "border-red-500 bg-red-500/10 opacity-50"
                        : "border-purple-500/20 bg-card hover:-translate-y-2 hover:shadow-xl hover:border-purple-500/50"
                  } ${selected !== null ? "cursor-default" : "cursor-pointer"}`}
                >
                  {option.label}
                  {showSuccess && (
                    <CheckCircle2 className="absolute top-4 right-4 h-8 w-8 text-green-500 animate-in zoom-in-50 duration-200" />
                  )}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4">
              {currentPuzzle === safePuzzles.length - 1 ? (
                <Button
                  onClick={handleFinish}
                  className="h-16 px-12 rounded-full bg-green-600 hover:bg-green-700 text-xl font-bold shadow-[0_8px_0px_0px_#15803d] active:translate-y-2 active:shadow-none transition-all cursor-pointer"
                >
                  Continue 🎉
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="h-16 px-12 rounded-full bg-purple-600 hover:bg-purple-700 text-xl font-bold shadow-[0_8px_0px_0px_#581c87] active:translate-y-2 active:shadow-none transition-all cursor-pointer"
                >
                  Next Puzzle <Star className="ml-2 h-6 w-6" />
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <VictoryModal
        isOpen={challengeCompleted}
        onReplay={handleRestart}
        onContinue={handleFinishMission}
        xpEarned={Math.round((xpReward * correctCount) / (safePuzzles.length || 1))}
        activitySlug="logic-puzzles"
        activityTitle="Logic Puzzle"
        score={`${Math.round((correctCount / (safePuzzles.length || 1)) * 100)}%`}
        scoreDescription={`Super brain logic! You completed "${puzzleTitle}".`}
        rewardsDescription={`${correctCount}/${safePuzzles.length} Correct Answers`}
        assignmentId={assignmentId}
        gameStartedAt={finalGameStartedAt}
        reviewData={
          {
            type: "logic-puzzles",
            title: puzzleTitle,
            items: finalReviewItems,
            total_questions: safePuzzles.length,
            correct_count: correctCount,
          } satisfies QuizReviewData
        }
      />
    </div>
  );
}
