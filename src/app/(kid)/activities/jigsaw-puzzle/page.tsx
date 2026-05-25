"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import JigsawPuzzleStudio from "@/components/kid/jigsaw-puzzle/JigsawPuzzleStudio";
import { type JigsawPuzzleActivityContent } from "@/types/activities.type";

const defaultJigsawContent: JigsawPuzzleActivityContent = {
  correctedTopic: "Metaverse Portrait",
  selectedImage: "/jigsaw-puzzle/metaverse-portrait.webp",
  difficulty: "medium",
  rows: 5,
  columns: 5,
  totalPieces: 25,
  imageInstructions:
    "Slice the image into a balanced 5x5 puzzle with clean edges, smooth drag targets, and a centered preview frame.",
  gameplayTips:
    "Encourage kids to build from the corners first, then match colors and shapes across the board for a satisfying finish.",
  puzzleStyle: "classic-jigsaw",
  recommendedPieceSize: "92px",
  shufflePieces: true,
  snapSensitivity: "medium",
  previewEnabled: true,
  timerRecommended: false,
  hintsAllowed: true,
};

export default function JigsawPuzzlePage() {
  const [pendingEncoded, setPendingEncoded] = useState<string | null>(null);
  const [pendingContent, setPendingContent] = useState<JigsawPuzzleActivityContent | null>(null);

  const encodeContent = (obj: JigsawPuzzleActivityContent) => {
    try {
      const s = JSON.stringify(obj);
      return typeof window !== "undefined"
        ? window.btoa(unescape(encodeURIComponent(s)))
        : Buffer.from(s).toString("base64");
    } catch (err) {
      console.error("Failed to encode content:", err);
      return "";
    }
  };

  return (
    <>
      <JigsawPuzzleStudio
        title="Jigsaw Puzzle Atelier 🧩"
        subtitle="Build colorful story scenes, slice them into playful pieces, and generate a fresh puzzle from any topic you love."
        content={defaultJigsawContent}
        accentLabel="Puzzle Atelier"
        actionLabel="Prepare Puzzle"
        onAction={(c) => {
          const encoded = encodeContent(c);
          setPendingContent(c);
          setPendingEncoded(encoded || null);
        }}
      />

      {pendingContent && pendingEncoded && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-6 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">Ready to start?</h3>
                <p className="text-sm text-muted-foreground">
                  Your puzzle is prepared. Click Start Activity to begin.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPendingContent(null);
                    setPendingEncoded(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // navigate to play page with encoded content
                    window.location.href = `/activities/jigsaw-puzzle/play?c=${encodeURIComponent(
                      pendingEncoded
                    )}`;
                  }}
                >
                  Start Activity
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
