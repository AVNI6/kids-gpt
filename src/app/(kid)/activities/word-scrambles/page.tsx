"use client";

import { useState, useEffect } from "react";
import { Type, Sparkles, CheckCircle2, ArrowLeft } from "lucide-react";
import { getActivityXp } from "@/lib/services/kid/activities/activity.actions";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSessionStorageState } from "@/hooks/shared/useSessionStorageState";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/lib/constants/common";
import VictoryModal from "@/components/shared/VictoryModal";
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
  const completedClassroomId = null;

  useEffect(() => {
    getActivityXp("word-scrambles").then(setXpReward);
  }, []);

  const safeWords = words || defaultWords;
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
  };

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col font-sans">
      <header className="px-4 py-4 flex items-center justify-between bg-white border-b border-pink-100">
        <Link
          href={APP_ROUTES.Activities}
          className="flex items-center gap-2 font-bold text-pink-600 hover:text-pink-700"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </Link>
        <h1 className="font-black text-lg text-pink-900">{scrambleTitle}</h1>
        <div className="w-20" />
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full flex flex-col">
        <div className="flex-1 flex flex-col min-h-0">
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
                <div className="text-base font-bold text-red-500">Oops! It was {word.answer}.</div>
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
      </main>

      <VictoryModal
        isOpen={scrambleCompleted}
        onReplay={handleRestart}
        onContinue={handleFinishMission}
        xpEarned={Math.round((xpReward * correctCount) / (safeWords.length || 1))}
        activitySlug="word-scrambles"
        activityTitle="Word Scramble"
        score={`${Math.round((correctCount / (safeWords.length || 1)) * 100)}%`}
        scoreDescription={`Spectacular spelling, word wizard! You finished the scramble "${scrambleTitle}".`}
        rewardsDescription={`${correctCount}/${safeWords.length} Correct Words`}
        assignmentId={assignmentId}
        onClaimSuccess={() => {
          if (storageKey) {
            sessionStorage.removeItem(`${storageKey}-current`);
            sessionStorage.removeItem(`${storageKey}-input`);
            sessionStorage.removeItem(`${storageKey}-showResult`);
            sessionStorage.removeItem(`${storageKey}-correct`);
          }
        }}
      />
    </div>
  );
}
