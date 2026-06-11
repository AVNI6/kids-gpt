"use client";

import React from "react";
import { FactFusionData } from "./types";
import { Sparkles, GitMerge } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FactFusionProps {
  data: FactFusionData;
  selectedAnswer: string | null;
  onSelectAnswer: (ans: string) => void;
  showResult: boolean;
}

export default function FactFusion({
  data,
  selectedAnswer,
  onSelectAnswer,
  showResult,
}: FactFusionProps) {
  return (
    <div className="flex flex-col gap-5 sm:gap-6 w-full">
      <div className="flex flex-col items-center text-center gap-1.5 sm:gap-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 mb-1">
          <GitMerge className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-lg sm:text-xl font-black text-foreground">Fact Fusion ⚛️</h3>
        <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
          Combine the two clues to identify the subject!
        </p>
      </div>

      <div className="bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01] border-2 border-dashed border-emerald-500/20 rounded-2xl p-4 sm:p-6 text-center shadow-xs w-full flex flex-col justify-center items-center">
        <p className="text-sm sm:text-base font-black text-foreground leading-relaxed">
          {data.clue}
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full">
        {data.options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === data.answer;
          const buttonStyle = showResult
            ? isCorrect
              ? "bg-green-500 hover:bg-green-500 text-white border-green-600 scale-[1.01]"
              : isSelected
                ? "bg-red-500 hover:bg-red-500 text-white border-red-600 opacity-80"
                : "opacity-40 border-border"
            : isSelected
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
              : "border-border hover:border-emerald-500/30 hover:bg-emerald-500/5";

          return (
            <Button
              key={option}
              variant="outline"
              disabled={showResult}
              onClick={() => onSelectAnswer(option)}
              className={`min-h-[3.5rem] h-auto w-full rounded-2xl border-2 font-bold transition-all ${buttonStyle} cursor-pointer flex items-center justify-start text-left px-5 py-3.5 whitespace-normal text-sm sm:text-base leading-relaxed gap-3`}
            >
              {showResult && isCorrect && (
                <Sparkles className="h-5 w-5 fill-white text-white shrink-0" />
              )}
              <span className="flex-1">{option}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
