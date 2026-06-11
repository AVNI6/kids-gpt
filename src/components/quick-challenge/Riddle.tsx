"use client";

import React, { useState } from "react";
import { RiddleData } from "./types";
import { Sparkles, HelpCircle, Lightbulb } from "lucide-react";
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
    <div className="flex flex-col gap-5 sm:gap-6 w-full">
      <div className="flex flex-col items-center text-center gap-1.5 sm:gap-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 mb-1">
          <HelpCircle className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-lg sm:text-xl font-black text-foreground">Riddle Time 🧩</h3>
        <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
          Listen to the words and solve the mystery!
        </p>
      </div>

      <div className="bg-orange-500/[0.03] dark:bg-orange-500/[0.01] border-2 border-dashed border-orange-500/20 rounded-2xl p-4 sm:p-6 text-center shadow-xs w-full flex flex-col items-center gap-3">
        <p className="text-base sm:text-lg font-black text-foreground leading-relaxed">
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
            <div className="bg-orange-500/10 text-orange-600 rounded-xl px-4 py-2 text-xs font-bold border border-orange-500/20 max-w-xs animate-in zoom-in-95">
              💡 Hint: {data.hint}
            </div>
          )}
        </div>
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
              ? "border-orange-500 bg-orange-500/10 text-orange-600"
              : "border-border hover:border-orange-500/30 hover:bg-orange-500/5";

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
