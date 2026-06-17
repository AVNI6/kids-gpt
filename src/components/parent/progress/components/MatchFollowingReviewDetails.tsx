"use client";

import React from "react";
import type { MatchFollowingReviewData, MatchConnectionReviewItem } from "@/types/activity-review.types";

interface MatchFollowingReviewDetailsProps {
  data: MatchFollowingReviewData;
}

export default function MatchFollowingReviewDetails({ data }: MatchFollowingReviewDetailsProps) {
  const connections = (data.connections || []) as MatchConnectionReviewItem[];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
            Connections Done
          </span>
          <span className="text-base font-black text-slate-800 dark:text-slate-200">
            {data.total_pairs}
          </span>
        </div>
        <div>
          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
            Correct Matches
          </span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
            {data.correct_count} / {data.total_pairs}
          </span>
        </div>
      </div>

      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {connections.map((item, idx: number) => (
          <div
            key={idx}
            className="bg-card rounded-xl p-3 border border-slate-100 dark:border-slate-800 flex flex-col gap-2 shadow-xs"
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-800 dark:text-slate-200 leading-snug">
                {item.left_text}
              </span>
              <span className="text-slate-300 dark:text-slate-700">➔</span>
              <span className="text-emerald-600 dark:text-emerald-450 text-right leading-snug">
                {item.right_text}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2 text-[10px] font-bold">
              <span className="text-slate-550">Kid Connection:</span>
              {item.is_correct ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-black">
                  ✓ Correct Match
                </span>
              ) : (
                <span className="text-rose-500 flex items-center gap-1 font-black">
                  ❌ {item.kid_right_text || "None"}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
