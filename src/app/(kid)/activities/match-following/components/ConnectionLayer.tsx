"use client";

import React, { useState, useEffect } from "react";
import Xarrow, { Xwrapper } from "react-xarrows";
import { ConnectionState } from "../types";

interface ConnectionLayerProps {
  connections: ConnectionState;
  hasSubmitted: boolean;
  disconnectPair: (leftId: string) => void;
  activeLeftId: string | null;
  cursorAnchorRef: React.RefObject<HTMLDivElement | null>;
}

// Vibrant colors for established connections
const connectionColors = ["#f97316", "#3b82f6", "#a855f7", "#ec4899", "#06b6d4"];

export const ConnectionLayer = React.memo(function ConnectionLayer({
  connections,
  hasSubmitted,
  disconnectPair,
  activeLeftId,
  cursorAnchorRef,
}: ConnectionLayerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const connectionEntries = Object.entries(connections);

  return (
    <Xwrapper>
      {/* 1. Render all active completed connections */}
      {connectionEntries.map(([lId, rId], index) => {
        const isCorrect = lId === rId;

        let strokeColor = connectionColors[index % connectionColors.length];
        let strokeWidth = 6;
        let isDashed = false;

        if (hasSubmitted) {
          if (isCorrect) {
            strokeColor = "#10b981"; // Emerald green
            strokeWidth = 8;
          } else {
            strokeColor = "#ef4444"; // Rose red
            strokeWidth = 5;
            isDashed = true;
          }
        }

        return (
          <Xarrow
            key={`arrow-${lId}-${rId}`}
            start={`dot-left-${lId}`}
            end={`dot-right-${rId}`}
            color={strokeColor}
            strokeWidth={strokeWidth}
            path="smooth"
            showHead={false}
            dashness={isDashed ? { strokeLen: 8, nonStrokeLen: 5, animation: true } : false}
            passProps={{
              className: "opacity-90 transition-all duration-300 pointer-events-none select-none",
            }}
            labels={{
              middle: (
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
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-bounce font-black text-xs z-30">
                      ✓
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg animate-shake font-black text-xs z-30">
                      ×
                    </div>
                  )}
                </div>
              ),
            }}
          />
        );
      })}

      {/* 2. Render the active drag preview line */}
      {activeLeftId && (
        <Xarrow
          start={`dot-left-${activeLeftId}`}
          end="drag-pointer-anchor"
          color="#f97316"
          strokeWidth={5}
          path="smooth"
          showHead={false}
          dashness={{ strokeLen: 6, nonStrokeLen: 4, animation: true }}
          passProps={{
            className: "opacity-80 pointer-events-none select-none",
          }}
        />
      )}

      {/* 3. Render fixed-position DOM cursor anchor element with ripple effect */}
      <div
        ref={cursorAnchorRef}
        id="drag-pointer-anchor"
        className="absolute pointer-events-none z-50 w-[1px] h-[1px]"
        style={{
          display: activeLeftId ? "block" : "none",
          left: "0px",
          top: "0px",
        }}
      >
        <div className="relative -left-2.5 -top-2.5 w-5 h-5 flex items-center justify-center pointer-events-none">
          <span className="absolute w-4 h-4 rounded-full bg-orange-500 animate-ping opacity-75" />
          <span className="relative w-2.5 h-2.5 rounded-full bg-orange-500" />
        </div>
      </div>
    </Xwrapper>
  );
});
