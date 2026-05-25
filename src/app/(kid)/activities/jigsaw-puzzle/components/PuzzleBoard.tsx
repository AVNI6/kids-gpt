"use client";

import React, { useMemo, useState } from "react";
import { PuzzlePiece } from "@/types/puzzle";
import PuzzleTile from "./PuzzleTile";
import { motion } from "framer-motion";

interface PuzzleBoardProps {
  pieces: PuzzlePiece[];
  gridSize: number;
  imageUrl: string;
  selectedPieceId: string | null;
  onPieceSelect: (pieceId: string | null) => void;
  onPieceSwap: (pieceId1: string, pieceId2: string) => void;
  isSolved: boolean;
  isLoading?: boolean;
}

export default function PuzzleBoard({
  pieces,
  gridSize,
  imageUrl,
  selectedPieceId,
  onPieceSelect,
  onPieceSwap,
  isSolved,
  isLoading,
}: PuzzleBoardProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Sort pieces by currentIndex so they render in their shuffled positions
  const renderedPieces = useMemo(() => {
    return [...pieces].sort((a, b) => a.currentIndex - b.currentIndex);
  }, [pieces]);

  // Handle tile click actions (Select vs Swap)
  const handleTileClick = (pieceId: string) => {
    if (isSolved || isLoading || isTransitioning) return;

    if (selectedPieceId === null) {
      // First tap selects the piece
      onPieceSelect(pieceId);
    } else if (selectedPieceId === pieceId) {
      // Tapping the same piece again deselects it
      onPieceSelect(null);
    } else {
      // Second tap swaps selected with targeted piece
      setIsTransitioning(true);
      onPieceSwap(selectedPieceId, pieceId);

      // Lock interactions temporarily to prevent click spam and race conditions during motion swaps
      setTimeout(() => {
        setIsTransitioning(false);
      }, 350);
    }
  };

  const gridStyles =
    {
      2: "grid-cols-2 gap-3 p-3 rounded-[28px]",
      3: "grid-cols-3 gap-2.5 p-2.5 rounded-[30px]",
      4: "grid-cols-4 gap-2 p-2 rounded-[32px]",
      5: "grid-cols-5 gap-1.5 p-1.5 rounded-[32px]",
    }[gridSize as 2 | 3 | 4 | 5] || "grid-cols-3 gap-2 p-2";

  return (
    <div
      className="relative w-full max-w-2xl aspect-square mx-auto"
      role="grid"
      aria-label="Jigsaw Puzzle Board"
    >
      {/* Dynamic CSS Grid for Tiles */}
      <div
        className={`grid ${gridStyles} w-full h-full bg-slate-100 dark:bg-slate-950/80 border-2 border-sky-100/80 dark:border-slate-800 shadow-inner ring-4 ring-sky-100/50 dark:ring-slate-900/60 transition-all duration-300`}
      >
        {renderedPieces.map((piece) => (
          <PuzzleTile
            key={piece.id}
            piece={piece}
            gridSize={gridSize}
            imageUrl={imageUrl}
            isSelected={selectedPieceId === piece.id}
            onClick={() => handleTileClick(piece.id)}
            isDisabled={isSolved || isLoading || isTransitioning}
          />
        ))}
      </div>

      {/* Solved overlay state for celebration visual feedback */}
      {isSolved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 pointer-events-none rounded-[32px] ring-8 ring-emerald-500 ring-offset-4 animate-pulse duration-1000"
        />
      )}
    </div>
  );
}
