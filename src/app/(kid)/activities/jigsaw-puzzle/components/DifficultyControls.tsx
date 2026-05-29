"use client";

import React from "react";
import { RefreshCw, LayoutGrid, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Difficulty } from "@/types/puzzle";
import UploadImageButton from "./UploadImageButton";

interface DifficultyControlsProps {
  difficulty: Difficulty;
  onDifficultyChange: (diff: Difficulty) => void;
  onReset: () => void;
  onImageSelected: (file: File) => void;
  onShowHint: () => void;
  isHintDisabled?: boolean;
  isLoading?: boolean;
}

export default function DifficultyControls({
  difficulty,
  onDifficultyChange,
  onReset,
  onImageSelected,
  onShowHint,
  isHintDisabled,
  isLoading,
}: DifficultyControlsProps) {
  const options: { label: string; value: Difficulty; colorClass: string }[] = [
    {
      label: "Easy (2x2)",
      value: 2,
      colorClass:
        "hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400",
    },
    {
      label: "Medium (3x3)",
      value: 3,
      colorClass:
        "hover:bg-sky-50 hover:text-sky-700 active:bg-sky-100 dark:hover:bg-sky-950/20 dark:hover:text-sky-400",
    },
    {
      label: "Hard (4x4)",
      value: 4,
      colorClass:
        "hover:bg-amber-50 hover:text-amber-700 active:bg-amber-100 dark:hover:bg-amber-950/20 dark:hover:text-amber-400",
    },
    {
      label: "Expert (5x5)",
      value: 5,
      colorClass:
        "hover:bg-rose-50 hover:text-rose-700 active:bg-rose-100 dark:hover:bg-rose-950/20 dark:hover:text-rose-400",
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full  bg-card/75 dark:bg-slate-900/60 p-6 rounded-3xl border border-border/80 dark:border-slate-800/80 shadow-xl backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <LayoutGrid className="size-4 text-sky-500" />
          Choose Difficulty
        </h3>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          {options.map((opt) => {
            const isActive = difficulty === opt.value;
            return (
              <Button
                key={opt.value}
                onClick={() => onDifficultyChange(opt.value)}
                disabled={isLoading}
                variant="outline"
                className={`rounded-2xl font-bold transition-all duration-300 py-5 px-2 text-xs sm:text-sm cursor-pointer w-full ${
                  isActive
                    ? "bg-sky-500 hover:bg-sky-600 text-white border-sky-500 shadow-md scale-105"
                    : `border-border dark:border-slate-850 text-foreground dark:text-slate-300 ${opt.colorClass}`
                }`}
              >
                {opt.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border dark:border-slate-800/80 pt-5">
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            onClick={onShowHint}
            disabled={isHintDisabled || isLoading}
            variant="outline"
            className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/60 dark:text-amber-400 font-bold px-3 py-5 text-xs sm:text-sm shadow-sm hover:border-amber-300 transition-all duration-300 cursor-pointer w-full"
          >
            <Eye className="mr-1.5 size-4" />
            Show Hint
          </Button>

          <Button
            onClick={onReset}
            disabled={isLoading}
            variant="outline"
            className="rounded-2xl border-2 border-border bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-800/20 dark:border-slate-700 text-foreground dark:text-slate-300 font-bold px-3 py-5 text-xs sm:text-sm shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 cursor-pointer w-full"
          >
            <RefreshCw className="mr-1.5 size-4" />
            Shuffle
          </Button>
        </div>

        <UploadImageButton onImageSelected={onImageSelected} isLoading={isLoading} />
      </div>
    </div>
  );
}
