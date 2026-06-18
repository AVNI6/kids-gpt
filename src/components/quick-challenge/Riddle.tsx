"use client";

import React, { useState } from "react";
import { RiddleData } from "./types";
import { HelpCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RiddleProps {
  data: RiddleData;
  selectedAnswer: string | null;
  onSelectAnswer: (ans: string) => void;
  showResult: boolean;
}

export default function Riddle({ data, selectedAnswer, onSelectAnswer, showResult }: RiddleProps) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="flex flex-col gap-3.5 sm:gap-4.5 w-full">
      <div className="flex flex-col items-center text-center gap-1.5 sm:gap-2">
        <div className="inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 mb-0.5">
          <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
        </div>
        <h3 className="text-[clamp(1.125rem,4vw,1.375rem)] font-black text-foreground">
          Riddle Time 🧩
        </h3>
        <p className="text-[clamp(0.6875rem,2.5vw,0.8125rem)] text-muted-foreground leading-relaxed max-w-[280px] sm:max-w-none">
          Listen to the words and solve the mystery!
        </p>
      </div>

      <div className="bg-orange-500/[0.03] dark:bg-orange-500/[0.01] border-2 border-dashed border-orange-500/20 rounded-2xl p-3.5 sm:p-4.5 text-center shadow-xs w-full flex flex-col items-center gap-3">
        <p className="text-[clamp(0.95rem,3vw,1.125rem)] font-black text-foreground leading-relaxed">
          &ldquo;{data.question}&rdquo;
        </p>

        {/* Hint Section */}
        <div className="flex flex-col items-center gap-2">
          {!showHint ? (
            <button
              onClick={() => setShowHint(true)}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" /> Need a Hint?
            </button>
          ) : (
            <div className="bg-orange-500/10 text-orange-600 rounded-xl px-4 py-2 text-xs font-bold border border-orange-500/20 max-w-[280px] sm:max-w-xs animate-in zoom-in-95">
              💡 Hint: {data.hint}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {data.options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === data.answer;
          const buttonStyle = showResult
            ? isCorrect
              ? "!bg-green-600 dark:!bg-green-600 !text-white !border-green-600 dark:!border-green-700 scale-[1.01]"
              : isSelected
                ? "!bg-red-650 dark:!bg-red-650 text-black dark:text-white !border-red-600 dark:!border-red-700 opacity-90"
                : "opacity-40 border-border"
            : isSelected
              ? "border-orange-500 bg-orange-500/10 text-orange-600"
              : "border-border hover:border-orange-500/30 hover:bg-orange-500/5";

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
