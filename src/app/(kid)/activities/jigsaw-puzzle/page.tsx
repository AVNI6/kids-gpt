"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Gamepad2,
  Brain,
  Loader2,
  ArrowLeft,
  Play,
  LayoutGrid,
  RotateCcw,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { Difficulty, PuzzlePiece } from "@/types/puzzle";
import { generateAndShufflePieces } from "@/lib/puzzle/shuffle";
import { preloadImage } from "@/lib/puzzle/image-utils";
import PuzzleBoard from "./components/PuzzleBoard";
import PuzzleTile from "./components/PuzzleTile";
import DifficultyControls from "./components/DifficultyControls";
import HintOverlay from "./components/HintOverlay";
import VictoryModal from "@/components/shared/VictoryModal";
import ThemeSelector from "./components/ThemeSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_ROUTES } from "@/lib/constants/common";
import { JIGSAW_THEMES } from "@/lib/constants/JigsawThemes";

const DEFAULT_IMAGE = JIGSAW_THEMES[0].url;

export default function JigsawPuzzlePage() {
  const [mounted, setMounted] = useState(false);
  const [gameState, setGameState] = useState<"setup" | "playing">("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>(3);
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_IMAGE);
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(0);

  // Game Event States
  const [isSolved, setIsSolved] = useState(false);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Keep track of user-uploaded Object URLs to prevent memory leaks
  const [objectUrls, setObjectUrls] = useState<string[]>([]);

  // Calculate XP earned dynamically based on grid difficulty (scaled from base 120 XP)
  const xpEarned = useMemo(() => {
    const base = 120;
    const multipliers: Record<number, number> = {
      3: 1.0,
      4: 1.2,
      5: 1.5,
      6: 1.8,
      7: 2.1,
      8: 2.4,
      9: 2.7,
      10: 3.0,
      11: 3.3,
      12: 3.6,
    };
    const mult = multipliers[difficulty] || 1.0;
    return Math.round(base * mult);
  }, [difficulty]);

  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    objectUrlsRef.current = objectUrls;
  }, [objectUrls]);

  // Clean up object URLs to prevent memory leaks on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (err) {
          console.warn("Failed to revoke object URL on unmount:", err);
        }
      });
    };
  }, []);

  // Core Puzzle Initialization
  const initPuzzle = useCallback((size: Difficulty) => {
    const shuffled = generateAndShufflePieces(size);
    setPieces(shuffled);
    setIsSolved(false);
  }, []);

  // Preloads images when swapping
  const handleImageLoadAndInit = useCallback(
    async (url: string, size: Difficulty) => {
      setIsLoading(true);

      const loadSuccess = await preloadImage(url);
      if (loadSuccess) {
        setImageUrl(url);
        initPuzzle(size);
      } else {
        const fallbackSuccess = await preloadImage(DEFAULT_IMAGE);
        if (fallbackSuccess) {
          setImageUrl(DEFAULT_IMAGE);
          initPuzzle(size);
        }
      }
      setIsLoading(false);
    },
    [initPuzzle]
  );

  // Initial loader
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      handleImageLoadAndInit(DEFAULT_IMAGE, difficulty);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    initPuzzle(newDifficulty);
  };

  const handleReset = () => {
    initPuzzle(difficulty);
  };

  const handleImageUploaded = async (file: File) => {
    setIsLoading(true);

    // Revoke previous URLs directly to prevent memory leaks
    objectUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        console.warn("Failed to revoke object URL on image change:", err);
      }
    });

    const newUrl = URL.createObjectURL(file);
    setObjectUrls([newUrl]);

    await handleImageLoadAndInit(newUrl, difficulty);
  };

  const handlePresetSelect = async (url: string) => {
    if (url === imageUrl) return;
    await handleImageLoadAndInit(url, difficulty);
  };

  // Drag-and-drop snapping locks
  const handlePieceSnap = useCallback((pieceId: string) => {
    setPieces((prevPieces) => {
      const updated = prevPieces.map((p) => (p.id === pieceId ? { ...p, isPlaced: true } : p));

      // Play snappy feedback sound (tactile UI standard)
      try {
        const audio = new Audio(
          "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=="
        );
        audio.volume = 0.35;
        audio.play().catch(() => {});
      } catch {}

      // Win state detection: all pieces placed
      const solved = updated.every((p) => p.isPlaced);
      if (solved) {
        setIsSolved(true);
      }

      return updated;
    });
  }, []);

  const handleStartPuzzle = () => {
    initPuzzle(difficulty);
    setGameState("playing");
  };

  const handleBackToSetup = () => {
    setGameState("setup");
    setIsSolved(false);
  };

  const unplacedPieces = useMemo(() => {
    return pieces.filter((p) => !p.isPlaced);
  }, [pieces]);

  const placedCount = useMemo(() => {
    return pieces.filter((p) => p.isPlaced).length;
  }, [pieces]);

  const progressPercent = useMemo(() => {
    if (pieces.length === 0) return 0;
    return Math.round((placedCount / pieces.length) * 100);
  }, [pieces, placedCount]);

  const activeThemeName = useMemo(() => {
    return JIGSAW_THEMES.find((p) => p.url === imageUrl)?.name || "Custom Upload";
  }, [imageUrl]);

  if (!mounted) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-sky-500" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Starting engine...</p>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen w-full bg-linear-to-b from-sky-50/50 via-background to-sky-100/30 dark:from-[#0B0F19] dark:via-[#0E1528] dark:to-[#0A0D17] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 text-foreground flex flex-col gap-6 items-center justify-start overflow-visible transition-colors duration-300"
      style={{ overflow: "visible" }}
    >
      {/* ─── SCREEN 1: Setup Workspace ─────────────────────────────────────── */}
      {gameState === "setup" && (
        <div className="w-full max-w-7xl flex flex-col gap-6 items-center">
          {/* Header Card */}
          <div className="w-full bg-card/75 dark:bg-slate-900/60 border border-border/80 dark:border-slate-800/80 backdrop-blur-md p-6 rounded-[28px] shadow-2xl flex flex-col items-center gap-3 select-none relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between w-full relative z-10">
              <Link
                href={APP_ROUTES.Activities}
                className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-muted/80 hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-md">
                <Gamepad2 className="size-4 animate-pulse" />
                Drag & Drop Jigsaw
              </span>
              <div className="w-10 h-10" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mt-2 text-center drop-shadow-md">
              Jigsaw Puzzle Engine 🧩
            </h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-xl text-center">
              Choose your theme and puzzle difficulty. Click &quot;Start Puzzle&quot; to break the
              picture and drag the classic jigsaw pieces back into place!
            </p>
          </div>

          {/* Setup Configuration Workspace */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Pane: Preset Themes */}
            <div className="lg:col-span-7 w-full">
              <ThemeSelector
                selectedUrl={imageUrl}
                onThemeSelect={handlePresetSelect}
                isLoading={isLoading}
              />
            </div>

            {/* Right Pane: Settings & Launch Trigger */}
            <div className="lg:col-span-5 flex flex-col gap-6 w-full">
              <DifficultyControls
                difficulty={difficulty}
                onDifficultyChange={handleDifficultyChange}
                onImageSelected={handleImageUploaded}
                isLoading={isLoading}
              />

              {/* Start Puzzle Primary Button */}
              <button
                onClick={handleStartPuzzle}
                disabled={isLoading}
                className="w-full py-4.5 rounded-[22px] bg-linear-to-r from-sky-500 via-indigo-500 to-emerald-500 hover:brightness-110 active:scale-[0.98] text-white font-black text-lg tracking-wide shadow-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <>
                    <Play className="size-6 fill-white" />
                    Start Puzzle
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SCREEN 2: Play Drag-and-Drop Workspace ─────────────────────────── */}
      {gameState === "playing" && (
        <div
          className="w-full max-w-7xl flex flex-col gap-6 overflow-visible"
          style={{ overflow: "visible" }}
        >
          {/* Top Panel Actions & HUD */}
          <div className="w-full bg-card/75 dark:bg-slate-900/60 border border-border/80 dark:border-slate-800/80 backdrop-blur-md p-5 rounded-[28px] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 select-none relative overflow-hidden">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToSetup}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-muted/80 hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-all font-bold text-sm cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Setup
              </button>

              <div className="h-8 w-px bg-border hidden md:block" />

              <div className="flex flex-col">
                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest leading-none">
                  Theme
                </span>
                <span className="text-sm font-black text-foreground">{activeThemeName}</span>
              </div>
            </div>

            {/* Live Progress Bar HUD */}
            <div className="flex items-center gap-4 w-full md:w-auto max-w-sm flex-1 md:justify-end">
              <div className="flex flex-col flex-1 max-w-50">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-black text-sky-500 dark:text-sky-400 uppercase tracking-widest leading-none">
                    Placed
                  </span>
                  <span className="text-xs font-black text-foreground">
                    {placedCount} / {pieces.length} ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden border border-border/50">
                  <div
                    className="h-full bg-linear-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Utility Tools */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsHintOpen(true)}
                  className="p-3 rounded-2xl bg-muted/80 hover:bg-muted border border-border text-sky-600 dark:text-sky-400 transition-all shadow-md cursor-pointer"
                  title="Show image guide hint"
                >
                  <HelpCircle className="size-5" />
                </button>
                <button
                  onClick={handleReset}
                  className="p-3 rounded-2xl bg-muted/80 hover:bg-muted border border-border text-emerald-600 dark:text-emerald-400 transition-all shadow-md cursor-pointer"
                  title="Reshuffle pieces"
                >
                  <RotateCcw className="size-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Play Arena */}
          <div
            className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start overflow-visible"
            style={{ overflow: "visible" }}
          >
            {/* LOBBY / LEFT COLUMN: The Jigsaw Board (Span 7) */}
            <div
              className="lg:col-span-7 flex flex-col items-center justify-center w-full overflow-visible"
              style={{ overflow: "visible" }}
            >
              <div
                className="relative w-full aspect-square flex items-center justify-center bg-muted/30 border border-border rounded-[36px] p-6 overflow-visible"
                style={{ overflow: "visible" }}
              >
                {/* Subtle back glowing accent */}
                <div className="absolute inset-0 bg-radial-gradient from-sky-500/5 to-transparent pointer-events-none rounded-[36px]" />

                <PuzzleBoard
                  pieces={pieces}
                  gridSize={difficulty}
                  imageUrl={imageUrl}
                  isSolved={isSolved}
                  isLoading={isLoading}
                  boardRef={boardRef}
                  onSnap={handlePieceSnap}
                  onResize={setBoardWidth}
                />

                <HintOverlay
                  imageUrl={imageUrl}
                  isOpen={isHintOpen}
                  onClose={() => setIsHintOpen(false)}
                />
              </div>
            </div>

            {/* PIECE TRAY / RIGHT COLUMN: Spawning Ground for Pieces (Span 5) */}
            <div
              className="lg:col-span-5 flex flex-col gap-4 w-full overflow-visible"
              style={{ overflow: "visible" }}
            >
              <div
                className="relative w-full h-80 lg:h-150 border border-border/80 dark:border-slate-800/80 bg-card/75 dark:bg-slate-900/40 rounded-[32px] p-6 shadow-2xl backdrop-blur-md overflow-visible flex flex-col select-none"
                style={{ overflow: "visible" }}
              >
                {/* Decorative header */}
                <div className="flex items-center justify-between mb-4 shrink-0 relative z-30">
                  <span className="text-xs font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                    <LayoutGrid className="size-4 text-indigo-500" />
                    Piece Tray
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    Drag elements onto matching board positions
                  </span>
                </div>

                {/* Grid backdrop */}
                <div
                  className="absolute inset-0 rounded-[32px] opacity-[0.08] dark:opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, var(--border) 1.2px, transparent 1.2px)",
                    backgroundSize: "20px 20px",
                  }}
                />

                {/* Spawning Ground overlay context - overflow:visible so dragging pieces can leave */}
                <div
                  className="relative flex-1 w-full h-full overflow-visible rounded-2xl"
                  style={{ overflow: "visible" }}
                >
                  {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="size-8 animate-spin text-indigo-500" />
                      <Skeleton className="h-4 w-28 bg-muted" />
                    </div>
                  ) : unplacedPieces.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground font-bold text-sm">
                      <Brain className="size-10 text-emerald-500 animate-bounce" />
                      <span>All pieces placed! 🎉</span>
                    </div>
                  ) : (
                    unplacedPieces.map((piece) => (
                      <PuzzleTile
                        key={piece.id}
                        piece={piece}
                        gridSize={difficulty}
                        tileSize={boardWidth > 0 ? boardWidth / difficulty : 120}
                        imageUrl={imageUrl}
                        boardRef={boardRef}
                        onSnap={handlePieceSnap}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Celebratory Victory and Reward Modal */}
      <VictoryModal
        isOpen={isSolved}
        onReplay={handleReset}
        onContinue={handleBackToSetup}
        xpEarned={xpEarned}
        activitySlug="jigsaw-puzzle"
        activityTitle="Jigsaw Puzzle"
        score="100%"
        scoreDescription="You matched all the pieces perfectly and solved the puzzle!"
        rewardsDescription={`${difficulty}x${difficulty} Grid Completion`}
        jigsawGridSize={difficulty}
        jigsawThemeName={JIGSAW_THEMES.find((p) => p.url === imageUrl)?.id || "custom-upload"}
        onClaimSuccess={() => {}}
      />
    </main>
  );
}
