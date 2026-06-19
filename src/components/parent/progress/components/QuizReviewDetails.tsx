"use client";

import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { QuizReviewData } from "@/types/activity-review.types";

interface QuizReviewDetailsProps {
  data: QuizReviewData;
}

export default function QuizReviewDetails({ data }: QuizReviewDetailsProps) {
  const quizItems = (data.items || []) as Array<{
    question?: string;
    title?: string;
    sequence?: string[];
    kid_answer: string | null;
    correct_answer: string;
    is_correct: boolean;
  }>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
            Total Questions
          </span>
          <span className="text-base font-black text-slate-800 dark:text-slate-200">
            {data.total_questions}
          </span>
        </div>
        <div>
          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
            Correct Answers
          </span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
            {data.correct_count} / {data.total_questions}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {quizItems.map((item, idx: number) => (
          <div
            key={idx}
            className="bg-card rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-2.5 shadow-xs"
          >
            <div className="flex items-start gap-2.5">
              <span className="text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 select-none">
                {idx + 1}
              </span>
              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                {item.question ||
                  item.title ||
                  (item.sequence
                    ? `Complete the sequence: ${item.sequence.join(", ")}`
                    : "Question")}
              </h5>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">
                  Kid Answer
                </span>
                <span
                  className={`font-black flex items-center gap-1 ${
                    item.is_correct ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                  }`}
                >
                  {item.is_correct ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  {item.kid_answer || "Skipped"}
                </span>
              </div>

              {!item.is_correct && (
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Correct Answer
                  </span>
                  <span className="font-black text-slate-700 dark:text-slate-300">
                    {item.correct_answer}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
