"use client";

import React from "react";
import type { FlashcardReviewData, FlashcardReviewItem } from "@/types/activity-review.types";

interface FlashcardReviewDetailsProps {
  data: FlashcardReviewData;
}

export default function FlashcardReviewDetails({ data }: FlashcardReviewDetailsProps) {
  const mastered = (data.mastered || []) as FlashcardReviewItem[];
  const reviewCards = (data.review || []) as FlashcardReviewItem[];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5 text-center text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">
            Total Reviewed
          </span>
          <span className="text-sm font-black text-slate-800 dark:text-slate-200">
            {data.total_cards}
          </span>
        </div>
        <div>
          <span className="text-emerald-500 font-bold block uppercase tracking-wider text-[9px]">
            Mastered
          </span>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
            {mastered.length}
          </span>
        </div>
        <div>
          <span className="text-amber-500 font-bold block uppercase tracking-wider text-[9px]">
            Needs Review
          </span>
          <span className="text-sm font-black text-amber-600 dark:text-amber-400">
            {reviewCards.length}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {mastered.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
              Mastered Cards ✓
            </h4>
            {mastered.map((item, idx: number) => (
              <div
                key={`m-${idx}`}
                className="bg-emerald-50/15 dark:bg-emerald-950/5 border border-emerald-100/30 dark:border-emerald-900/10 rounded-2xl p-3.5 flex flex-col gap-2.5 text-xs shadow-xs"
              >
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Question / Front
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {item.question}
                  </p>
                </div>
                <div className="space-y-0.5 border-t border-emerald-100/20 dark:border-emerald-900/20 pt-2">
                  <span className="text-emerald-500 font-bold block text-[10px] uppercase">
                    Answer / Back
                  </span>
                  <p className="font-black text-emerald-600 dark:text-emerald-400 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {reviewCards.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
              Needs More Review ⏳
            </h4>
            {reviewCards.map((item, idx: number) => (
              <div
                key={`r-${idx}`}
                className="bg-amber-50/15 dark:bg-amber-950/5 border border-amber-100/30 dark:border-amber-900/10 rounded-2xl p-3.5 flex flex-col gap-2.5 text-xs shadow-xs"
              >
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Question / Front
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {item.question}
                  </p>
                </div>
                <div className="space-y-0.5 border-t border-amber-100/20 dark:border-amber-900/20 pt-2">
                  <span className="text-amber-500 font-bold block text-[10px] uppercase">
                    Answer / Back
                  </span>
                  <p className="font-black text-amber-600 dark:text-amber-450 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
