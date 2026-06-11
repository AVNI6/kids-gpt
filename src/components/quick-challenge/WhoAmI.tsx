"use client";

import React from "react";
import { WhoAmIData } from "./types";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhoAmIProps {
  data: WhoAmIData;
  selectedAnswer: string | null;
  onSelectAnswer: (ans: string) => void;
  showResult: boolean;
}

export default function WhoAmI({ data, selectedAnswer, onSelectAnswer, showResult }: WhoAmIProps) {
  return (
    <div className="flex flex-col gap-3.5 sm:gap-4.5 w-full">
      <div className="flex flex-col items-center text-center gap-1.5 sm:gap-2">
        <div className="inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-0.5">
          <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
        </div>
        <h3 className="text-[clamp(1.125rem,4vw,1.375rem)] font-black text-foreground">
          Who Am I? 🎭
        </h3>
        <p className="text-[clamp(0.6875rem,2.5vw,0.8125rem)] text-muted-foreground leading-relaxed max-w-[280px] sm:max-w-none">
          Read the clues carefully and guess the correct identity!
        </p>
      </div>

      <div className="bg-amber-500/[0.03] dark:bg-amber-500/[0.01] border-2 border-dashed border-amber-500/20 rounded-2xl p-3 sm:p-4 flex flex-col gap-2 w-full">
        {data.clues.map((clue, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 text-[clamp(0.75rem,2.8vw,0.875rem)] font-semibold text-foreground/95 bg-card border border-border p-2.5 sm:p-3 rounded-xl shadow-xs"
          >
            <span className="text-amber-500 font-black shrink-0 select-none">Clue {idx + 1}:</span>
            <p className="leading-relaxed flex-1">{clue}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 w-full">
        {data.options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === data.answer;
          const buttonStyle = showResult
            ? isCorrect
              ? "!bg-green-600 dark:!bg-green-600 !text-white !border-green-600 dark:!border-green-700 scale-[1.01]"
              : isSelected
                ? "!bg-red-650 dark:!bg-red-650 !text-white !border-red-600 dark:!border-red-700 opacity-90"
                : "opacity-40 border-border"
            : isSelected
              ? "border-amber-500 bg-amber-500/10 text-amber-600"
              : "border-border hover:border-amber-500/30 hover:bg-amber-500/5";

          return (
            <Button
              key={option}
              variant="outline"
              onClick={() => onSelectAnswer(option)}
              className={`min-h-[3rem] sm:min-h-[3.25rem] h-auto w-full rounded-2xl border-2 font-bold transition-all ${buttonStyle} cursor-pointer flex items-center justify-start text-left px-4 sm:px-5 py-2.5 sm:py-3 whitespace-normal text-[clamp(0.8125rem,3vw,0.9375rem)] leading-relaxed gap-2.5 ${
                showResult ? "pointer-events-none" : ""
              }`}
            >
              <span className="flex-1">{option}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
