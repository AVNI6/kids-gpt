"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Timer, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSessionStorageState } from "@/hooks/shared/useSessionStorageState";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, ActivityCard, ActivityCardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/lib/constants/app_routes";
import { getActivityXp } from "@/lib/services/kid/activities/activity.actions";
import VictoryModal from "@/components/shared/VictoryModal";
import { type QuizQuestionItem } from "@/types/activities.type";
import type { QuizReviewData, QuizReviewItem } from "@/types/activity-review.types";

interface QuizzesPageProps {
  quizTitle?: string;
  questions?: QuizQuestionItem[];
  assignmentId?: string;
}

const defaultQuestions: QuizQuestionItem[] = [
  {
    question: 'Which planet is often called the "Red Planet"?',
    options: [
      { label: "Venus", correct: false },
      { label: "Mars", correct: true },
      { label: "Jupiter", correct: false },
      { label: "Saturn", correct: false },
    ],
    feedback: "Mars is the red planet because of iron oxide (rust) on its surface.",
    tip: "Did you know Mars has the tallest volcano in the solar system? It's called Olympus Mons!",
  },
  {
    question: "Which planet is the biggest in our solar system?",
    options: [
      { label: "Earth", correct: false },
      { label: "Jupiter", correct: true },
      { label: "Mars", correct: false },
      { label: "Neptune", correct: false },
    ],
    feedback: "Jupiter is the largest planet and has the most moons.",
    tip: "Jupiter is so large that more than 1,300 Earths could fit inside it.",
  },
  {
    question: "Which planet has the most rings?",
    options: [
      { label: "Saturn", correct: true },
      { label: "Mercury", correct: false },
      { label: "Venus", correct: false },
      { label: "Mars", correct: false },
    ],
    feedback: "Saturn has the largest and most visible ring system.",
    tip: "Saturn has hundreds of rings made of ice and rock.",
  },
];

export default function QuizzesPage({
  quizTitle = "Solar System Explorers",
  questions = defaultQuestions,
  assignmentId,
}: QuizzesPageProps) {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const activityId = params?.id as string | undefined;

  const storageKey = user
    ? assignmentId
      ? `user-${user.id}-assignment-${assignmentId}`
      : activityId
        ? `user-${user.id}-activity-quizzes-${activityId}`
        : ""
    : "";

  const [currentQuestion, setCurrentQuestion] = useSessionStorageState(`${storageKey}-current`, 0);
  const [selected, setSelected] = useSessionStorageState<string | null>(
    `${storageKey}-selected`,
    null
  );
  const [timeLeft, setTimeLeft] = useSessionStorageState(`${storageKey}-time`, 600);
  const [correctCount, setCorrectCount] = useSessionStorageState(`${storageKey}-correct`, 0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [xpReward, setXpReward] = useState<number>(120);
  // Accumulate per-question answers for parent review — not persisted to sessionStorage
  const answersRef = useRef<QuizReviewItem[]>([]);
  const gameStartedAtRef = useRef<number>(0);
  const [finalGameStartedAt, setFinalGameStartedAt] = useState<number>(0);
  const [finalReviewItems, setFinalReviewItems] = useState<QuizReviewItem[]>([]);

  useEffect(() => {
    gameStartedAtRef.current = Date.now();
    getActivityXp("quizzes").then(setXpReward);
  }, []);

  const safeQuestions = questions && questions.length > 0 ? questions : defaultQuestions;
  const rawQuiz = safeQuestions[currentQuestion] || safeQuestions[0];

  // Map options to include standard letter IDs dynamically
  const quiz = {
    ...rawQuiz,
    options: rawQuiz.options.map((opt, index) => ({
      ...opt,
      id: index === 0 ? "A" : index === 1 ? "B" : index === 2 ? "C" : "D",
    })),
  };

  const progress = ((currentQuestion + 1) / safeQuestions.length) * 100;

  useEffect(() => {
    if (timeLeft <= 0 || quizCompleted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, quizCompleted, setTimeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isLastQuestion = currentQuestion === safeQuestions.length - 1;

  const handleSelect = (id: string) => {
    setSelected(id);
    const option = quiz.options.find((o) => o.id === id);
    if (option?.correct) {
      setCorrectCount((prev) => prev + 1);
    }
    // Record this answer for the review snapshot
    answersRef.current.push({
      question: rawQuiz.question,
      options: rawQuiz.options.map((o) => o.label),
      kid_answer: option?.label ?? null,
      correct_answer: rawQuiz.options.find((o) => o.correct)?.label ?? "",
      is_correct: option?.correct ?? false,
      feedback: rawQuiz.feedback,
    });
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestion((prev) => prev + 1);
      setSelected(null);
    } else {
      setFinalGameStartedAt(gameStartedAtRef.current);
      setFinalReviewItems(answersRef.current);
      setQuizCompleted(true);
    }
  };

  const handleFinishMission = () => {
    if (assignmentId) {
      router.push("/dashboard/kid");
    } else {
      router.push(APP_ROUTES.Activities);
    }
  };

  const handleReset = () => {
    if (storageKey) {
      sessionStorage.removeItem(`${storageKey}-current`);
      sessionStorage.removeItem(`${storageKey}-selected`);
      sessionStorage.removeItem(`${storageKey}-correct`);
      sessionStorage.removeItem(`${storageKey}-time`);
    }
    answersRef.current = [];
    gameStartedAtRef.current = Date.now();
    setFinalGameStartedAt(0);
    setFinalReviewItems([]);
    setCurrentQuestion(0);
    setSelected(null);
    setTimeLeft(600);
    setQuizCompleted(false);
  };

  if (timeLeft === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-2 border-red-500/20 shadow-xl text-center p-8 space-y-6 bg-card">
          <div className="h-20 w-20 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
            <Timer className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-foreground">Time&apos;s Up!</h1>
            <p className="text-muted-foreground">
              Don&apos;t worry, even the best explorers need another try sometimes! Ready to go
              again?
            </p>
          </div>
          <Button
            onClick={handleReset}
            className="w-full rounded-full bg-sky-600 hover:bg-sky-700 py-6 text-lg font-bold shadow-lg"
          >
            Start Again
          </Button>
          <Link
            href={APP_ROUTES.Activities}
            className="block text-sm text-muted-foreground hover:text-foreground font-medium"
          >
            Back to Activities
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background flex flex-col relative h-full max-h-full overflow-hidden">
      <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      <main className="relative z-10 flex-1 px-4 py-4 md:px-6 flex flex-col min-h-0 overflow-hidden">
        <div className="mx-auto max-w-4xl w-full flex-1 flex flex-col justify-start gap-4 sm:gap-5 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between shrink-0">
            <Link
              href={APP_ROUTES.Activities}
              className="inline-flex items-center gap-1.5 text-green-600 font-bold hover:text-green-800 hover:-translate-x-1 transition-transform bg-card px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-sm border border-border w-fit text-xs sm:text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back{" "}
              <span className="hidden sm:inline">to Activities</span>
            </Link>

            <div className="rounded-full bg-card px-2.5 py-1 sm:px-4 sm:py-1 shadow-sm border border-border text-[10px] sm:text-xs">
              <span className="font-bold text-green-600">
                {quizCompleted
                  ? "Finished!"
                  : `Question ${currentQuestion + 1} of ${safeQuestions.length}`}
              </span>
            </div>
          </div>

          <div className="space-y-1 shrink-0">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:block">
                  Your Mission Progress
                </p>
                <h2 className="text-sm sm:text-lg md:text-2xl font-black text-foreground">
                  {quizTitle}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] sm:text-xs font-bold text-muted-foreground">
                <Timer className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-500" />{" "}
                {formatTime(timeLeft)}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-1.5 rounded-full [&>div]:bg-green-500 bg-green-500/10"
            />
          </div>

          <ActivityCard className="border-4 border-green-500/20 my-2">
            <ActivityCardContent>
              <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center gap-4 my-auto">
                <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black text-foreground leading-tight">
                  {quiz.question}
                </h2>
              </div>
            </ActivityCardContent>
          </ActivityCard>

          <div className="grid grid-cols-2 gap-2 shrink-0">
            {quiz.options.map((option) => {
              const isSelected = selected === option.id;
              const isCorrect = option.correct;
              const isAnswered = selected !== null;

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelect(option.id)}
                  className={`flex items-center justify-between rounded-xl border-2 px-3 py-1.5 sm:px-5 sm:py-2.5 text-left font-black text-xs sm:text-base transition duration-200 ${
                    isSelected
                      ? isCorrect
                        ? "border-green-500 bg-green-500/10 text-green-600 scale-[1.01]"
                        : "border-red-500 bg-red-500/10 text-red-600"
                      : isAnswered && isCorrect
                        ? "border-green-500 bg-green-500/5 text-green-600"
                        : "border-green-500/10 bg-card text-muted-foreground hover:border-green-500/40 hover:bg-green-500/5"
                  } ${isAnswered ? "cursor-default" : "cursor-pointer"}`}
                >
                  <span className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
                    <span
                      className={`flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold shrink-0 ${
                        isSelected
                          ? isCorrect
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                          : isAnswered && isCorrect
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {option.id}
                    </span>
                    <span className="truncate text-xs sm:text-sm md:text-base">{option.label}</span>
                  </span>
                  {isSelected &&
                    (isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 animate-in zoom-in shrink-0" />
                    ) : null)}
                </button>
              );
            })}
          </div>

          <div className="min-h-0 flex items-center justify-center shrink-0 mt-2">
            {selected !== null && (
              <div className="w-full animate-in slide-in-from-bottom-2 duration-300">
                <Card
                  className={`border-2 rounded-2xl ${
                    quiz.options.find((o) => o.id === selected)?.correct
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-red-500/30 bg-red-500/5"
                  }`}
                >
                  <CardContent className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between p-2.5 sm:p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-7 w-7 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-white shrink-0 ${
                          quiz.options.find((o) => o.id === selected)?.correct
                            ? "bg-green-600"
                            : "bg-red-600 animate-shake"
                        }`}
                      >
                        {quiz.options.find((o) => o.id === selected)?.correct ? (
                          <Star className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
                        ) : (
                          <span className="font-bold text-sm sm:text-base">!</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-xs">
                          {quiz.options.find((o) => o.id === selected)?.correct
                            ? "Awesome job, Explorer! 🚀"
                            : "Nice try, Space Ranger! 👍"}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">
                          {quiz.feedback}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Button
                        onClick={handleNext}
                        className="h-8 px-3 sm:h-9 sm:px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[10px] sm:text-xs font-bold"
                      >
                        {isLastQuestion ? "Finish Quiz" : "Next Question"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>

      <VictoryModal
        isOpen={quizCompleted}
        onReplay={handleReset}
        onContinue={handleFinishMission}
        xpEarned={Math.round((xpReward * correctCount) / (safeQuestions.length || 1))}
        activitySlug="quizzes"
        activityTitle="Quiz"
        score={`${Math.round((correctCount / (safeQuestions.length || 1)) * 100)}%`}
        scoreDescription={`Incredible brainpower! You completed the quiz "${quizTitle}".`}
        rewardsDescription={`${correctCount}/${safeQuestions.length} Correct Answers`}
        assignmentId={assignmentId}
        gameStartedAt={finalGameStartedAt}
        reviewData={
          {
            type: "quizzes",
            title: quizTitle,
            items: finalReviewItems,
            total_questions: safeQuestions.length,
            correct_count: correctCount,
          } satisfies QuizReviewData
        }
        onClaimSuccess={() => {
          if (storageKey) {
            sessionStorage.removeItem(`${storageKey}-current`);
            sessionStorage.removeItem(`${storageKey}-selected`);
            sessionStorage.removeItem(`${storageKey}-correct`);
            sessionStorage.removeItem(`${storageKey}-time`);
          }
        }}
      />
    </div>
  );
}
