"use client";

import React from "react";
import { WhoAmIData } from "./types";
import { Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhoAmIProps {
  data: WhoAmIData;
  selectedAnswer: string | null;
  onSelectAnswer: (ans: string) => void;
  showResult: boolean;
}

export default function WhoAmI({ data, selectedAnswer, onSelectAnswer, showResult }: WhoAmIProps) {
  return (
    <div className="flex flex-col gap-5 sm:gap-6 w-full">
      <div className="flex flex-col items-center text-center gap-1.5 sm:gap-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-1">
          <HelpCircle className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-lg sm:text-xl font-black text-foreground">Who Am I? 🎭</h3>
        <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
          Read the clues carefully and guess the correct identity!
        </p>
      </div>

      <div className="bg-amber-500/[0.03] dark:bg-amber-500/[0.01] border-2 border-dashed border-amber-500/20 rounded-2xl p-3.5 sm:p-5 flex flex-col gap-2.5 sm:gap-3 w-full">
        {data.clues.map((clue, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 text-xs sm:text-sm font-semibold text-foreground/95 bg-card border border-border p-2.5 sm:p-3 rounded-xl shadow-xs"
          >
            <span className="text-amber-500 font-black shrink-0 select-none">Clue {idx + 1}:</span>
            <p className="leading-relaxed flex-1">{clue}</p>
          </div>
        ))}
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
              ? "border-amber-500 bg-amber-500/10 text-amber-600"
              : "border-border hover:border-amber-500/30 hover:bg-amber-500/5";

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
