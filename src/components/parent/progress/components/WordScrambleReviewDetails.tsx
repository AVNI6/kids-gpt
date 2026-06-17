"use client";

import React from "react";
import type { WordScrambleReviewData, WordScrambleReviewItem } from "@/types/activity-review.types";

interface WordScrambleReviewDetailsProps {
  data: WordScrambleReviewData;
}

export default function WordScrambleReviewDetails({ data }: WordScrambleReviewDetailsProps) {
  const scrambleItems = (data.items || []) as WordScrambleReviewItem[];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
            Words Attempted
          </span>
          <span className="text-base font-black text-slate-800 dark:text-slate-200">
            {data.total_words}
          </span>
        </div>
        <div>
          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
            Spelled Correctly
          </span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
            {data.correct_count} / {data.total_words}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {scrambleItems.map((item, idx: number) => (
          <div
            key={idx}
            className="bg-card rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 flex flex-col gap-2 shadow-xs"
          >
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-400 text-[10px] uppercase">
                Scrambled: {item.scrambled}
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

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-slate-400 font-semibold text-[10px] block uppercase">
                  Kid Answer
                </span>
                <span
                  className={`font-black uppercase tracking-wide ${
                    item.is_correct
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-500"
                  }`}
                >
                  {item.kid_input || "None"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold text-[10px] block uppercase">
                  Correct Spelling
                </span>
                <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  {item.correct_answer}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
