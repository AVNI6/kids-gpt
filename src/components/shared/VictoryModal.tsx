"use client";

import React, { useEffect, useRef, useState } from "react";
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
import { processActivityCompletion } from "@/lib/services/kid/rewards.actions";
import { submitAssignmentActivityCompletion } from "@/lib/services/kid/classroom.actions";
import { saveActivityReview } from "@/lib/services/kid/activity-review.actions";
import { triggerConfettiSideCannons } from "@/components/ui/confetti-side-cannons";
import { APP_ROUTES } from "@/lib/constants/app_routes";
import type { ActivityReviewData } from "@/types/activity-review.types";

interface VictoryModalProps {
  isOpen: boolean;
  onReplay: () => void;
  onContinue?: () => void;
  xpEarned: number;
  activitySlug: string;
  activityTitle: string;
  score?: string; // e.g., "5/5", "80%"
  scoreDescription?: string; // Description below title
  rewardsDescription?: string; // Small tag below XP number
  assignmentId?: string; // Optional classroom assignment ID
  // Specific activity details
  jigsawGridSize?: number;
  jigsawThemeName?: string;
  memoryMatchWorldId?: number;
  memoryMatchStepNumber?: number;
  onClaimSuccess?: () => void;
  children?: React.ReactNode;
  reviewData?: ActivityReviewData;
  gameStartedAt?: number;
}

const claimedActivitiesSet = new Set<string>();

export default function VictoryModal({
  isOpen,
  onReplay,
  onContinue,
  xpEarned,
  activitySlug,
  activityTitle,
  score,
  scoreDescription,
  rewardsDescription,
  assignmentId,
  jigsawGridSize,
  jigsawThemeName,
  memoryMatchWorldId,
  memoryMatchStepNumber,
  onClaimSuccess,
  children,
  reviewData,
  gameStartedAt,
}: VictoryModalProps) {
  const router = useRouter();
  const hasClaimed = useRef(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimCompleted, setClaimCompleted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cleanupConfettiRef = useRef<(() => void) | null>(null);

  // Background Auto-Claim XP Trigger
  useEffect(() => {
    if (isOpen && !claimCompleted && !isClaiming && !hasClaimed.current) {
      const claimKey = assignmentId
        ? `assignment_${assignmentId}`
        : `activity_${activitySlug}_${memoryMatchWorldId ?? ""}_${memoryMatchStepNumber ?? ""}_${jigsawGridSize ?? ""}_${jigsawThemeName ?? ""}_${score ?? ""}`;

      if (claimedActivitiesSet.has(claimKey)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setClaimCompleted(true);
        return;
      }

      hasClaimed.current = true;
      setIsClaiming(true);
      claimedActivitiesSet.add(claimKey);

      const triggerAutoClaim = async () => {
        try {
          const finalScoreStr = score || "100%";
          // Parse score percentage for the review record
          const scoreNum = parseInt(finalScoreStr.replace(/[^0-9]/g, ""), 10) || 100;
          // Compute duration if the caller provided a start timestamp
          const durationSeconds =
            gameStartedAt != null ? Math.round((Date.now() - gameStartedAt) / 1000) : undefined;

          if (assignmentId) {
            // Claim via classroom assignment completion
            const result = await submitAssignmentActivityCompletion(assignmentId, finalScoreStr);
            if (result.success) {
              // Persist review snapshot — wait for completion
              if (reviewData) {
                const reviewResult = await saveActivityReview({
                  activityType: activitySlug,
                  rewardId: result.rewardId ?? null,
                  submissionId: result.submissionId ?? null,
                  scorePercentage: scoreNum,
                  xpEarned,
                  durationSeconds,
                  reviewData,
                });
                if (!reviewResult.success) {
                  console.warn("saveActivityReview failed (assignment):", reviewResult.error);
                }
              }
              setClaimCompleted(true);
              toast.success("Assignment Submitted! 🎉", {
                description: `Your score of ${finalScoreStr} was submitted and graded.`,
              });
              if (onClaimSuccess) onClaimSuccess();
            } else {
              console.error("Assignment auto-claim failed:", result.error);
              toast.error("Could not submit assignment progress.", {
                description: result.error,
              });
            }
          } else {
            // Claim via unified processActivityCompletion server action
            const result = await processActivityCompletion({
              activitySlug,
              activityTitle,
              score: finalScoreStr,
              jigsawGridSize,
              jigsawThemeName,
              memoryMatchWorldId,
              memoryMatchStepNumber,
            });

            if (result.success) {
              // Persist review snapshot — wait for completion
              if (reviewData) {
                const reviewResult = await saveActivityReview({
                  activityType: activitySlug,
                  rewardId: result.rewardId ?? null,
                  scorePercentage: scoreNum,
                  xpEarned,
                  durationSeconds,
                  reviewData,
                });
                if (!reviewResult.success) {
                  console.warn("saveActivityReview failed:", reviewResult.error);
                }
              }
              setClaimCompleted(true);
              triggerConfettiSideCannons();
              if (onClaimSuccess) onClaimSuccess();
            } else {
              console.error("Activity completion auto-claim failed:", result.error);
              // Do not spam toast error for duplicate checks, but log in console
            }
          }
        } catch (err) {
          console.error("Activity auto-claim unhandled exception:", err);
        } finally {
          setIsClaiming(false);
        }
      };

      triggerAutoClaim();
    }
  }, [
    isOpen,
    claimCompleted,
    isClaiming,
    assignmentId,
    activitySlug,
    activityTitle,
    score,
    jigsawGridSize,
    jigsawThemeName,
    memoryMatchWorldId,
    memoryMatchStepNumber,
    xpEarned,
    onClaimSuccess,
    gameStartedAt,
    reviewData,
  ]);

  const handleContinueClick = () => {
    if (onContinue) {
      onContinue();
    } else {
      router.push(APP_ROUTES.Activities);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleContinueClick();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-md p-0 overflow-hidden rounded-3xl border-2 border-amber-200 bg-white dark:bg-slate-900 shadow-2xl z-50"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{activityTitle} Complete!</DialogTitle>
          <DialogDescription>
            Celebration and reward claim controls for finishing the activity.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence>
          {isOpen && (
            <div className="relative flex flex-col items-center text-center p-8 max-h-[90vh] overflow-y-auto pr-8 pl-8 scrollbar-thin">
              {/* Trophy Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 10, stiffness: 100 }}
                className="flex items-center justify-center size-20 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-500 shadow-md border-4 border-amber-200/50 mb-6 shrink-0"
              >
                <Trophy className="size-10 text-amber-500" />
              </motion.div>

              {/* Title & Description */}
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight mb-2 animate-pulse shrink-0">
                You Did It! 🎉
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-semibold mb-6 max-w-xs shrink-0 text-sm">
                {scoreDescription || `You completed the ${activityTitle} perfectly!`}
              </p>

              {/* XP Box */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full bg-linear-to-br from-amber-50 to-orange-50 dark:from-slate-950 dark:to-slate-900 border border-amber-100 dark:border-slate-800 p-5 rounded-3xl mb-6 flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Sparkles className="size-3.5" />
                  Rewards Earned
                </div>
                <div className="text-4xl font-black text-slate-900 dark:text-slate-50 leading-none">
                  +{xpEarned} XP
                </div>
                <div className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {rewardsDescription || "Activity Completed"}
                </div>
              </motion.div>

              {/* Custom Children Content (e.g. results scorecard connections review) */}
              {children && <div className="w-full mb-6 relative z-30 shrink-0">{children}</div>}

              {/* Actions Grid */}
              <div className="flex flex-col gap-3 w-full shrink-0 relative z-30">
                <Button
                  onClick={handleContinueClick}
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
