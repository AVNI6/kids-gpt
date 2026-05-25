"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  Timer,
  Shuffle,
  ScanSearch,
  Palette,
  Wand2,
  Layers3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/constant/AppRoutes";
import { type JigsawPuzzleActivityContent } from "@/types/activities.type";

const studioScenes = [
  {
    src: "/jigsaw-puzzle/metaverse-portrait.webp",
    title: "Metaverse Portrait",
    caption: "A dreamy digital world with neon edges.",
  },
  {
    src: "/jigsaw-puzzle/cityscape-of-hong-kong-and-junkboat-at-twilight.webp",
    title: "Twilight City",
    caption: "A glowing skyline above the water.",
  },
  {
    src: "/jigsaw-puzzle/Anastronautridingahorseinaphotorealisticstyle6.webp",
    title: "Astronaut Adventure",
    caption: "A playful space scene with storybook energy.",
  },
  {
    src: "/jigsaw-puzzle/360_F_832252608_Aj6e38MCjkf6XwppkLCRLUkAzbnpbywI.webp",
    title: "Cosmic Spiral",
    caption: "A bright abstract swirl for trickier puzzles.",
  },
  {
    src: "/jigsaw-puzzle/315751175_6424346414249018_4776111044190949685_n.webp",
    title: "Painterly Frame",
    caption: "A bold, colorful image with art-studio vibes.",
  },
];

interface JigsawPuzzleStudioProps {
  title: string;
  subtitle: string;
  content: JigsawPuzzleActivityContent;
  accentLabel?: string;
  actionLabel?: string;
  // onAction receives the current content snapshot when user clicks Generate
  onAction?: (content: JigsawPuzzleActivityContent) => void;
}

function PuzzlePreview({ image, rows, columns }: { image: string; rows: number; columns: number }) {
  const previewRows = Math.max(2, Math.min(rows, 4));
  const previewColumns = Math.max(2, Math.min(columns, 4));
  const totalTiles = previewRows * previewColumns;

  return (
    <div className="relative overflow-hidden rounded-[28px] border-4 border-white/70 bg-background/80 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
      <div className="absolute left-4 top-4 z-10 rounded-full bg-background/90 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-orange-600 shadow-sm">
        Preview {previewRows}x{previewColumns}
      </div>

      <div
        className="grid gap-2 p-4"
        style={{ gridTemplateColumns: `repeat(${previewColumns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: totalTiles }).map((_, index) => {
          const rowIndex = Math.floor(index / previewColumns);
          const columnIndex = index % previewColumns;
          const x = previewColumns === 1 ? 50 : (columnIndex / (previewColumns - 1)) * 100;
          const y = previewRows === 1 ? 50 : (rowIndex / (previewRows - 1)) * 100;

          return (
            <div
              key={`${rowIndex}-${columnIndex}`}
              className="aspect-square overflow-hidden rounded-2xl border border-white/70 shadow-sm ring-1 ring-black/5"
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: `${previewColumns * 100}% ${previewRows * 100}%`,
                backgroundPosition: `${x}% ${y}%`,
                backgroundRepeat: "no-repeat",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function JigsawPuzzleStudio({
  title,
  subtitle,
  content,
  accentLabel = "Puzzle Atelier",
  actionLabel = "Generate Puzzle",
  onAction,
}: JigsawPuzzleStudioProps) {
  // local interactive state (allows image/grid/shuffle without server)
  const [selectedImage, setSelectedImage] = useState<string>(content.selectedImage);
  const [rows, setRows] = useState<number>(content.rows);
  const [columns, setColumns] = useState<number>(content.columns);
  const [shufflePieces, setShufflePieces] = useState<boolean>(content.shufflePieces ?? true);

  const selectedScene =
    studioScenes.find((scene) => scene.src === selectedImage) || studioScenes[0] || studioScenes[1];

  const isClassic = content.puzzleStyle === "classic-jigsaw";

  // initial automatic shuffle is handled by initial state; avoid setState in effect

  const currentContent: JigsawPuzzleActivityContent = {
    ...content,
    selectedImage,
    rows,
    columns,
    totalPieces: rows * columns,
    shufflePieces,
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute -top-20 left-10 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-6 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

      <main className="relative z-10 px-4 py-4 md:px-8 md:py-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <Link
              href={APP_ROUTES.Activities}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-black text-foreground shadow-sm transition-transform hover:-translate-x-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Activities
            </Link>

            <Badge className="rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-orange-600 font-black">
              {accentLabel}
            </Badge>
          </div>

          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <Card className="overflow-hidden rounded-[32px] border-4 border-orange-500/20 bg-card shadow-[0_20px_90px_rgba(15,23,42,0.12)]">
              <CardContent className="p-5 md:p-7 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-sky-500/10 text-sky-600 border border-sky-500/20 font-black">
                    ✨ AI Jigsaw
                  </Badge>
                  <Badge variant="secondary" className="rounded-full font-black">
                    {content.correctedTopic}
                  </Badge>
                  <Badge className="rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 font-black">
                    {rows * columns} Pieces
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
                    {title}
                  </h1>
                  <p className="max-w-2xl text-muted-foreground text-base md:text-lg leading-relaxed">
                    {subtitle}
                  </p>
                  <p className="inline-flex max-w-2xl items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-3 py-1.5 text-xs font-black text-orange-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    Featured scene: {selectedScene.title} - {selectedScene.caption}
                  </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <PuzzlePreview image={selectedImage} rows={rows} columns={columns} />

                  <div className="space-y-4">
                    <Card className="rounded-[28px] border-2 border-border bg-background/80">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-orange-600">
                          <Sparkles className="h-4 w-4" /> Puzzle Blueprint
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: "Difficulty", value: content.difficulty },
                            { label: "Grid", value: `${rows} x ${columns}` },
                            { label: "Pieces", value: `${rows * columns}` },
                            { label: "Style", value: isClassic ? "Classic" : "Square" },
                            { label: "Snap", value: content.snapSensitivity },
                            { label: "Piece Size", value: content.recommendedPieceSize },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="rounded-2xl border border-border bg-card p-3"
                            >
                              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                                {item.label}
                              </p>
                              <p className="mt-1 text-sm font-black text-foreground capitalize">
                                {item.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[24px] border border-border bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-orange-600 font-black text-sm mb-2">
                            <Shuffle className="h-4 w-4" /> Shuffling
                          </div>
                          <div>
                            <Button
                              onClick={() => {
                                // toggle shuffle state to reshuffle pieces
                                setShufflePieces((p) => !p);
                              }}
                              className="h-9 rounded-full bg-orange-600 text-white font-black"
                            >
                              Shuffle
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground font-semibold mt-2">
                          {shufflePieces
                            ? "Pieces are shuffled for a real challenge."
                            : "Pieces are in place for a calm build."}
                        </p>
                      </div>

                      <div className="rounded-[24px] border border-border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-2 text-sky-600 font-black text-sm mb-2">
                          <Timer className="h-4 w-4" /> Challenge Tools
                        </div>
                        <p className="text-sm text-muted-foreground font-semibold">
                          {content.hintsAllowed
                            ? "Hints are available when kids need a little nudge."
                            : "Hints are turned off for a tougher puzzle."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="rounded-[32px] border-4 border-sky-500/20 bg-card shadow-[0_20px_70px_rgba(15,23,42,0.1)]">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                        Studio Notes
                      </p>
                      <h2 className="text-2xl font-black text-foreground">
                        How this puzzle behaves
                      </h2>
                    </div>
                    <div className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-600 border border-orange-500/20">
                      {content.timerRecommended ? "Timer On" : "Timer Off"}
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                    {content.imageInstructions}
                  </p>

                  <div className="rounded-[24px] border border-orange-500/20 bg-orange-500/5 p-4">
                    <div className="flex items-center gap-2 text-orange-700 font-black text-sm mb-2">
                      <Wand2 className="h-4 w-4" /> Gameplay Tips
                    </div>
                    <p className="text-sm leading-relaxed text-orange-900/90 font-semibold">
                      {content.gameplayTips}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-muted/30 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        Preview
                      </p>
                      <p className="mt-1 text-sm font-black text-foreground">
                        {content.previewEnabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/30 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        Piece Style
                      </p>
                      <p className="mt-1 text-sm font-black text-foreground capitalize">
                        {content.puzzleStyle.replace("-", " ")}
                      </p>
                    </div>
                  </div>

                  {onAction && (
                    <div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[3, 4, 5, 6, 8].map((n) => (
                          <Button
                            key={n}
                            onClick={() => {
                              setRows(n);
                              setColumns(n);
                            }}
                            className={`h-10 rounded-xl ${rows === n && columns === n ? "bg-orange-600 text-white" : ""}`}
                          >
                            {n} x {n}
                          </Button>
                        ))}
                      </div>

                      <Button
                        onClick={() => onAction(currentContent)}
                        className="h-12 w-full rounded-2xl bg-orange-600 text-white font-black shadow-lg hover:bg-orange-700"
                      >
                        {actionLabel}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[32px] border-4 border-border bg-card shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-muted-foreground">
                    <Layers3 className="h-4 w-4 text-orange-600" /> Studio Scenes
                  </div>
                  <div className="grid gap-3">
                    {studioScenes.map((scene) => {
                      const isActive = scene.src === selectedImage;
                      return (
                        <div
                          key={scene.src}
                          onClick={() => setSelectedImage(scene.src)}
                          className={`cursor-pointer flex items-center gap-3 rounded-[22px] border p-2.5 transition-all ${
                            isActive
                              ? "border-orange-500/40 bg-orange-500/5 shadow-sm"
                              : "border-border bg-background/60 hover:border-orange-500/20"
                          }`}
                        >
                          <div className="relative h-16 w-16 overflow-hidden rounded-2xl shrink-0">
                            <Image
                              src={scene.src}
                              alt={scene.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-foreground">
                              {scene.title}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                              {scene.caption}
                            </p>
                          </div>
                          {isActive && (
                            <Badge className="rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 font-black">
                              Active
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Smart slicing",
                text: `The image is prepared as a ${rows}x${columns} build with ${rows * columns} pieces.`,
                icon: ScanSearch,
              },
              {
                title: "Kid-friendly play",
                text: "The layout stays bold, readable, and easy to understand on desktop and tablet.",
                icon: Palette,
              },
              {
                title: "Guided challenge",
                text: content.timerRecommended
                  ? "A timer can be used to make the puzzle feel like a playful race."
                  : "Kids can enjoy a relaxed build without any pressure.",
                icon: Sparkles,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  className="rounded-[28px] border-2 border-border bg-card shadow-sm"
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-black text-foreground">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                      {item.text}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        </div>
      </main>
    </div>
  );
}
