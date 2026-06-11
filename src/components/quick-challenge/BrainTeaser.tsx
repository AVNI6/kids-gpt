"use client";

import React, { useState } from "react";
import { BrainTeaserData } from "./types";
import { Sparkles, Brain, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BrainTeaserProps {
  data: BrainTeaserData;
  selectedAnswer: string | null;
  onSelectAnswer: (ans: string) => void;
  showResult: boolean;
}

export default function BrainTeaser({
  data,
  selectedAnswer,
  onSelectAnswer,
  showResult,
}: BrainTeaserProps) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 mb-1">
          <Brain className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-xl font-black text-foreground">Brain Teaser 🧠</h3>
        <p className="text-xs text-muted-foreground">
          Think outside the box to solve this tricky riddle!
        </p>
      </div>

      <div className="bg-purple-500/[0.03] dark:bg-purple-500/[0.01] border-2 border-dashed border-purple-500/20 rounded-2xl p-6 text-center shadow-xs">
        <p className="text-lg font-black text-foreground leading-relaxed">
          &ldquo;{data.question}&rdquo;
        </p>

        {/* Hint Section */}
        <div className="mt-4 flex flex-col items-center">
          {!showHint ? (
            <button
              onClick={() => setShowHint(true)}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" /> Need a Clue?
            </button>
          ) : (
            <div className="bg-purple-500/10 text-purple-600 rounded-xl px-4 py-2 text-xs font-bold border border-purple-500/20 max-w-xs animate-in zoom-in-95">
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
              ? "border-purple-500 bg-purple-500/10 text-purple-600"
              : "border-border hover:border-purple-500/30 hover:bg-purple-500/5";

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
