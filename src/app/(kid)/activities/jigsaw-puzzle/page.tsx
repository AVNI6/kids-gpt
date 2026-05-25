"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Gamepad2, Brain, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Difficulty, PuzzlePiece } from "@/types/puzzle";
import { generateAndShufflePieces } from "@/lib/puzzle/shuffle";
import { isSolved as checkIsSolved } from "@/lib/puzzle/validators";
import { preloadImage } from "@/lib/puzzle/image-utils";
import PuzzleBoard from "./components/PuzzleBoard";
import DifficultyControls from "./components/DifficultyControls";
import HintOverlay from "./components/HintOverlay";
import VictoryModal from "./components/VictoryModal";
import ThemeSelector from "./components/ThemeSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_ROUTES } from "@/constant/AppRoutes";
import { JIGSAW_THEMES } from "@/constant/JigsawThemes";

const DEFAULT_IMAGE = JIGSAW_THEMES[0].url;

export default function JigsawPuzzlePage() {
  const [mounted, setMounted] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>(3);
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_IMAGE);
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

  // Game Event States
  const [isSolved, setIsSolved] = useState(false);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Keep track of user-uploaded Object URLs to revoke them and prevent memory leaks
  const [objectUrls, setObjectUrls] = useState<string[]>([]);

  // Calculate XP earned dynamically based on grid difficulty settings (scaled from base 120 XP)
  const xpEarned = useMemo(() => {
    const base = 120;
    if (difficulty === 2) return Math.round(base * 0.6); // 72 XP
    if (difficulty === 4) return Math.round(base * 1.2); // 144 XP
    if (difficulty === 5) return Math.round(base * 1.5); // 180 XP
    return base; // 3x3 = 120 XP
  }, [difficulty]);

  // Clean up object URLs on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      objectUrls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (err) {
          console.warn("Failed to revoke object URL on unmount:", err);
        }
      });
    };
  }, [objectUrls]);

  // Core Puzzle Initialization (Client-side only shuffling for Hydration Safety)
  const initPuzzle = useCallback((size: Difficulty) => {
    const shuffled = generateAndShufflePieces(size);
    setPieces(shuffled);
    setSelectedPieceId(null);
    setIsSolved(false);
    setIsClaimed(false);
  }, []);

  // Preloads images when swapping to prevent layout shifts
  const handleImageLoadAndInit = useCallback(
    async (url: string, size: Difficulty) => {
      setIsLoading(true);
      setHasError(false);

      const loadSuccess = await preloadImage(url);
      if (loadSuccess) {
        setImageUrl(url);
        initPuzzle(size);
      } else {
        setHasError(true);
        // Fallback to default image to keep game playable
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

  // 1. Hydration-safe initial loader (Runs strictly ONCE on mount)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      handleImageLoadAndInit(DEFAULT_IMAGE, difficulty);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Difficulty Toggle Handler (Triggers reshuffle directly in the event handler)
  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    initPuzzle(newDifficulty);
  };

  // Replay Reshuffler
  const handleReset = () => {
    initPuzzle(difficulty);
  };

  // Local File Upload Trigger (Lifecycle with revocation)
  const handleImageUploaded = async (file: File) => {
    setIsLoading(true);

    // Revoke previous custom image URLs to free browser memory
    objectUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        console.warn("Error revoking object URL during replacement:", err);
      }
    });
    setObjectUrls([]);

    const newUrl = URL.createObjectURL(file);
    setObjectUrls([newUrl]);

    await handleImageLoadAndInit(newUrl, difficulty);
  };

  // Preset swap executor
  const handlePresetSelect = async (url: string) => {
    if (url === imageUrl) return;
    await handleImageLoadAndInit(url, difficulty);
  };

  // Puzzle Tile swap executor
  const handlePieceSwap = useCallback((pieceId1: string, pieceId2: string) => {
    setPieces((prevPieces) => {
      const piece1Index = prevPieces.findIndex((p) => p.id === pieceId1);
      const piece2Index = prevPieces.findIndex((p) => p.id === pieceId2);

      if (piece1Index === -1 || piece2Index === -1) return prevPieces;

      const updated = [...prevPieces];
      const tempIndex = updated[piece1Index].currentIndex;

      updated[piece1Index] = {
        ...updated[piece1Index],
        currentIndex: updated[piece2Index].currentIndex,
      };

      updated[piece2Index] = {
        ...updated[piece2Index],
        currentIndex: tempIndex,
      };

      // Win state detection
      const solved = checkIsSolved(updated);
      if (solved) {
        setIsSolved(true);
      }

      return updated;
    });

    setSelectedPieceId(null);
  }, []);

  const handlePieceSelect = useCallback((pieceId: string | null) => {
    setSelectedPieceId(pieceId);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-sky-500" />
        <p className="text-sm font-bold text-slate-500 animate-pulse">Starting engine...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#0B0F19] via-[#0E1528] to-[#0A0D17] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 text-slate-100 flex flex-col gap-6 items-center justify-start overflow-x-hidden">
      {/* Top Banner Card */}
      <div className="w-full max-w-7xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md p-5 sm:p-6 rounded-[28px] shadow-2xl flex flex-col items-center gap-3 select-none relative overflow-hidden shrink-0">
        <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between w-full relative z-10">
          <Link
            href={APP_ROUTES.Activities}
            className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-350 hover:text-white transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-md">
            <Gamepad2 className="size-4 animate-pulse text-sky-400" />
            Jigsaw Challenge
          </span>
          <div className="w-10 h-10" /> {/* Symmetry balancer */}
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mt-2 text-center drop-shadow-md">
          Jigsaw Swap Swapper 🧩
        </h1>
        <p className="text-sm font-semibold text-slate-400 max-w-xl text-center">
          Choose a theme and select a difficulty. Swap scrambled tiles on the left grid into their
          correct spots to claim experience points!
        </p>
      </div>

      {/* Primary Side-by-Side Dual Pane Workspace */}
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start px-1">
        {/* LEFT COLUMN: Large interactive board (Span 7) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center w-full">
          <div className="relative w-full aspect-square flex items-center justify-center bg-slate-950/60 border border-slate-800/80 rounded-[32px] shadow-2xl p-4 overflow-hidden backdrop-blur-md">
            {/* Subtle aesthetic backdrop light */}
            <div className="absolute inset-0 bg-radial-gradient from-sky-500/5 to-transparent pointer-events-none" />

            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="size-10 animate-spin text-sky-500" />
                <Skeleton className="h-4 w-40 bg-slate-800" />
              </div>
            ) : hasError ? (
              <div className="flex flex-col items-center gap-3 text-center p-6">
                <Brain className="size-12 text-rose-500 animate-bounce" />
                <h3 className="text-lg font-black text-rose-500">Image failed to load</h3>
                <p className="text-sm text-slate-400 max-w-xs">
                  We had trouble loading that picture, so we loaded the default Cyber Explorer theme
                  instead.
                </p>
              </div>
            ) : (
              <>
                <PuzzleBoard
                  pieces={pieces}
                  gridSize={difficulty}
                  imageUrl={imageUrl}
                  selectedPieceId={selectedPieceId}
                  onPieceSelect={handlePieceSelect}
                  onPieceSwap={handlePieceSwap}
                  isSolved={isSolved}
                  isLoading={isLoading}
                />

                <HintOverlay
                  imageUrl={imageUrl}
                  isOpen={isHintOpen}
                  onClose={() => setIsHintOpen(false)}
                />
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Preset selection & controls stacked (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          {/* Scrollable Theme Selector */}
          <ThemeSelector
            selectedUrl={imageUrl}
            onThemeSelect={handlePresetSelect}
            isLoading={isLoading}
          />

          {/* Gameplay & Difficulty controller */}
          <DifficultyControls
            difficulty={difficulty}
            onDifficultyChange={handleDifficultyChange}
            onReset={handleReset}
            onImageSelected={handleImageUploaded}
            onShowHint={() => setIsHintOpen(true)}
            isHintDisabled={isSolved || isHintOpen}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Celebration and Claim XP dialog */}
      <VictoryModal
        isOpen={isSolved}
        onReplay={handleReset}
        xpEarned={xpEarned}
        activityId={JIGSAW_THEMES.find((p) => p.url === imageUrl)?.id || "custom-upload"}
        gridSize={difficulty}
        isClaimed={isClaimed}
        onClaimSuccess={() => setIsClaimed(true)}
      />
    </main>
  );
}
