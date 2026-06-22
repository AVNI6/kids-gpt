"use client";

import React from "react";
import type {
  MathChallengeReviewData,
  MathChallengeReviewItem,
} from "@/types/activity-review.types";

interface MathChallengeReviewDetailsProps {
  data: MathChallengeReviewData;
}

export default function MathChallengeReviewDetails({ data }: MathChallengeReviewDetailsProps) {
  const mathItems = (data.items || []) as MathChallengeReviewItem[];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
            Equations Answered
          </span>
          <span className="text-base font-black text-slate-800 dark:text-slate-200">
            {data.total_questions}
          </span>
        </div>
        <div>
          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
            Correct Challenges
          </span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
            {data.correct_count} / {data.total_questions}
          </span>
        </div>
      </div>

      <div className="space-y-3.5">
        {mathItems.map((item, idx: number) => (
          <div
            key={idx}
            className="bg-card rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-2 shadow-xs"
          >
            <div className="flex justify-between items-center text-xs">
              <span className="font-black text-sm text-slate-800 dark:text-slate-200">
                {item.question}
              </span>
              <span
                className={`font-black uppercase tracking-wider text-[9px] px-2 py-0.5 rounded-full ${
                  item.is_correct
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                }`}
              >
                {item.is_correct ? "Correct" : "Incorrect"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-slate-800/60 pt-2">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Kid Answer
                </span>
                <span
                  className={`font-black ${
                    item.is_correct ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                  }`}
                >
                  {item.kid_answer !== null ? item.kid_answer : "Skipped"}
                </span>
              </div>
              {!item.is_correct && (
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    Correct Answer
                  </span>
                  <span className="font-black text-slate-800 dark:text-slate-200">
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
