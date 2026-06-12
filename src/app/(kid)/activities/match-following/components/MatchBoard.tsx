"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { LeftCard, RightCard } from "./MatchCard";
import { MatchItem, ConnectionState, SelectedDot, DrawingState } from "../types";

// Vibrant colors for connection paths — identical to original
const connectionColors = ["#f97316", "#3b82f6", "#a855f7", "#ec4899", "#06b6d4"];

const getBezierPath = (sx: number, sy: number, ex: number, ey: number) => {
  const ctrl = Math.abs(ex - sx) * 0.45;
  return `M ${sx} ${sy} C ${sx + ctrl} ${sy}, ${ex - ctrl} ${ey}, ${ex} ${ey}`;
};

interface MatchBoardProps {
  pairs: MatchItem[];
  rightOrder: MatchItem[];
  connections: ConnectionState;
  selectedDot: SelectedDot | null;
  drawingState: DrawingState | null;
  setDrawingState: (s: DrawingState | null) => void;
  coords: Record<string, { x: number; y: number }>;
  recalculateCoords: (board: HTMLDivElement | null) => void;
  hasSubmitted: boolean;
  incorrectItems: string[];
  handleTapDot: (id: string, side: "left" | "right") => void;
  connectPairs: (leftId: string, rightId: string) => void;
  disconnectPair: (leftId: string) => void;
  playSound: (type: "pop" | "connect" | "disconnect" | "success" | "error" | "complete") => void;
}

export const MatchBoard = React.memo(function MatchBoard({
  pairs,
  rightOrder,
  connections,
  selectedDot,
  drawingState,
  setDrawingState,
  coords,
  recalculateCoords,
  hasSubmitted,
  incorrectItems,
  handleTapDot,
  connectPairs,
  disconnectPair,
  playSound,
}: MatchBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);

  // Recalculate on mount and resize — identical to original
  useEffect(() => {
    const board = boardRef.current;
    recalculateCoords(board);
    const onResize = () => recalculateCoords(board);
    window.addEventListener("resize", onResize);
    const timer = setTimeout(() => recalculateCoords(board), 150);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
    };
  }, [rightOrder, pairs, recalculateCoords]);

  // Original pointer-down handler — reads pre-computed coords, opens drawing state
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, id: string, side: "left" | "right") => {
      if (hasSubmitted) return;
      e.preventDefault();
      playSound("pop");

      const key = `${side}-${id}`;
      const startCoord = coords[key];
      if (!startCoord || !boardRef.current) return;

      const boardRect = boardRef.current.getBoundingClientRect();
      setDrawingState({
        startId: id,
        startSide: side,
        startX: startCoord.x,
        startY: startCoord.y,
        currentX: e.clientX - boardRect.left,
        currentY: e.clientY - boardRect.top,
      });
    },
    [hasSubmitted, coords, playSound, setDrawingState]
  );

  // Attach window pointermove/pointerup when drawing — identical to original
  useEffect(() => {
    if (!drawingState) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!boardRef.current) return;
      const boardRect = boardRef.current.getBoundingClientRect();
      setDrawingState({
        ...drawingState,
        currentX: e.clientX - boardRect.left,
        currentY: e.clientY - boardRect.top,
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!boardRef.current) return;

      const element = document.elementFromPoint(e.clientX, e.clientY);
      const targetDot = element?.closest("[data-dot-id]");

      if (targetDot) {
        const targetId = targetDot.getAttribute("data-dot-id")!;
        const targetSide = targetDot.getAttribute("data-dot-side") as "left" | "right";
        const { startId, startSide } = drawingState;

        if (targetSide !== startSide) {
          const leftId = startSide === "left" ? startId : targetId;
          const rightId = startSide === "right" ? startId : targetId;
          connectPairs(leftId, rightId);
          playSound("connect");
        } else {
          playSound("disconnect");
        }
      } else {
        const boardRect = boardRef.current.getBoundingClientRect();
        const dx = e.clientX - (drawingState.startX + boardRect.left);
        const dy = e.clientY - (drawingState.startY + boardRect.top);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= 8) {
          handleTapDot(drawingState.startId, drawingState.startSide);
        } else {
          playSound("disconnect");
        }
      }
      setDrawingState(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [drawingState, connectPairs, handleTapDot, playSound, setDrawingState]);

  // Headings
  const hasEmoji = (t: string) => /[\uD800-\uDFFF\u2600-\u27BF]/.test(t);
  const containsEmojis = pairs.some((p) => hasEmoji(p.leftText) || hasEmoji(p.rightText));
  const leftHeading = containsEmojis ? "Questions 🧩" : "Questions";
  const rightHeading = containsEmojis ? "Matches 🔗" : "Matches";

  return (
    <div
      ref={boardRef}
      className="relative flex-1 min-h-[400px] border-4 border-dashed border-orange-500/10 rounded-[32px] bg-orange-500/[0.01] items-center py-6 px-4 select-none touch-none mt-2"
    >
      {/* ── SVG Layer — absolute, pointer-events-none, renders above cards ── */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full z-20 overflow-visible">
        <defs>
          <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Established connection paths */}
        {Object.entries(connections).map(([lId, rId], index) => {
          const start = coords[`left-${lId}`];
          const end = coords[`right-${rId}`];
          if (!start || !end) return null;

          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          const isCorrect = lId === rId;

          let strokeColor = connectionColors[index % connectionColors.length];
          let strokeDash = "none";
          let strokeWidth = "6";

          if (hasSubmitted) {
            if (isCorrect) {
              strokeColor = "#10b981";
              strokeWidth = "8";
            } else {
              strokeColor = "#ef4444";
              strokeDash = "8,5";
              strokeWidth = "5";
            }
          }

          const d = getBezierPath(start.x, start.y, end.x, end.y);

          return (
            <g key={`conn-${lId}`}>
              {/* Glow shadow */}
              <path
                d={d}
                fill="none"
                stroke={strokeColor}
                strokeWidth={Number(strokeWidth) + 8}
                className="opacity-20 blur-[3px] transition-all duration-300"
              />
              {/* Main curve */}
              <path
                d={d}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDash}
                className="transition-all duration-300 animate-pulse-slow"
              />
              {/* Midpoint badge */}
              <foreignObject
                x={midX - 16}
                y={midY - 16}
                width={32}
                height={32}
                className="overflow-visible"
              >
                <div className="w-8 h-8 flex items-center justify-center pointer-events-auto select-none">
                  {!hasSubmitted ? (
                    <button
                      type="button"
                      onClick={() => disconnectPair(lId)}
                      className="w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 hover:scale-110 active:scale-95 transition-transform font-black text-sm z-30"
                      title="Delete connection"
                    >
                      ×
                    </button>
                  ) : isCorrect ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-bounce font-black text-xs">
                      ✓
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg animate-shake font-black text-xs">
                      ×
                    </div>
                  )}
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* Live preview line while dragging */}
        {drawingState && (
          <g>
            <path
              d={getBezierPath(
                drawingState.startX,
                drawingState.startY,
                drawingState.currentX,
                drawingState.currentY
              )}
              fill="none"
              stroke="#f97316"
              strokeWidth="12"
              className="opacity-20 blur-[2px]"
            />
            <path
              d={getBezierPath(
                drawingState.startX,
                drawingState.startY,
                drawingState.currentX,
                drawingState.currentY
              )}
              fill="none"
              stroke="#f97316"
              strokeWidth="5"
              strokeDasharray="6,4"
            />
            <circle
              cx={drawingState.currentX}
              cy={drawingState.currentY}
              r="8"
              fill="#f97316"
              className="animate-ping"
            />
            <circle cx={drawingState.currentX} cy={drawingState.currentY} r="5" fill="#f97316" />
          </g>
        )}
      </svg>

      {/* ── Card Columns ── */}
      <div className="grid grid-cols-2 gap-x-8 sm:gap-x-16 md:gap-x-24 lg:gap-x-32 gap-y-6 h-full items-center max-w-3xl mx-auto z-10 relative">
        {/* Left column */}
        <div className="flex flex-col gap-5 justify-center items-end w-full">
          <p className="text-[10px] font-black uppercase text-orange-600 text-center w-full tracking-widest mb-1 select-none">
            {leftHeading}
          </p>
          {pairs.map((item) => (
            <LeftCard
              key={`left-${item.id}`}
              item={item}
              connections={connections}
              selectedDot={selectedDot}
              incorrectItems={incorrectItems}
              hasSubmitted={hasSubmitted}
              onTap={() => handleTapDot(item.id, "left")}
              onPointerDown={(e) => handlePointerDown(e, item.id, "left")}
            />
          ))}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5 justify-center items-start w-full">
          <p className="text-[10px] font-black uppercase text-orange-600 text-center w-full tracking-widest mb-1 select-none">
            {rightHeading}
          </p>
          {rightOrder.map((item) => (
            <RightCard
              key={`right-${item.id}`}
              item={item}
              connections={connections}
              selectedDot={selectedDot}
              hasSubmitted={hasSubmitted}
              onTap={() => handleTapDot(item.id, "right")}
              onPointerDown={(e) => handlePointerDown(e, item.id, "right")}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
