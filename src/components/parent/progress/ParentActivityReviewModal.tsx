"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import type { ActivityReviewRow } from "@/types/activity-review.types";
import { ScrollArea } from "@/components/ui/scroll-area";

import QuizReviewDetails from "./components/QuizReviewDetails";
import FlashcardReviewDetails from "./components/FlashcardReviewDetails";
import WordScrambleReviewDetails from "./components/WordScrambleReviewDetails";
import MathChallengeReviewDetails from "./components/MathChallengeReviewDetails";
import MemoryMatchReviewDetails from "./components/MemoryMatchReviewDetails";
import MatchFollowingReviewDetails from "./components/MatchFollowingReviewDetails";
import JigsawPuzzleReviewDetails from "./components/JigsawPuzzleReviewDetails";

interface ParentActivityReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: ActivityReviewRow | null;
  activityTitle: string;
}

export default function ParentActivityReviewModal({
  isOpen,
  onClose,
  review,
  activityTitle,
}: ParentActivityReviewModalProps) {
  if (!review) return null;

  const data = review.review_data;

  // Format Duration helper
  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const renderReviewDetails = () => {
    if (!data) return <p className="text-sm text-slate-500">No details available.</p>;

    switch (data.type) {
      case "quizzes":
      case "logic-puzzles":
      case "science-lab":
        return <QuizReviewDetails data={data} />;

      case "flashcards":
        return <FlashcardReviewDetails data={data} />;

      case "word-scrambles":
        return <WordScrambleReviewDetails data={data} />;

      case "math-challenges":
        return <MathChallengeReviewDetails data={data} />;

      case "memory-match":
        return <MemoryMatchReviewDetails data={data} formatDuration={formatDuration} />;

      case "match-following":
        return <MatchFollowingReviewDetails data={data} />;

      case "jigsaw-puzzle":
        return <JigsawPuzzleReviewDetails data={data} formatDuration={formatDuration} />;

      default:
        return (
          <p className="text-sm text-slate-500">Supported details for this game are not parsed.</p>
        );
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-md rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh]"
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-sky-500" />
            </div>
            <DialogTitle className="sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
              {activityTitle} Review
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400 font-medium">
            Detailed performance breakdown for {review.xp_earned} XP completion on{" "}
            {new Date(review.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-3 max-h-[60vh]">{renderReviewDetails()}</ScrollArea>

        <DialogFooter className="mt-2 shrink-0">
          <Button
            onClick={onClose}
            className="w-full py-5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs dark:bg-sky-500 dark:hover:bg-sky-600 transition-colors shadow-sm cursor-pointer"
          >
            Close Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
