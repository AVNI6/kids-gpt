"use client";

import { useState, useEffect, useRef } from "react";
import { Trophy, ArrowLeft } from "lucide-react";
import { getActivityXp } from "@/lib/services/kid/activities/activity.actions";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSessionStorageState } from "@/hooks/shared/useSessionStorageState";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ActivityCard, ActivityCardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/lib/constants/app_routes";

import { type MathChallengeItem } from "@/types/activities.type";
import VictoryModal from "@/components/shared/VictoryModal";
import type {
  MathChallengeReviewData,
  MathChallengeReviewItem,
} from "@/types/activity-review.types";

interface MathChallengesPageProps {
  challengeTitle?: string;
  equations?: MathChallengeItem[];
  assignmentId?: string;
}

const defaultEquations: MathChallengeItem[] = [
  { question: "5 + 3 = ?", answer: 8, options: [6, 7, 8, 9] },
  { question: "10 - 4 = ?", answer: 6, options: [4, 5, 6, 7] },
  { question: "2 × 3 = ?", answer: 6, options: [5, 6, 7, 8] },
];

export default function MathChallengesPage({
  challengeTitle = "Math Hero 🧮",
  equations = defaultEquations,
  assignmentId,
}: MathChallengesPageProps) {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const activityId = params?.id as string | undefined;

  const storageKey = user
    ? assignmentId
      ? `user-${user.id}-assignment-${assignmentId}`
      : activityId
        ? `user-${user.id}-activity-math-challenges-${activityId}`
        : ""
    : "";

  const [currentIndex, setCurrentIndex] = useSessionStorageState(`${storageKey}-current`, 0);
  const [selected, setSelected] = useSessionStorageState<number | null>(
    `${storageKey}-selected`,
    null
  );
  const [correctCount, setCorrectCount] = useSessionStorageState(`${storageKey}-correct`, 0);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [xpReward, setXpReward] = useState<number>(130);
  const resultsRef = useRef<MathChallengeReviewItem[]>([]);
  const gameStartedAtRef = useRef<number>(0);
  const [finalGameStartedAt, setFinalGameStartedAt] = useState<number>(0);
  const [finalReviewItems, setFinalReviewItems] = useState<MathChallengeReviewItem[]>([]);

  useEffect(() => {
    gameStartedAtRef.current = Date.now();
    getActivityXp("math-challenges").then(setXpReward);
  }, []);
  const safeEquations = equations.length > 0 ? equations : defaultEquations;

  const eq = safeEquations[currentIndex] || safeEquations[0];
  const progress = ((currentIndex + 1) / safeEquations.length) * 100;

  const handleNext = () => {
    if (currentIndex === safeEquations.length - 1) {
      setFinalGameStartedAt(gameStartedAtRef.current);
      setFinalReviewItems(resultsRef.current);
      setChallengeCompleted(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelected(null);
    }
  };

  const handleOptionClick = (opt: number) => {
    if (selected === null) {
      setSelected(opt);
      const correct = opt === eq.answer;
      if (correct) {
        setCorrectCount((prev) => prev + 1);
      }
      // Capture this equation's result for the review snapshot
      resultsRef.current.push({
        question: eq.question,
        kid_answer: opt,
        correct_answer: eq.answer,
        options: eq.options,
        is_correct: correct,
      });
    }
  };

  const handleFinishMission = () => {
    if (assignmentId) {
      router.push("/dashboard/kid");
    } else {
      router.push(APP_ROUTES.Activities);
    }
  };

  const handleRestart = () => {
    if (storageKey) {
      sessionStorage.removeItem(`${storageKey}-current`);
      sessionStorage.removeItem(`${storageKey}-selected`);
      sessionStorage.removeItem(`${storageKey}-correct`);
    }
    resultsRef.current = [];
    gameStartedAtRef.current = Date.now();
    setFinalGameStartedAt(0);
    setFinalReviewItems([]);
    setCurrentIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setChallengeCompleted(false);
  };

  return (
    <div className="bg-background flex flex-col relative h-full max-h-full overflow-hidden">
      <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />

      <main className="relative z-10 flex-1 px-4 py-4 md:px-6 flex flex-col min-h-0 overflow-hidden">
        <div className="mx-auto max-w-4xl w-full flex-1 flex flex-col justify-start gap-4 sm:gap-5 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between shrink-0">
            <Link
              href={APP_ROUTES.Activities}
              className="inline-flex items-center gap-1.5 text-blue-600 font-bold hover:text-blue-800 hover:-translate-x-1 transition-transform bg-card px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-sm border border-border w-fit text-xs sm:text-sm shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back{" "}
              <span className="hidden sm:inline">to Activities</span>
            </Link>

            <div className="rounded-full bg-card px-2.5 py-1 sm:px-4 sm:py-1.5 shadow-sm border border-border text-[10px] sm:text-xs shrink-0 font-bold text-blue-600 max-w-[200px] truncate">
              {challengeTitle}
            </div>
          </div>

          <div className="space-y-1.5 shrink-0 mt-1">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-blue-600 font-bold">
              <span>
                Math Hero <span className="hidden sm:inline">Progress</span>
              </span>
              <span className="flex items-center gap-1 rounded-full bg-card px-2 py-0.5 shadow-sm border border-border text-[10px] sm:text-xs">
                Problem {currentIndex + 1} of {safeEquations.length}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-1.5 rounded-full bg-blue-500/10 [&>div]:bg-blue-500"
            />
          </div>

          <ActivityCard className="border-4 border-blue-500/20 my-2 bg-blue-500/5">
            <ActivityCardContent>
              <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center gap-4 my-auto">
                <div className="text-xl sm:text-3xl md:text-4xl font-black text-foreground tracking-widest font-mono">
                  {eq.question.replace("?", selected !== null ? selected.toString() : "?")}
                </div>
              </div>
            </ActivityCardContent>
          </ActivityCard>

          <div className="grid grid-cols-2 gap-2 mt-2 shrink-0">
            {eq.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrectOpt = opt === eq.answer;
              const showSuccess = isSelected && isCorrectOpt;
              const showError = isSelected && !isCorrectOpt;

              return (
                <button
                  key={opt}
                  onClick={() => handleOptionClick(opt)}
                  disabled={selected !== null}
                  className={`h-10 sm:h-12 md:h-13 rounded-xl sm:rounded-2xl border-2 text-sm sm:text-lg md:text-xl font-black transition-all duration-200 ${
                    showSuccess
                      ? "border-green-500 bg-green-500 text-white shadow-md translate-y-0.5"
                      : showError
                        ? "border-red-500 bg-red-500 text-white opacity-70 translate-y-0.5"
                        : "border-blue-400/50 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 shadow-sm hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none dark:shadow-none"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          <div className="min-h-[2.5rem] flex justify-center shrink-0 mt-2">
            {selected !== null && (
              <div className="animate-in fade-in">
                <Button
                  onClick={handleNext}
                  className="h-9 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-sm font-bold shadow-md active:translate-y-0.5 active:shadow-sm transition-all"
                >
                  {currentIndex === safeEquations.length - 1 ? "Finish Mission" : "Next Challenge"}{" "}
                  <Trophy
                    className="ml-1.5 h-4 w-4 text-yellow-400 animate-spin"
                    style={{ animationDuration: "3s" }}
                  />
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <VictoryModal
        isOpen={challengeCompleted}
        onReplay={handleRestart}
        onContinue={handleFinishMission}
        xpEarned={Math.round((xpReward * correctCount) / (safeEquations.length || 1))}
        activitySlug="math-challenges"
        activityTitle="Math Challenge"
        score={`${Math.round((correctCount / (safeEquations.length || 1)) * 100)}%`}
        scoreDescription={`Super math solving! You finished the challenge "${challengeTitle}".`}
        rewardsDescription={`${correctCount}/${safeEquations.length} Correct Answers`}
        assignmentId={assignmentId}
        gameStartedAt={finalGameStartedAt}
        reviewData={
          {
            type: "math-challenges",
            title: challengeTitle,
            items: finalReviewItems,
            total_questions: safeEquations.length,
            correct_count: correctCount,
          } satisfies MathChallengeReviewData
        }
        onClaimSuccess={() => {
          if (storageKey) {
            sessionStorage.removeItem(`${storageKey}-current`);
            sessionStorage.removeItem(`${storageKey}-selected`);
            sessionStorage.removeItem(`${storageKey}-correct`);
          }
        }}
      />
    </div>
  );
}
