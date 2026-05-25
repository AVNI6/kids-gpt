"use client";

import React from "react";
import { PuzzlePiece } from "@/types/puzzle";
import { motion } from "framer-motion";

interface PuzzleTileProps {
  piece: PuzzlePiece;
  gridSize: number;
  imageUrl: string;
  isSelected: boolean;
  onClick: () => void;
  isDisabled?: boolean;
}

export default function PuzzleTile({
  piece,
  gridSize,
  imageUrl,
  isSelected,
  onClick,
  isDisabled,
}: PuzzleTileProps) {
  const { correctIndex } = piece;

  // Slicing arithmetic logic with division-by-zero protection (gridSize is 2-5, so divisor >= 1)
  const divisor = gridSize > 1 ? gridSize - 1 : 1;
  const colIndex = correctIndex % gridSize;
  const rowIndex = Math.floor(correctIndex / gridSize);

  const xPosition = colIndex * (100 / divisor);
  const yPosition = rowIndex * (100 / divisor);

  // Keyboard accessibility helper for swap triggers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.button
      layout
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      aria-label={`Puzzle tile at spot ${piece.currentIndex + 1}. Correct place is ${piece.correctIndex + 1}`}
      className={`relative w-full aspect-square rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 focus-visible:z-30 select-none cursor-pointer ${
        isSelected
          ? "ring-4 ring-amber-500 scale-[0.96] z-20 shadow-lg border-2 border-amber-300 dark:border-amber-400"
          : isDisabled
            ? "cursor-default"
            : "hover:scale-[1.02] hover:shadow-md hover:z-10"
      }`}
      style={{
        backgroundImage: `url("${imageUrl}")`,
        backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
        backgroundPosition: `${xPosition}% ${yPosition}%`,
      }}
    >
      {/* Decorative inner border overlay for playfulness */}
      <span className="absolute inset-0 rounded-2xl border border-white/25 pointer-events-none" />

      {/* Visual cue when a piece is in its correct place */}
      {piece.currentIndex === piece.correctIndex && !isDisabled && (
        <span className="absolute bottom-1 right-1 bg-green-500/80 text-white rounded-full p-0.5 text-[8px] font-bold shadow-xs">
          ✅
        </span>
      )}

      {/* Accessibility helper for screen readers */}
      {piece.currentIndex === piece.correctIndex && (
        <span className="sr-only">Piece placed correctly</span>
      )}
    </motion.button>
  );
}
