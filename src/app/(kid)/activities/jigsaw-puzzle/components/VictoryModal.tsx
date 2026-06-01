"use client";

import React, { useEffect, useRef } from "react";
import { Trophy, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { claimJigsawXp } from "@/actions/activities/jigsawpuzzle.actions";
import { triggerConfettiSideCannons } from "@/components/ui/confetti-side-cannons";
import { APP_ROUTES } from "@/constant/AppRoutes";

interface VictoryModalProps {
  isOpen: boolean;
  onReplay: () => void;
  xpEarned: number;
  activityId?: string;
  gridSize: number;
  isClaimed: boolean;
  onClaimSuccess: () => void;
}

function pseudoRandom(seed: number) {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function ConfettiAnimation() {
  const colors = ["#F43F5E", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6"];

  const particles = Array.from({ length: 60 }).map((_, i) => {
    const left = pseudoRandom(i + 1) * 100;
    const size = pseudoRandom(i + 11) * 8 + 6;
    const colorIndex = Math.floor(pseudoRandom(i + 21) * colors.length);
    const delay = pseudoRandom(i + 31) * 1.5;
    const duration = pseudoRandom(i + 41) * 2.5 + 2.5;

    return {
      id: i,
      left: `${left}%`,
      size: `${size}px`,
      color: colors[colorIndex],
      delay,
      duration,
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50 rounded-3xl">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: "-10%", x: p.left, rotate: "0deg", opacity: 1 }}
          animate={{
            y: "110%",
            rotate: "360deg",
            opacity: [1, 1, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay,
          }}
          className="absolute rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

export default function VictoryModal({
  isOpen,
  onReplay,
  xpEarned,
  activityId,
  gridSize,
  isClaimed,
  onClaimSuccess,
}: VictoryModalProps) {
  const router = useRouter();
  const hasClaimed = useRef(false);

  // Reset claim tracking flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasClaimed.current = false;
    }
  }, [isOpen]);

  // Background Auto-Claim XP Trigger
  useEffect(() => {
    if (isOpen && !isClaimed && !hasClaimed.current) {
      hasClaimed.current = true;

      const triggerAutoClaim = async () => {
        try {
          const result = await claimJigsawXp(activityId, gridSize);
          if (result.success) {
            triggerConfettiSideCannons();
            toast.success("Awesome Job! 🎉", {
              description: `+${xpEarned} Experience Points automatically awarded to your kid profile!`,
            });
            onClaimSuccess();
          } else {
            console.error("Jigsaw auto-claim returned failure status:", result.error);
          }
        } catch (err) {
          console.error("Jigsaw auto-claim unhandled exception:", err);
        }
      };

      triggerAutoClaim();
    }
  }, [isOpen, isClaimed, activityId, gridSize, xpEarned, onClaimSuccess]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onReplay();
      }}
    >
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-2 border-amber-200 bg-white dark:bg-slate-900 shadow-2xl z-50">
        <DialogHeader className="sr-only">
          <DialogTitle>Puzzle Solved!</DialogTitle>
          <DialogDescription>
            Celebration and reward claim controls for finishing the jigsaw puzzle.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence>
          {isOpen && (
            <div className="relative flex flex-col items-center text-center p-8">
              {/* Animated Confetti Particles */}
              <ConfettiAnimation />

              {/* Solved Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 10, stiffness: 100 }}
                className="flex items-center justify-center size-20 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-500 shadow-md border-4 border-amber-200/50 mb-6"
              >
                <Trophy className="size-10 text-amber-500" />
              </motion.div>

              {/* Solved text */}
              <h2 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight mb-2 animate-pulse">
                You Did It! 🎉
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-semibold mb-6 max-w-xs">
                You matched all the pieces perfectly and solved the puzzle!
              </p>

              {/* XP Box */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full bg-linear-to-br from-amber-50 to-orange-50 dark:from-slate-950 dark:to-slate-900 border border-amber-100 dark:border-slate-800 p-5 rounded-3xl mb-8 flex flex-col items-center gap-1.5"
              >
                <div className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Sparkles className="size-3.5" />
                  Rewards Earned
                </div>
                <div className="text-4xl font-black text-slate-900 dark:text-slate-50 leading-none">
                  +{xpEarned} XP
                </div>
                <div className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {gridSize}x{gridSize} Grid Completion
                </div>
              </motion.div>

              {/* Actions Grid */}
              <div className="flex flex-col gap-3 w-full">
                <Button
                  onClick={() => {
                    router.push(APP_ROUTES.Activities);
                  }}
                  className="w-full py-6 rounded-2xl font-black text-lg bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-102 transition-all duration-300 shadow-md cursor-pointer"
                >
                  Continue
                </Button>

                <Button
                  onClick={onReplay}
                  variant="outline"
                  className="w-full py-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 font-bold transition-all duration-300 cursor-pointer"
                >
                  <RefreshCw className="mr-2 size-5" />
                  Play Again
                </Button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
