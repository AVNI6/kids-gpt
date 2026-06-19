"use client";

import React from "react";
import { Award } from "lucide-react";
import type { MemoryMatchReviewData } from "@/types/activity-review.types";

interface MemoryMatchReviewDetailsProps {
  data: MemoryMatchReviewData;
  formatDuration: (seconds?: number | null) => string;
}

export default function MemoryMatchReviewDetails({
  data,
  formatDuration,
}: MemoryMatchReviewDetailsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5 text-center text-xs bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">
            World / Step
          </span>
          <span className="text-sm font-black text-slate-800 dark:text-slate-200">
            W{data.world_id} • S{data.step_number}
          </span>
        </div>
        <div>
          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">
            Flips Made
          </span>
          <span className="text-sm font-black text-sky-600 dark:text-sky-400">
            {data.total_flips}
          </span>
        </div>
        <div>
          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">
            Matches Found
          </span>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
            {data.matches_found} / {data.total_pairs}
          </span>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 border border-slate-100 dark:border-slate-800 text-center space-y-2 shadow-xs">
        <Award className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
        <h5 className="font-black text-sm text-slate-800 dark:text-slate-200">
          Memory Quest Succeeded!
        </h5>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          Your kid matched all {data.total_pairs} card pairs with a total of {data.total_flips}{" "}
          flips in {formatDuration(data.duration_seconds)}.
        </p>
      </div>
    </div>
  );
}
