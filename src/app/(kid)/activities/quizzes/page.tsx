"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Timer, ArrowLeft, Star, Award } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/shared/ui/button";
import { Progress } from "@/components/shared/ui/progress";
import { Card, CardContent } from "@/components/shared/ui/card";
import { toast } from "sonner";
import { APP_ROUTES } from "@/lib/constants/common";
import { saveKidActivityProgress } from "@/lib/services/kid/dashboard.actions";
import { triggerConfettiSideCannons } from "@/components/shared/ui/confetti-side-cannons";
import { type QuizQuestionItem } from "@/types/activities.type";
import { getActivityXp } from "@/lib/services/kid/activities/activity.actions";

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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [xpReward, setXpReward] = useState<number>(120);
  const [completedClassroomId, setCompletedClassroomId] = useState<string | null>(null);
  const hasClaimed = useRef(false);

  useEffect(() => {
    getActivityXp("quizzes").then(setXpReward);
  }, []);

  const safeQuestions = questions.length > 0 ? questions : defaultQuestions;
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
  }, [timeLeft, quizCompleted]);

  // Background Auto-Claiming Logic
  useEffect(() => {
    if (quizCompleted && !hasClaimed.current) {
      hasClaimed.current = true;
      const autoClaim = async () => {
        const finalScorePercent = Math.round((correctCount / safeQuestions.length) * 100);
        const scoreStr = `${finalScorePercent}%`;
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
            const slug = quizTitle
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");

            const res = await saveKidActivityProgress(
              slug || "quizzes",
              xpReward,
              quizTitle,
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
  }, [quizCompleted, correctCount, safeQuestions.length, quizTitle, xpReward, assignmentId]);

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
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestion((prev) => prev + 1);
      setSelected(null);
    } else {
      setQuizCompleted(true);
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

  const handleReset = () => {
    setCurrentQuestion(0);
    setSelected(null);
    setTimeLeft(600);
    setCorrectCount(0);
    setQuizCompleted(false);
    hasClaimed.current = false;
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
    <div className="h-full bg-background overflow-hidden flex flex-col relative min-h-screen">
      <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      <main className="relative z-10 flex-1 px-4 py-4 md:px-8 md:py-5 overflow-hidden flex flex-col min-h-0">
        <div className="mx-auto max-w-4xl w-full h-full flex flex-col justify-between gap-3 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <Link
              href={APP_ROUTES.Activities}
              className="inline-flex items-center gap-2 text-green-600 font-bold hover:text-green-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Activities
            </Link>

            <div className="rounded-full bg-card px-4 py-1 shadow-sm border border-border text-xs">
              <span className="font-bold text-green-600">
                {quizCompleted
                  ? "Finished!"
                  : `Question ${currentQuestion + 1} of ${safeQuestions.length}`}
              </span>
            </div>
          </div>

          {quizCompleted ? (
            <Card className="border-4 border-green-500 shadow-xl rounded-[24px] bg-card flex-1 flex flex-col justify-center items-center p-8 text-center my-4 animate-in zoom-in duration-300">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[32px] bg-green-500/10 shrink-0 border-4 border-dashed border-green-500 animate-bounce">
                <Award className="h-12 w-12 text-green-600" />
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-foreground leading-tight">
                Quiz Accomplished! 🎉🏆
              </h2>
              <p className="text-muted-foreground mt-2 text-base max-w-md">
                Incredible brainpower! You completed the quiz{" "}
                <strong className="text-foreground">&quot;{quizTitle}&quot;</strong>.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-md">
                <div className="bg-green-500/10 rounded-2xl p-4 border border-green-500/20">
                  <h4 className="text-xs font-black uppercase text-green-600 tracking-wider">
                    Score
                  </h4>
                  <p className="text-3xl font-black text-green-600 mt-1">
                    {Math.round((correctCount / safeQuestions.length) * 100)}%
                  </p>
                </div>
                <div className="bg-sky-500/10 rounded-2xl p-4 border border-sky-500/20">
                  <h4 className="text-xs font-black uppercase text-sky-600 tracking-wider">
                    Correct
                  </h4>
                  <p className="text-3xl font-black text-sky-600 mt-1">
                    {correctCount} / {safeQuestions.length}
                  </p>
                </div>
                <div className="bg-yellow-500/10 rounded-2xl p-4 border border-yellow-500/20">
                  <h4 className="text-xs font-black uppercase text-yellow-600 tracking-wider">
                    XP Earned
                  </h4>
                  <p className="text-3xl font-black text-yellow-600 mt-1 flex items-center justify-center gap-1">
                    +{xpReward}{" "}
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500 inline animate-spin-slow" />
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <Button
                  onClick={handleReset}
                  className="flex-1 border-2 border-green-600 bg-transparent text-green-600 hover:bg-green-50 rounded-xl font-bold py-5 shadow-sm active:translate-y-px"
                >
                  Start Again
                </Button>
                <Button
                  onClick={handleFinishMission}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold py-5 shadow-md active:translate-y-px"
                >
                  Continue 🎉
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <div className="space-y-1.5 shrink-0">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Your Mission Progress
                    </p>
                    <h2 className="text-xl md:text-2xl font-black text-foreground">{quizTitle}</h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                    <Timer className="h-3.5 w-3.5 text-orange-500" /> {formatTime(timeLeft)}
                  </span>
                </div>
                <Progress
                  value={progress}
                  className="h-2 rounded-full [&>div]:bg-green-500 bg-green-500/10"
                />
              </div>

              <Card className="border-4 border-green-500/20 shadow-md bg-card flex-1 flex flex-col min-h-0 justify-center my-4 rounded-2xl">
                <CardContent className="p-6 flex flex-col justify-center min-h-0 overflow-y-auto text-center space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center mx-auto shrink-0">
                    <Star className="h-7 w-7" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-foreground leading-tight max-w-xl mx-auto">
                    {quiz.question}
                  </h2>
                </CardContent>
              </Card>

              <div className="grid gap-3 md:grid-cols-2 shrink-0">
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
                      className={`flex items-center justify-between rounded-[18px] border-4 px-6 py-4 text-left font-black text-base transition duration-200 ${
                        isSelected
                          ? isCorrect
                            ? "border-green-500 bg-green-500/10 text-green-600 scale-[1.01]"
                            : "border-red-500 bg-red-500/10 text-red-600"
                          : isAnswered && isCorrect
                            ? "border-green-500 bg-green-500/5 text-green-600"
                            : "border-green-500/10 bg-card text-muted-foreground hover:border-green-500/40 hover:bg-green-500/5"
                      } ${isAnswered ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
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
                        {option.label}
                      </span>
                      {isSelected &&
                        (isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 animate-in zoom-in" />
                        ) : null)}
                    </button>
                  );
                })}
              </div>

              <div className="h-32 flex items-center justify-center shrink-0 mt-4">
                {selected !== null && (
                  <div className="w-full animate-in slide-in-from-bottom-2 duration-300">
                    <Card
                      className={`border-4 rounded-[20px] ${
                        quiz.options.find((o) => o.id === selected)?.correct
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-red-500/30 bg-red-500/5"
                      }`}
                    >
                      <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center text-white shrink-0 ${
                              quiz.options.find((o) => o.id === selected)?.correct
                                ? "bg-green-600"
                                : "bg-red-600 animate-shake"
                            }`}
                          >
                            {quiz.options.find((o) => o.id === selected)?.correct ? (
                              <Star className="h-5 w-5" />
                            ) : (
                              <span className="font-bold text-lg">!</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground text-sm">
                              {quiz.options.find((o) => o.id === selected)?.correct
                                ? "Awesome job, Explorer! 🚀"
                                : "Nice try, Space Ranger! 👍"}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-tight">
                              {quiz.feedback}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <Button
                            onClick={handleNext}
                            className="h-11 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold"
                          >
                            {isLastQuestion ? "Finish Quiz" : "Next Question"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
