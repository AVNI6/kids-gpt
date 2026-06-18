"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { processActivityCompletion } from "@/lib/services/kid/rewards.actions";
import { triggerConfettiSideCannons } from "@/components/ui/confetti-side-cannons";
import { GameType, WhoAmIData, BrainTeaserData, FactFusionData, RiddleData } from "./types";
import {
  WHO_AM_I_PRESETS,
  BRAIN_TEASER_PRESETS,
  FACT_FUSION_PRESETS,
  RIDDLE_PRESETS,
} from "@/components/quick-challenge/quick-data";
import WhoAmI from "./WhoAmI";
import BrainTeaser from "./BrainTeaser";
import FactFusion from "./FactFusion";
import Riddle from "./Riddle";
import { Button } from "@/components/ui/button";

interface QuickChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickChallengeModal({ isOpen, onClose }: QuickChallengeModalProps) {
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<
    WhoAmIData | BrainTeaserData | FactFusionData | RiddleData | null
  >(null);
  const [selectedString, setSelectedString] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const hasClaimedRef = useRef(false);

  const loadNextChallenge = () => {
 
    const types: GameType[] = ["WhoAmI", "BrainTeaser", "FactFusion", "Riddle"];
    const rolledType = types[Math.floor(Math.random() * types.length)];
    setGameType(rolledType);

    let selectedData = null;
    if (rolledType === "WhoAmI") {
      selectedData = WHO_AM_I_PRESETS[Math.floor(Math.random() * WHO_AM_I_PRESETS.length)];
    } else if (rolledType === "BrainTeaser") {
      selectedData = BRAIN_TEASER_PRESETS[Math.floor(Math.random() * BRAIN_TEASER_PRESETS.length)];
    } else if (rolledType === "FactFusion") {
      selectedData = FACT_FUSION_PRESETS[Math.floor(Math.random() * FACT_FUSION_PRESETS.length)];
    } else if (rolledType === "Riddle") {
      selectedData = RIDDLE_PRESETS[Math.floor(Math.random() * RIDDLE_PRESETS.length)];
    }

    setActiveChallenge(selectedData);
    setSelectedString(null);
    setShowResult(false);
    setIsClaiming(false);
    hasClaimedRef.current = false;
  };

  // Select game on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        loadNextChallenge();
      }, 0);
      return () => clearTimeout(timer);
    } 
  }, [isOpen]);

  const handleSelectString = async (ans: string) => {
    if (showResult || isClaiming || !activeChallenge) return;
    setSelectedString(ans);
    setShowResult(true);

    const correct = ans === activeChallenge.answer;

    if (correct) {
      triggerConfettiSideCannons();
      // Call reward integration in background
      handleClaimReward();
    }
  };

  const handleClaimReward = async () => {
    if (hasClaimedRef.current) return;
    hasClaimedRef.current = true;
    setIsClaiming(true);

    try {
      const result = await processActivityCompletion({
        activitySlug: "quick-challenge",
        activityTitle: "Quick Challenge",
        score: "100%",
      });

      if (result.success) {
        // XP claimed successfully
      } else {
        toast.error("Could not claim XP reward.", {
          description: result.error,
        });
      }
    } catch (err) {
      console.error("Quick challenge claim error:", err);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-[95vw] sm:w-full max-w-md p-0 gap-0 overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl z-50 flex flex-col max-h-[85vh] sm:max-h-[80vh]">
        <DialogHeader className="sr-only">
          <DialogTitle>Quick Challenge</DialogTitle>
          <DialogDescription>A rapid-fire daily brain boost game to earn XP.</DialogDescription>
        </DialogHeader>

        <div className="w-full flex-1 min-h-0 max-h-[65vh] sm:max-h-screen overflow-y-auto">
          <div className="p-4.5 sm:p-6 flex flex-col gap-3.5 sm:gap-4.5 w-full">
            {/* Game Views */}
            {gameType === "WhoAmI" && activeChallenge && (
              <WhoAmI
                data={activeChallenge as WhoAmIData}
                selectedAnswer={selectedString}
                onSelectAnswer={handleSelectString}
                showResult={showResult}
              />
            )}

            {gameType === "BrainTeaser" && activeChallenge && (
              <BrainTeaser
                data={activeChallenge as BrainTeaserData}
                selectedAnswer={selectedString}
                onSelectAnswer={handleSelectString}
                showResult={showResult}
              />
            )}

            {gameType === "FactFusion" && activeChallenge && (
              <FactFusion
                data={activeChallenge as FactFusionData}
                selectedAnswer={selectedString}
                onSelectAnswer={handleSelectString}
                showResult={showResult}
              />
            )}

            {gameType === "Riddle" && activeChallenge && (
              <Riddle
                data={activeChallenge as RiddleData}
                selectedAnswer={selectedString}
                onSelectAnswer={handleSelectString}
                showResult={showResult}
              />
            )}

            {/* Claiming & Continue Actions */}
            {showResult && (
              <div className="flex flex-col gap-3 w-full animate-in fade-in slide-in-from-bottom-2 mt-auto shrink-0 pb-1">
                <Button
                  onClick={loadNextChallenge}
                  disabled={isClaiming}
                  className="w-full h-12 rounded-2xl font-bold transition-all bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
