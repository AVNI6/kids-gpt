"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Timer, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { APP_ROUTES } from "@/constant/AppRoutes";
import { saveKidActivityProgress } from "@/actions/dashboard.actions";

const quizDeck = [
  {
    title: "Solar System Explorers",
    question: 'Which planet is often called the "Red Planet"?',
    options: [
      { id: "A", label: "Venus" },
      { id: "B", label: "Mars", correct: true },
      { id: "C", label: "Jupiter" },
      { id: "D", label: "Saturn" },
    ],
    feedback: "Mars is the red planet because of iron oxide (rust).",
    tip: "Did you know Mars has the tallest volcano in the solar system? It's called Olympus Mons!",
  },
  {
    title: "Solar System Explorers",
    question: "Which planet is the biggest in our solar system?",
    options: [
      { id: "A", label: "Earth" },
      { id: "B", label: "Jupiter", correct: true },
      { id: "C", label: "Mars" },
      { id: "D", label: "Neptune" },
    ],
    feedback: "Jupiter is the largest planet and has the most moons.",
    tip: "Jupiter is so large that more than 1,300 Earths could fit inside it.",
  },
  {
    title: "Solar System Explorers",
    question: "Which planet has the most rings?",
    options: [
      { id: "A", label: "Saturn", correct: true },
      { id: "B", label: "Mercury" },
      { id: "C", label: "Venus" },
      { id: "D", label: "Mars" },
    ],
    feedback: "Saturn has the largest and most visible ring system.",
    tip: "Saturn has hundreds of rings made of ice and rock.",
  },
];

export default function QuizzesPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [correctCount, setCorrectCount] = useState(0);
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  const quiz = quizDeck[currentQuestion];
  const progress = ((currentQuestion + 1) / quizDeck.length) * 100;

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isLastQuestion = currentQuestion === quizDeck.length - 1;

  const handleSelect = (id: string) => {
    setSelected(id);
    const option = quiz.options.find((o) => o.id === id);
    if (option?.correct) {
      setCorrectCount((prev) => prev + 1);
    }

    if (isLastQuestion) {
      toast.success("Mission Accomplished!", {
        description: "You've completed the quiz and explored the stars! 🚀✨",
      });
    }
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestion((prev) => prev + 1);
      setSelected(null);
    }
  };

  const handleFinishMission = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSavingProgress(true);

    const finalScorePercent = Math.round((correctCount / quizDeck.length) * 100);
    const scoreStr = `${finalScorePercent}%`;

    try {
      const res = await saveKidActivityProgress(
        "solar-system-explorers",
        120,
        "Solar System Explorers Quiz",
        scoreStr
      );
      if (res.success) {
        toast.success("Progress Saved!", {
          description: "+120 XP earned! Streak updated! 🎉",
        });
      } else {
        toast.error("Failed to save progress", {
          description: res.error || "Please try again later.",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving progress");
    } finally {
      setIsSavingProgress(false);
      window.location.href = APP_ROUTES.Activities;
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setSelected(null);
    setTimeLeft(600);
    setCorrectCount(0);
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
    <div className="h-full bg-background overflow-hidden flex flex-col">
      <main className="flex-1 px-4 py-4 md:px-8 md:py-5 overflow-hidden flex flex-col min-h-0">
        <div className="mx-auto max-w-4xl w-full h-full flex flex-col justify-between gap-3 min-h-0">
          <Link
            href={APP_ROUTES.Activities}
            className="inline-flex items-center gap-2 text-muted-foreground font-bold hover:text-foreground hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm shrink-0"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Activities
          </Link>

          <div className="space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold">Your Mission Progress</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs">
                <Timer className="h-3.5 w-3.5 text-orange-500" /> {formatTime(timeLeft)}
              </span>
            </div>
            <Progress value={progress} className="h-2 rounded-full" />
          </div>

          <Card className="border-2 border-border shadow-sm bg-card flex-1 flex flex-col min-h-0 justify-center">
            <CardContent className="p-4 md:p-5 flex-1 flex flex-col justify-center min-h-0 overflow-y-auto">
              <div className="space-y-1.5">
                <h2 className="text-xl md:text-2xl font-black text-foreground leading-tight">
                  {quiz.question}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Pick the correct answer to move ahead!
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-2 md:grid-cols-2 shrink-0">
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
                  className={`flex items-center justify-between rounded-xl border-2 px-4 py-2.5 text-left font-semibold text-sm transition ${
                    isSelected
                      ? isCorrect
                        ? "border-green-500 bg-green-500/10 text-green-600"
                        : "border-red-500 bg-red-500/10 text-red-600"
                      : isAnswered && isCorrect
                        ? "border-green-500 bg-green-500/5 text-green-600"
                        : "border-border bg-card text-muted-foreground hover:border-sky-500/50 hover:bg-sky-500/5"
                  } ${isAnswered ? "cursor-default" : "cursor-pointer"}`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
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
                    (isCorrect ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : null)}
                </button>
              );
            })}
          </div>

          <div className="h-28 flex items-center justify-center shrink-0">
            {selected !== null && (
              <div className="w-full animate-in fade-in">
                <Card
                  className={`border-2 ${
                    quiz.options.find((o) => o.id === selected)?.correct
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-red-500/30 bg-red-500/5"
                  }`}
                >
                  <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-white shrink-0 ${
                          quiz.options.find((o) => o.id === selected)?.correct
                            ? "bg-green-600"
                            : "bg-red-600"
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
                            ? "Awesome job, Explorer!"
                            : "Nice try, Space Ranger!"}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-tight">
                          {quiz.feedback}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isLastQuestion ? (
                        <Button
                          onClick={handleFinishMission}
                          disabled={isSavingProgress}
                          className="h-9 rounded-full bg-green-600 hover:bg-green-700 text-sm"
                        >
                          {isSavingProgress ? "Saving..." : "Finish Mission"}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleNext}
                          className="h-9 rounded-full bg-sky-600 hover:bg-sky-700 text-sm"
                        >
                          Next Question
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
