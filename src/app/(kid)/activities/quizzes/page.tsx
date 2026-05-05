"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Star, Timer, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

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
  const [timeLeft, setTimeLeft] = useState(60);

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

  const handleReset = () => {
    setCurrentQuestion(0);
    setSelected(null);
    setTimeLeft(600);
  };

  if (timeLeft === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-2 border-red-100 shadow-xl text-center p-8 space-y-6">
          <div className="h-20 w-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <Timer className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-800">Time&apos;s Up!</h1>
            <p className="text-slate-600">
              Don&apos;t worry, even the best explorers need another try sometimes! Ready to go
              again?
            </p>
          </div>
          <Button
            onClick={handleReset}
            className="w-full rounded-full bg-sky-600 hover:bg-sky-700 py-6 text-lg font-bold"
          >
            Start Again
          </Button>
          <Link
            href="/activities"
            className="block text-sm text-slate-500 hover:text-slate-800 font-medium"
          >
            Back to Activities
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="px-8 py-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <Link
            href="/activities"
            className="inline-flex items-center gap-2 text-slate-600 font-bold hover:text-slate-800 hover:-translate-x-1 transition-transform bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 w-fit"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Activities
          </Link>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span className="font-semibold">Your Mission Progress</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                <Timer className="h-4 w-4 text-orange-500" /> {formatTime(timeLeft)}
              </span>
            </div>
            <Progress value={progress} className="h-3 rounded-full" />
          </div>

          <Card className="border-2 border-slate-100 shadow-sm">
            <CardContent className="p-4">
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-slate-800">{quiz.question}</h2>
                <p className="text-sm text-slate-500">Pick the correct answer to move ahead!</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
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
                  className={`flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left font-semibold transition ${
                    isSelected
                      ? isCorrect
                        ? "border-green-500 bg-green-100 text-green-700"
                        : "border-red-500 bg-red-100 text-red-700"
                      : isAnswered && isCorrect
                        ? "border-green-500 bg-green-50 text-green-600"
                        : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50"
                  } ${isAnswered ? "cursor-default" : "cursor-pointer"}`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${
                        isSelected
                          ? isCorrect
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                          : isAnswered && isCorrect
                            ? "bg-green-500 text-white"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {option.id}
                    </span>
                    {option.label}
                  </span>
                  {isSelected &&
                    (isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">
                        X
                      </div>
                    ))}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Feedback Card */}
              <Card
                className={`border-2 ${
                  quiz.options.find((o) => o.id === selected)?.correct
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center text-white ${
                        quiz.options.find((o) => o.id === selected)?.correct
                          ? "bg-green-600"
                          : "bg-red-600"
                      }`}
                    >
                      {quiz.options.find((o) => o.id === selected)?.correct ? (
                        <Star className="h-6 w-6" />
                      ) : (
                        <span className="font-bold text-xl">!</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">
                        {quiz.options.find((o) => o.id === selected)?.correct
                          ? "Awesome job, Explorer!"
                          : "Nice try, Space Ranger!"}
                      </h3>
                      <p className="text-sm text-slate-600">{quiz.feedback}</p>
                    </div>
                  </div>
                  {isLastQuestion ? (
                    <Link href="/activities">
                      <Button className="rounded-full bg-green-600 hover:bg-green-700">
                        Finish Mission
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="rounded-full bg-sky-600 hover:bg-sky-700"
                    >
                      Next Question
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Tip Card */}
              <Card className="border-2 border-orange-200 bg-orange-50">
                <CardContent className="flex flex-col gap-3 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                    Pro Explorer Tip
                  </span>
                  <p className="text-slate-700">{quiz.tip}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
