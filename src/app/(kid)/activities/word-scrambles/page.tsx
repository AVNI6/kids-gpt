"use client";

import { useState, useEffect, useRef } from "react";
import { Type, Sparkles, CheckCircle2, ArrowLeft, Award, RotateCcw } from "lucide-react";
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
import { type WordScrambleItem } from "@/types/activities.type";

interface WordScramblesPageProps {
  scrambleTitle?: string;
  words?: WordScrambleItem[];
  assignmentId?: string;
}

const defaultWords: WordScrambleItem[] = [
  { scrambled: "A T C", answer: "CAT", hint: "Meow!" },
  { scrambled: "O D G", answer: "DOG", hint: "Woof!" },
  { scrambled: "R I B D", answer: "BIRD", hint: "Tweet tweet!" },
];

export default function WordScramblesPage({
  scrambleTitle = "Word Magic 🔠",
  words = defaultWords,
  assignmentId,
}: WordScramblesPageProps) {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const activityId = params?.id as string | undefined;

  const storageKey = user
    ? assignmentId
      ? `user-${user.id}-assignment-${assignmentId}`
      : activityId
        ? `user-${user.id}-activity-word-scrambles-${activityId}`
        : ""
    : "";

  const [currentWord, setCurrentWord] = useSessionStorageState(`${storageKey}-current`, 0);
  const [input, setInput] = useSessionStorageState(`${storageKey}-input`, "");
  const [showResult, setShowResult] = useSessionStorageState(`${storageKey}-showResult`, false);
  const [correctCount, setCorrectCount] = useSessionStorageState(`${storageKey}-correct`, 0);
  const [scrambleCompleted, setScrambleCompleted] = useState(false);
  const [xpReward, setXpReward] = useState<number>(140);
  const [completedClassroomId, setCompletedClassroomId] = useState<string | null>(null);
  const hasClaimed = useRef(false);

  useEffect(() => {
    getActivityXp("word-scrambles").then(setXpReward);
  }, []);

  const safeWords = words.length > 0 ? words : defaultWords;

  // Background Auto-Claiming Logic
  useEffect(() => {
    if (scrambleCompleted) {
      if (storageKey) {
        sessionStorage.removeItem(`${storageKey}-current`);
        sessionStorage.removeItem(`${storageKey}-input`);
        sessionStorage.removeItem(`${storageKey}-showResult`);
        sessionStorage.removeItem(`${storageKey}-correct`);
      }
    }
    if (scrambleCompleted && !hasClaimed.current) {
      hasClaimed.current = true;
      const autoClaim = async () => {
        const scorePercent = Math.round((correctCount / safeWords.length) * 100);
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
            const slugKey = scrambleTitle
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");

            const res = await saveKidActivityProgress(
              slugKey || "word-scrambles",
              xpReward,
              scrambleTitle,
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
    scrambleCompleted,
    correctCount,
    safeWords.length,
    scrambleTitle,
    xpReward,
    assignmentId,
    storageKey,
  ]);

  const word = safeWords[currentWord] || safeWords[0];
  const progress = ((currentWord + 1) / safeWords.length) * 100;

  const isCorrect = input.trim().toUpperCase() === word.answer.trim().toUpperCase();

  const handleCheck = () => {
    if (input.trim()) {
      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      }
      setShowResult(true);
    }
  };

  const handleNext = () => {
    if (currentWord === safeWords.length - 1) {
      setScrambleCompleted(true);
    } else {
      setCurrentWord((prev) => prev + 1);
      setInput("");
      setShowResult(false);
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
      sessionStorage.removeItem(`${storageKey}-input`);
      sessionStorage.removeItem(`${storageKey}-showResult`);
      sessionStorage.removeItem(`${storageKey}-correct`);
    }
    setCurrentWord(0);
    setInput("");
    setShowResult(false);
    setCorrectCount(0);
    setScrambleCompleted(false);
    hasClaimed.current = false;
  };

  if (scrambleCompleted) {
    const scorePercent = Math.round((correctCount / safeWords.length) * 100);

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

              <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border text-xs font-bold text-pink-600">
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
                Scramble Completed! 🎉🏆
              </h2>

              <p className="text-muted-foreground text-sm md:text-base max-w-sm leading-relaxed">
                Spectacular spelling, word wizard! You finished the scramble{" "}
                <strong className="text-pink-600">&quot;{scrambleTitle}&quot;</strong>.
              </p>

              <div className="grid grid-cols-3 gap-3 w-full max-w-md mt-6">
                <div className="bg-pink-500/10 rounded-2xl p-3 border border-pink-500/20 flex flex-col justify-center items-center">
                  <h4 className="text-[10px] font-black uppercase text-pink-600 tracking-wider">
                    Solved
                  </h4>
                  <p className="text-xl md:text-2xl font-black text-pink-600 mt-1">
                    {correctCount} / {safeWords.length}
                  </p>
                </div>
                <div className="bg-purple-500/10 rounded-2xl p-3 border border-purple-500/20 flex flex-col justify-center items-center">
                  <h4 className="text-[10px] font-black uppercase text-purple-600 tracking-wider">
                    Score
                  </h4>
                  <p className="text-xl md:text-2xl font-black text-purple-600 mt-1">
                    {scorePercent}%
                  </p>
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
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold py-6 shadow-md transform hover:-translate-y-0.5 active:translate-y-px text-sm"
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
      <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-pink-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

      <main className="relative z-10 flex-1 px-4 py-4 md:px-8 md:py-5 overflow-hidden flex flex-col min-h-0">
        <div className="mx-auto max-w-3xl w-full h-full flex flex-col justify-between gap-3 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <Link
              href={APP_ROUTES.Activities}
              className="inline-flex items-center gap-2 text-pink-600 font-bold hover:text-pink-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm shrink-0"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Activities
            </Link>

            <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border text-xs shrink-0 font-bold text-pink-600 max-w-[200px] truncate">
              {scrambleTitle}
            </div>
          </div>

          <div className="space-y-1.5 shrink-0 mt-1">
            <div className="flex items-center justify-between text-xs text-pink-600 font-bold">
              <span>Word Magic Progress</span>
              <span className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-0.5 shadow-sm border border-border">
                Word {currentWord + 1} of {safeWords.length}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2 rounded-full bg-pink-500/10 [&>div]:bg-pink-500"
            />
          </div>

          <Card className="border-4 border-pink-500/20 shadow-md rounded-[1.5rem] bg-card flex-1 flex flex-col min-h-0 overflow-hidden mt-1">
            <CardContent className="p-4 md:p-6 text-center flex-1 flex flex-col justify-center gap-5 min-h-0 overflow-y-auto">
              <div className="mx-auto bg-pink-500/10 w-16 h-16 rounded-full flex items-center justify-center shrink-0">
                <Type className="h-8 w-8 text-pink-600" />
              </div>

              <div className="shrink-0 space-y-1">
                <h2 className="text-base md:text-lg font-black tracking-tight text-muted-foreground">
                  Unscramble the letters!
                </h2>

                <div className="flex flex-wrap justify-center gap-2 py-2">
                  {word.scrambled.split(/\s+/).map((letter, i) => (
                    <div
                      key={i}
                      className="bg-background border-4 border-pink-500/30 w-12 h-16 md:w-14 md:h-18 rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-black text-pink-600 shadow-sm rotate-[-2deg] hover:rotate-[2deg] transition-transform select-none"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center shrink-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  disabled={showResult}
                  placeholder="Type answer..."
                  className="w-full max-w-xs text-center text-2xl font-black uppercase tracking-widest p-3 rounded-2xl border-4 border-border bg-background focus:border-pink-500 focus:outline-none shadow-inner text-foreground transition-colors"
                  maxLength={word.answer.length}
                />
              </div>

              <p className="text-pink-500 font-bold text-sm shrink-0 bg-pink-500/5 px-4 py-2 rounded-full border border-pink-500/10 w-fit mx-auto">
                💡 Hint: {word.hint}
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-center h-16 shrink-0 items-center mt-1">
            {!showResult ? (
              <Button
                onClick={handleCheck}
                disabled={!input.trim()}
                className="h-11 px-10 rounded-full bg-pink-500 hover:bg-pink-600 text-base font-bold shadow-[0_4px_0px_0px_#be185d] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
              >
                Check Word <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-4 animate-in zoom-in">
                {isCorrect ? (
                  <div className="flex items-center gap-1.5 text-lg font-black text-green-500">
                    <CheckCircle2 className="h-5 w-5" /> You got it!
                  </div>
                ) : (
                  <div className="text-base font-bold text-red-500">
                    Oops! It was {word.answer}.
                  </div>
                )}
                <Button
                  onClick={handleNext}
                  className="h-11 px-10 rounded-full bg-pink-500 hover:bg-pink-600 text-base font-bold shadow-[0_4px_0px_0px_#be185d] active:translate-y-1 active:shadow-none transition-all"
                >
                  {currentWord === safeWords.length - 1 ? "Finish Scramble" : "Next Word"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
