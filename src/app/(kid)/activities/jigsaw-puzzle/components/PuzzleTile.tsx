"use client";

import React, { useMemo, useRef, useState, CSSProperties } from "react";
import { motion } from "framer-motion";
import { PuzzlePiece } from "@/types/puzzle";
import { getBoundingBoxSize, TAB_RATIO, getJigsawSVGPath } from "@/lib/puzzle/geometry";

interface PuzzleTileProps {
  piece: PuzzlePiece;
  gridSize: number;
  tileSize: number;
  imageUrl: string;
  boardRef: React.RefObject<HTMLDivElement | null>;
  onSnap: (pieceId: string) => void;
  isDisabled?: boolean;
}

export default function PuzzleTile({
  piece,
  gridSize,
  tileSize,
  imageUrl,
  boardRef,
  onSnap,
  isDisabled,
}: PuzzleTileProps) {
  const { correctIndex, edges, tabVariants, isPlaced, startX, startY } = piece;
  const tileRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ── Layout & Slicing Math ─────────────────────────────────────────────
  const TAB = TAB_RATIO * tileSize; // absolute tab depth (px)
  const pad = TAB; // padding on each side
  const bboxSize = getBoundingBoxSize(tileSize); // tileSize + 2*pad

  // Source image slice position (which part of the image to display)
  const srcCol = correctIndex % gridSize;
  const srcRow = Math.floor(correctIndex / gridSize);

  // Image bleed adjustment so the correct slice aligns perfectly
  const bgSizePx = gridSize * tileSize;
  const bgOffsetX = -(srcCol * tileSize - pad);
  const bgOffsetY = -(srcRow * tileSize - pad);

  // SVG path D attribute (memoized) - used for clipPath to restrict pointer events
  const pathD = useMemo(
    () =>
      getJigsawSVGPath({
        tileW: tileSize,
        tileH: tileSize,
        edges,
        variants: tabVariants,
      }),
    [tileSize, edges, tabVariants]
  );

  // ── Drag & Snap Handlers ──────────────────────────────────────────────
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);

    if (!tileRef.current || !boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const tileRect = tileRef.current.getBoundingClientRect();

    // Calculate tile's bounding-box top-left relative to the board's top-left
    const relativeX = tileRect.left - boardRect.left;
    const relativeY = tileRect.top - boardRect.top;

    // The target logical top-left for this tile (offset by pad for the SVG overflow)
    const targetLeft = srcCol * tileSize - pad;
    const targetTop = srcRow * tileSize - pad;

    const dx = relativeX - targetLeft;
    const dy = relativeY - targetTop;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Magnetic snap tolerance threshold (35px is forgiving and feels awesome)
    if (distance < 35) {
      onSnap(piece.id);
    }
  };

  // ── Styles ───────────────────────────────────────────────────────────
  const clipPathId = `clip-${piece.id}-${tileSize}`;

  const tileStyle: CSSProperties = {
    position: "absolute",
    width: bboxSize,
    height: bboxSize,
    backgroundImage: `url("${imageUrl}")`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${bgSizePx}px ${bgSizePx}px`,
    backgroundPosition: `${bgOffsetX}px ${bgOffsetY}px`,

    // High fidelity clipping of both geometry AND pointer event interactions
    clipPath: `url(#${clipPathId})`,
    WebkitClipPath: `url(#${clipPathId})`,

    imageRendering: "auto",
    willChange: "transform",
  };

  // Position coordinates based on whether the piece is placed or in the tray
  const positioningStyle: CSSProperties = isPlaced
    ? {
        left: srcCol * tileSize - pad,
        top: srcRow * tileSize - pad,
        zIndex: 10 + srcRow * gridSize + srcCol,
      }
    : {
        left: `calc(${startX}% - ${bboxSize / 2}px)`,
        top: `calc(${startY}% - ${bboxSize / 2}px)`,
        zIndex: isDragging ? 100 : 20,
      };

  // Modern drop shadows and highlight strokes
  const designStyle: CSSProperties = isPlaced
    ? {
        filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.15))",
        cursor: "default",
      }
    : isDragging
      ? {
          filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.3))",
          cursor: "grabbing",
        }
      : {
          filter: "drop-shadow(0px 3px 6px rgba(0,0,0,0.22))",
          cursor: "grab",
        };

  return (
    <>
      {/* Invisible SVG definition containing the clipPath which clips pointer-events boundary */}
      <svg
        width="0"
        height="0"
        style={{ position: "absolute", pointerEvents: "none" }}
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipPathId} clipPathUnits="userSpaceOnUse">
            <path d={pathD} />
          </clipPath>
        </defs>
      </svg>

      <motion.button
        ref={tileRef}
        drag={!isPlaced && !isDisabled}
        dragMomentum={false}
        dragTransition={{ power: 0, timeConstant: 0 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={{
          x: 0,
          y: 0,
          scale: isPlaced ? 1 : isDragging ? 1.08 : 0.96,
        }}
        transition={
          isDragging
            ? { type: "spring", stiffness: 350, damping: 25 }
            : { type: "spring", stiffness: 220, damping: 20 }
        }
        disabled={isPlaced || isDisabled}
        style={{ ...tileStyle, ...positioningStyle, ...designStyle }}
        className="focus:outline-none select-none touch-none"
        aria-label={`Puzzle piece ${piece.id}. ${isPlaced ? "Placed correctly." : "In tray."}`}
      >
        {/* Glossy top reflection highlight */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
      </motion.button>
    </>
  );
}
