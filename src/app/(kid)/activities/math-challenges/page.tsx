"use client";

import { useState, useEffect, useRef } from "react";
import { Trophy, ArrowLeft, Award, RotateCcw } from "lucide-react";
import { getActivityXp } from "@/lib/services/kid/activities/activity.actions";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSessionStorageState } from "@/hooks/shared/useSessionStorageState";
import { Button } from "@/components/shared/ui/button";
import { Progress } from "@/components/shared/ui/progress";
import { Card, CardContent } from "@/components/shared/ui/card";
import { APP_ROUTES } from "@/lib/constants/common";
import { toast } from "sonner";
import { saveKidActivityProgress } from "@/lib/services/kid/dashboard.actions";
import { triggerConfettiSideCannons } from "@/components/shared/ui/confetti-side-cannons";
import { type MathChallengeItem } from "@/types/activities.type";

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
  const hasClaimed = useRef(false);

  useEffect(() => {
    getActivityXp("math-challenges").then(setXpReward);
  }, []);

  const safeEquations = equations.length > 0 ? equations : defaultEquations;

  // Background Auto-Claiming Logic
  useEffect(() => {
    if (challengeCompleted) {
      if (storageKey) {
        sessionStorage.removeItem(`${storageKey}-current`);
        sessionStorage.removeItem(`${storageKey}-selected`);
        sessionStorage.removeItem(`${storageKey}-correct`);
      }
    }
    if (challengeCompleted && !hasClaimed.current) {
      hasClaimed.current = true;
      const autoClaim = async () => {
        const scorePercent = Math.round((correctCount / safeEquations.length) * 100);
        const scoreStr = `${scorePercent}%`;
        try {
          if (assignmentId) {
            const { submitAssignmentActivityCompletion } =
              await import("@/lib/services/kid/classroom.actions");
            const res = await submitAssignmentActivityCompletion(assignmentId, scoreStr);
            if (res.success) {
              if (res.classroomId) {
                setCompletedClassroomId(res.classroomId);
              }
              triggerConfettiSideCannons();
              toast.success("Assignment Completed! 🎉", {
                description: `Your score has been submitted.`,
              });
            } else {
              toast.error(res.error || "Failed to submit assignment.");
            }
          } else {
            const slugKey = challengeTitle
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");

            const res = await saveKidActivityProgress(
              slugKey || "math-challenges",
              xpReward,
              challengeTitle,
              scoreStr
            );
            if (res.success) {
              triggerConfettiSideCannons();
              toast.success("Progress Saved! 🎉", {
                description: `+${xpReward} XP earned!`,
              });
            }
          }
        } catch (err) {
          console.error("Auto-claim error:", err);
        }
      };
      autoClaim();
    }
  }, [
    challengeCompleted,
    correctCount,
    safeEquations.length,
    challengeTitle,
    xpReward,
    assignmentId,
    storageKey,
  ]);

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
    hasClaimed.current = false;
  };

  if (challengeCompleted) {
    const scorePercent = Math.round((correctCount / safeEquations.length) * 100);

    return (
      <div className="h-full bg-background overflow-hidden flex flex-col relative min-h-screen">
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />

        <main className="relative z-10 flex-1 px-4 py-6 md:px-8 md:py-8 overflow-hidden flex flex-col min-h-0 justify-center">
          <div className="mx-auto max-w-xl w-full flex flex-col justify-between gap-4 min-h-0">
            <div className="flex items-center justify-between shrink-0 mb-2">
              <Link
                href={APP_ROUTES.Activities}
                className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Activities
              </Link>

              <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border text-xs">
                <span className="font-bold text-blue-600">Mission Complete!</span>
              </div>
            </div>

            <Card className="border-4 border-blue-500/30 shadow-2xl rounded-[32px] bg-card p-6 md:p-8 text-center flex flex-col justify-center items-center gap-4 my-2 animate-in zoom-in duration-300 relative overflow-hidden">
              <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-orange-500/10 blur-2xl pointer-events-none" />

              <div className="mb-2 flex h-24 w-24 items-center justify-center rounded-[32px] bg-blue-500/10 border-4 border-dashed border-blue-500 animate-bounce">
                <Award className="h-12 w-12 text-blue-600" />
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
                Challenge Completed! 🎉🏆
              </h2>

              <p className="text-muted-foreground text-sm md:text-base max-w-sm leading-relaxed">
                Super math solving! You finished the challenge{" "}
                <strong className="text-blue-600">&quot;{challengeTitle}&quot;</strong>.
              </p>

              <div className="grid grid-cols-3 gap-3 w-full max-w-md mt-6">
                <div className="bg-blue-500/10 rounded-2xl p-3 md:p-4 border border-blue-500/20 flex flex-col justify-center items-center transition-all hover:scale-105 duration-200">
                  <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                    Solved
                  </h4>
                  <p className="text-xl md:text-2xl font-black text-blue-600 mt-1">
                    {correctCount} / {safeEquations.length}
                  </p>
                </div>
                <div className="bg-orange-500/10 rounded-2xl p-3 md:p-4 border border-orange-500/20 flex flex-col justify-center items-center transition-all hover:scale-105 duration-200">
                  <h4 className="text-[10px] font-black uppercase text-orange-600 tracking-wider">
                    Score
                  </h4>
                  <p className="text-xl md:text-2xl font-black text-orange-600 mt-1">
                    {scorePercent}%
                  </p>
                </div>
                <div className="bg-green-500/10 rounded-2xl p-3 md:p-4 border border-green-500/20 flex flex-col justify-center items-center transition-all hover:scale-105 duration-200">
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold py-6 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-px text-sm"
                >
                  Continue 🎉
                </Button>
                <Button
                  onClick={handleRestart}
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
    </div>
  );
}
