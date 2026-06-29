"use client";

import React from "react";
import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Difficulty } from "@/types/puzzle";
import UploadImageButton from "./UploadImageButton";

interface DifficultyControlsProps {
  difficulty: Difficulty;
  onDifficultyChange: (diff: Difficulty) => void;
  onImageSelected: (file: File) => void;
  isLoading?: boolean;
}

export default function DifficultyControls({
  difficulty,
  onDifficultyChange,
  onImageSelected,
  isLoading,
}: DifficultyControlsProps) {
  const options: { label: string; value: Difficulty; colorClass: string }[] = [
    {
      label: "3x3",
      value: 3,
      colorClass:
        "hover:bg-sky-50 hover:text-sky-750 active:bg-sky-100 dark:hover:bg-sky-950/20 dark:hover:text-sky-400 border-sky-100/50 dark:border-sky-900/30",
    },
    {
      label: "4x4",
      value: 4,
      colorClass:
        "hover:bg-sky-50 hover:text-sky-755 active:bg-sky-100 dark:hover:bg-sky-950/20 dark:hover:text-sky-400 border-sky-100/50 dark:border-sky-900/30",
    },
    {
      label: "5x5",
      value: 5,
      colorClass:
        "hover:bg-sky-50 hover:text-sky-760 active:bg-sky-100 dark:hover:bg-sky-950/20 dark:hover:text-sky-400 border-sky-100/50 dark:border-sky-900/30",
    },
    {
      label: "6x6",
      value: 6,
      colorClass:
        "hover:bg-indigo-50 hover:text-indigo-700 active:bg-indigo-100 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 border-indigo-100/50 dark:border-indigo-900/30",
    },
    {
      label: "7x7",
      value: 7,
      colorClass:
        "hover:bg-indigo-50 hover:text-indigo-700 active:bg-indigo-100 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 border-indigo-100/50 dark:border-indigo-900/30",
    },
    {
      label: "8x8",
      value: 8,
      colorClass:
        "hover:bg-indigo-50 hover:text-indigo-700 active:bg-indigo-100 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 border-indigo-100/50 dark:border-indigo-900/30",
    },
    {
      label: "9x9",
      value: 9,
      colorClass:
        "hover:bg-purple-50 hover:text-purple-700 active:bg-purple-100 dark:hover:bg-purple-950/20 dark:hover:text-purple-400 border-purple-100/50 dark:border-purple-900/30",
    },
    {
      label: "10x10",
      value: 10,
      colorClass:
        "hover:bg-purple-50 hover:text-purple-700 active:bg-purple-100 dark:hover:bg-purple-950/20 dark:hover:text-purple-400 border-purple-100/50 dark:border-purple-900/30",
    },
    {
      label: "11x11",
      value: 11,
      colorClass:
        "hover:bg-purple-50 hover:text-purple-700 active:bg-purple-100 dark:hover:bg-purple-950/20 dark:hover:text-purple-400 border-purple-100/50 dark:border-purple-900/30",
    },
    {
      label: "12x12",
      value: 12,
      colorClass:
        "hover:bg-rose-50 hover:text-rose-700 active:bg-rose-100 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 border-rose-100/50 dark:border-rose-900/30",
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full bg-card/75 dark:bg-slate-900/60 p-6 rounded-3xl border border-border/80 dark:border-slate-800/80 shadow-xl backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <LayoutGrid className="size-4 text-sky-500" />
          Choose Difficulty
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {options.map((opt) => {
            const isActive = difficulty === opt.value;
            return (
              <Button
                key={opt.value}
                onClick={() => onDifficultyChange(opt.value)}
                disabled={isLoading}
                variant="outline"
                className={`rounded-2xl font-extrabold transition-all duration-350 py-3.5 px-1 text-[11px] sm:text-xs cursor-pointer w-full ${
                  isActive
                    ? "bg-sky-500 hover:bg-sky-600 text-white border-sky-500 shadow-md scale-105"
                    : `border-border dark:border-slate-800 text-foreground dark:text-slate-300 ${opt.colorClass}`
                }`}
              >
                {opt.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border dark:border-slate-800/80 pt-5">
        <UploadImageButton onImageSelected={onImageSelected} isLoading={isLoading} />
      </div>
    </div>
  );
}
