"use client";

import React from "react";
import { Award } from "lucide-react";
import type { JigsawReviewData } from "@/types/activity-review.types";

interface JigsawPuzzleReviewDetailsProps {
  data: JigsawReviewData;
  formatDuration: (seconds?: number | null) => string;
}

export default function JigsawPuzzleReviewDetails({
  data,
  formatDuration,
}: JigsawPuzzleReviewDetailsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
            Puzzle Theme
          </span>
          <span className="text-base font-black text-slate-800 dark:text-slate-200 capitalize">
            {data.theme_name}
          </span>
        </div>
        <div>
          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
            Grid Difficulty
          </span>
          <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
            {data.grid_size} x {data.grid_size} ({data.grid_size * data.grid_size} pieces)
          </span>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 border border-slate-100 dark:border-slate-800 text-center space-y-2.5 shadow-xs">
        <Award className="w-10 h-10 text-emerald-500 mx-auto" />
        <h5 className="font-black text-sm text-slate-800 dark:text-slate-200">
          Jigsaw Solved!
        </h5>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          Your kid matched all {data.grid_size * data.grid_size} jigsaw pieces and assembled the{" "}
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {data.theme_name}
          </span>{" "}
          image correctly in {formatDuration(data.duration_seconds)}.
        </p>
      </div>
    </div>
  );
}
