"use client";

import { useState, useEffect, useRef } from "react";
import { Trophy, ArrowLeft, Award, RotateCcw } from "lucide-react";
import { getActivityXp } from "@/lib/services/kid/activities/activity.actions";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSessionStorageState } from "@/hooks/shared/useSessionStorageState";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/lib/constants/common";
import { toast } from "sonner";
import { saveKidActivityProgress } from "@/lib/services/kid/dashboard.actions";
import { triggerConfettiSideCannons } from "@/components/ui/confetti-side-cannons";
import { type MathChallengeItem } from "@/types/activities.type";
import VictoryModal from "@/components/shared/VictoryModal";

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
  const [completedClassroomId, setCompletedClassroomId] = useState<string | null>(null);
  const safeEquations = equations.length > 0 ? equations : defaultEquations;

  const eq = safeEquations[currentIndex] || safeEquations[0];
  const progress = ((currentIndex + 1) / safeEquations.length) * 100;

  const handleNext = () => {
    if (currentIndex === safeEquations.length - 1) {
      setChallengeCompleted(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelected(null);
    }
  };

  const handleOptionClick = (opt: number) => {
    if (selected === null) {
      setSelected(opt);
      if (opt === eq.answer) {
        setCorrectCount((prev) => prev + 1);
      }
    }
  };

  const handleFinishMission = () => {
    if (assignmentId && completedClassroomId) {
      router.push(`/dashboard/kid/classrooms/${completedClassroomId}`);
    } else if (assignmentId) {
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
    setCurrentIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setChallengeCompleted(false);
  };

  return (
    <div className="h-full bg-background overflow-hidden flex flex-col relative min-h-screen">
      <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />

      <main className="relative z-10 flex-1 px-4 py-4 md:px-8 md:py-5 overflow-hidden flex flex-col min-h-0">
        <div className="mx-auto max-w-4xl w-full h-full flex flex-col justify-between gap-3 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <Link
              href={APP_ROUTES.Activities}
              className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm shrink-0"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Activities
            </Link>

            <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border text-xs shrink-0 font-bold text-blue-600 max-w-[200px] truncate">
              {challengeTitle}
            </div>
          </div>

          <div className="space-y-1.5 shrink-0 mt-1">
            <div className="flex items-center justify-between text-xs text-blue-600 font-bold">
              <span>Math Hero Progress</span>
              <span className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-0.5 shadow-sm border border-border">
                Problem {currentIndex + 1} of {safeEquations.length}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2 rounded-full bg-blue-500/10 [&>div]:bg-blue-500"
            />
          </div>

          <Card className="border-4 border-blue-500/20 shadow-md rounded-[1.5rem] bg-card overflow-hidden flex-1 flex flex-col min-h-0 mt-1">
            <div className="bg-blue-500 p-2.5 text-center shrink-0">
              <h2 className="text-white font-black text-sm uppercase tracking-widest animate-pulse">
                Solve the Equation
              </h2>
            </div>
            <CardContent className="p-6 text-center flex-1 flex items-center justify-center min-h-0 overflow-y-auto bg-blue-500/5">
              <div className="text-3xl md:text-4xl font-black text-foreground tracking-widest font-mono">
                {eq.question.replace("?", selected !== null ? selected.toString() : "?")}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4 mt-2 shrink-0">
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
                  className={`h-16 rounded-2xl border-4 text-2xl font-black transition-all duration-200 ${
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

          <div className="h-12 flex justify-center shrink-0 mt-2">
            {selected !== null && (
              <div className="animate-in fade-in">
                <Button
                  onClick={handleNext}
                  className="h-10 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-base font-bold shadow-md active:translate-y-0.5 active:shadow-sm transition-all"
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
