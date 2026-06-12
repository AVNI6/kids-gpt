"use client";

import React from "react";
import { Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { MatchItem, ConnectionState, SelectedDot } from "../types";

// ─── Left Card ──────────────────────────────────────────────────────────────

interface LeftCardProps {
  item: MatchItem;
  connections: ConnectionState;
  selectedDot: SelectedDot | null;
  incorrectItems: string[];
  hasSubmitted: boolean;
  onTap: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
}

export const LeftCard = React.memo(function LeftCard({
  item,
  connections,
  selectedDot,
  incorrectItems,
  hasSubmitted,
  onTap,
  onPointerDown,
}: LeftCardProps) {
  const isConnected = connections[item.id] !== undefined;
  const isSelected = selectedDot?.id === item.id && selectedDot?.side === "left";
  const isWrong = hasSubmitted && incorrectItems.includes(item.id);

  return (
    <div className="relative flex items-center w-full max-w-[140px] sm:max-w-[180px] md:max-w-[215px]">
      {/* Semantic tap-connect button */}
      <button
        type="button"
        disabled={hasSubmitted}
        onClick={onTap}
        className={`w-full py-4 px-5 rounded-[22px] border-4 text-left font-bold text-xs md:text-sm transition-all duration-300 select-none whitespace-normal break-words leading-relaxed focus-visible:ring-4 focus-visible:ring-orange-500/30 outline-none ${
          hasSubmitted
            ? isWrong
              ? "border-red-500 bg-red-500/10 text-red-700 opacity-90 scale-95 animate-shake"
              : "border-green-500 bg-green-500/10 text-green-700 opacity-60 scale-95"
            : isSelected
              ? "border-orange-500 bg-orange-500/10 text-orange-700 scale-102 shadow-md shadow-orange-500/10"
              : isConnected
                ? "border-orange-500/40 bg-orange-500/5 text-orange-600 scale-98"
                : "border-orange-500/20 bg-card text-foreground hover:bg-orange-500/5 hover:-translate-y-0.5 active:translate-y-px active:shadow-none shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-1">
          <span className="flex-1 min-w-0 text-left whitespace-normal break-words leading-relaxed pointer-events-none">
            {item.leftText}
          </span>
          {hasSubmitted ? (
            isWrong ? (
              <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0 pointer-events-none" />
            ) : (
              <CheckCircle2 className="h-4.5 w-4.5 text-green-500 shrink-0 pointer-events-none" />
            )
          ) : isSelected ? (
            <Sparkles className="h-4 w-4 text-orange-500 shrink-0 animate-pulse pointer-events-none" />
          ) : null}
        </div>
      </button>

      {/* Drag-handle dot — onPointerDown starts the SVG drawing */}
      <div
        id={`dot-left-${item.id}`}
        data-dot-side="left"
        data-dot-id={item.id}
        onPointerDown={onPointerDown}
        className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 bg-background z-30 cursor-crosshair transition-all flex items-center justify-center touch-none select-none ${
          hasSubmitted
            ? "pointer-events-none opacity-50 border-muted"
            : isSelected
              ? "border-orange-500 scale-120 animate-pulse ring-4 ring-orange-500/20"
              : isConnected
                ? "border-orange-500 scale-110 shadow-md shadow-orange-500/20"
                : "border-orange-500/20 hover:border-orange-500/60 hover:scale-110"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full transition-colors pointer-events-none ${
            hasSubmitted
              ? isWrong
                ? "bg-red-500"
                : "bg-green-500"
              : isConnected || isSelected
                ? "bg-orange-500 animate-pulse"
                : "bg-muted-foreground/30"
          }`}
        />
      </div>
    </div>
  );
});

// ─── Right Card ─────────────────────────────────────────────────────────────

interface RightCardProps {
  item: MatchItem;
  connections: ConnectionState;
  selectedDot: SelectedDot | null;
  hasSubmitted: boolean;
  onTap: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
}

export const RightCard = React.memo(function RightCard({
  item,
  connections,
  selectedDot,
  hasSubmitted,
  onTap,
  onPointerDown,
}: RightCardProps) {
  const isConnected = Object.values(connections).includes(item.id);
  const isSelected = selectedDot?.id === item.id && selectedDot?.side === "right";
  const connectedLeftId = Object.keys(connections).find((k) => connections[k] === item.id);
  const isWrong = hasSubmitted && !!connectedLeftId && connectedLeftId !== item.id;

  return (
    <div className="relative flex items-center w-full max-w-[140px] sm:max-w-[180px] md:max-w-[215px]">
      {/* Drag-handle dot */}
      <div
        id={`dot-right-${item.id}`}
        data-dot-side="right"
        data-dot-id={item.id}
        onPointerDown={onPointerDown}
        className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 bg-background z-30 cursor-crosshair transition-all flex items-center justify-center touch-none select-none ${
          hasSubmitted
            ? "pointer-events-none opacity-50 border-muted"
            : isSelected
              ? "border-orange-500 scale-120 animate-pulse ring-4 ring-orange-500/20"
              : isConnected
                ? "border-orange-500 scale-110 shadow-md shadow-orange-500/20"
                : "border-orange-500/20 hover:border-orange-500/60 hover:scale-110"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full transition-colors pointer-events-none ${
            hasSubmitted
              ? isWrong
                ? "bg-red-500"
                : "bg-green-500"
              : isConnected || isSelected
                ? "bg-orange-500 animate-pulse"
                : "bg-muted-foreground/30"
          }`}
        />
      </div>

      {/* Semantic tap-connect button */}
      <button
        type="button"
        disabled={hasSubmitted}
        onClick={onTap}
        className={`w-full py-4 px-5 rounded-[22px] border-4 text-right font-bold text-xs md:text-sm transition-all duration-300 select-none whitespace-normal break-words leading-relaxed focus-visible:ring-4 focus-visible:ring-orange-500/30 outline-none ${
          hasSubmitted
            ? isWrong
              ? "border-red-500 bg-red-500/10 text-red-700 opacity-90 scale-95 animate-shake"
              : "border-green-500 bg-green-500/10 text-green-700 opacity-60 scale-95"
            : isSelected
              ? "border-orange-500 bg-orange-500/10 text-orange-700 scale-102 shadow-md shadow-orange-500/10"
              : isConnected
                ? "border-orange-500/40 bg-orange-500/5 text-orange-600 scale-98"
                : "border-orange-500/20 bg-card text-foreground hover:bg-orange-500/5 hover:-translate-y-0.5 active:translate-y-px active:shadow-none shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-1">
          {hasSubmitted ? (
            isWrong ? (
              <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0 pointer-events-none" />
            ) : (
              <CheckCircle2 className="h-4.5 w-4.5 text-green-500 shrink-0 pointer-events-none" />
            )
          ) : isSelected ? (
            <Sparkles className="h-4 w-4 text-orange-500 shrink-0 animate-pulse pointer-events-none" />
          ) : null}
          <span className="flex-1 min-w-0 text-right whitespace-normal break-words leading-relaxed pointer-events-none">
            {item.rightText}
          </span>
        </div>
      </button>
    </div>
  );
});
