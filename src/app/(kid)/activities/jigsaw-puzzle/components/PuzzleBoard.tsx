"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PuzzlePiece } from "@/types/puzzle";
import PuzzleTile from "./PuzzleTile";

interface PuzzleBoardProps {
  pieces: PuzzlePiece[];
  gridSize: number;
  imageUrl: string;
  isSolved: boolean;
  isLoading?: boolean;
  boardRef: React.RefObject<HTMLDivElement | null>;
  onSnap: (pieceId: string) => void;
  onResize?: (width: number) => void;
}

export default function PuzzleBoard({
  pieces,
  gridSize,
  imageUrl,
  isSolved,
  isLoading,
  boardRef,
  onSnap,
  onResize,
}: PuzzleBoardProps) {
  const [boardSize, setBoardSize] = useState(0);

  // ── Measure container size ───────────────────────────────────────────
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const update = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      if (w > 0) {
        setBoardSize(w);
        onResize?.(w);
      }
    };

    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();

    return () => observer.disconnect();
  }, [boardRef, onResize]);

  const tileSize = boardSize > 0 ? boardSize / gridSize : 0;

  // Placed pieces go on the board
  const placedPieces = useMemo(() => pieces.filter((p) => p.isPlaced), [pieces]);

  return (
    <div
      ref={boardRef}
      className="relative w-full aspect-square mx-auto rounded-[28px] overflow-visible select-none shadow-2xl border border-border dark:border-slate-800/80 bg-slate-100/30 dark:bg-slate-950/60 backdrop-blur-xs"
      role="grid"
      aria-label="Jigsaw Puzzle Board"
    >
      {/* Faint image watermark guide for high-fidelity classic experience */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 26,
          backgroundImage: `url("${imageUrl}")`,
          backgroundSize: "100% 100%",
          backgroundPosition: "0 0",
          opacity: 0.12,
          filter: "contrast(1.1) brightness(0.9)",
          pointerEvents: "none",
        }}
      />

      {/* Decorative inner backing border highlight */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-[28px] pointer-events-none"
        style={{
          boxShadow: "inset 0 4px 20px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.05)",
          border: "1px solid var(--border)",
        }}
      />

      {/* Absolutely positioned placed tile layer */}
      {tileSize > 0 && !isLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: boardSize,
            height: boardSize,
            overflow: "visible",
            pointerEvents: "none", // placed pieces ignore events so you can drop overlapping items
          }}
        >
          {placedPieces.map((piece) => (
            <PuzzleTile
              key={piece.id}
              piece={piece}
              gridSize={gridSize}
              tileSize={tileSize}
              imageUrl={imageUrl}
              boardRef={boardRef}
              onSnap={onSnap}
              isDisabled={true} // Locked
            />
          ))}
        </div>
      )}

      {/* Solve state board border glow */}
      {isSolved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          aria-hidden
          className="absolute inset-0 rounded-[28px] pointer-events-none"
          style={{
            border: "3px solid rgba(16,185,129,0.85)",
            boxShadow: "0 0 40px rgba(16,185,129,0.3), inset 0 0 20px rgba(16,185,129,0.15)",
          }}
        />
      )}
    </div>
  );
}
