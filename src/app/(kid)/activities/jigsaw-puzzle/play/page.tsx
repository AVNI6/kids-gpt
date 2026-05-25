"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import JigsawPuzzleStudio from "@/components/kid/jigsaw-puzzle/JigsawPuzzleStudio";
import { type JigsawPuzzleActivityContent } from "@/types/activities.type";
import { Button } from "@/components/ui/button";

function fromBase64(str: string) {
  try {
    // handle both browser and node-safe encodings
    const decoded =
      typeof window !== "undefined" ? atob(str) : Buffer.from(str, "base64").toString("utf-8");
    try {
      return JSON.parse(decodeURIComponent(escape(decoded)));
    } catch {
      // fallback: decoded is plain json
      return JSON.parse(decoded);
    }
  } catch (err) {
    console.error("Failed to decode puzzle content:", err);
    return null;
  }
}

export default function JigsawPlayPage() {
  const search = useSearchParams();
  const router = useRouter();
  const c = search?.get("c") || "";

  const content = useMemo(() => {
    if (!c) return null;
    return fromBase64(c) as JigsawPuzzleActivityContent | null;
  }, [c]);

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-black">No puzzle data found</h2>
          <p className="text-muted-foreground">Create a puzzle from the studio first.</p>
          <div className="mt-4">
            <Button onClick={() => router.push("/activities/jigsaw-puzzle")}>Open Studio</Button>
          </div>
        </div>
      </div>
    );
  }

  const title = `${content.correctedTopic} Jigsaw Puzzle 🧩`;
  const subtitle = "Your puzzle is ready locally — have fun!";

  return (
    <JigsawPuzzleStudio
      title={title}
      subtitle={subtitle}
      content={content}
      accentLabel="Local Puzzle"
    />
  );
}
