"use client";

import { useState, useEffect, useRef } from "react";
import { RefreshCcw, CheckCircle2, RotateCcw, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSessionStorageState } from "@/hooks/shared/useSessionStorageState";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ActivityCard, ActivityCardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/lib/constants/app_routes";
import { getActivityXp } from "@/lib/services/kid/activities/activity.actions";
import VictoryModal from "@/components/shared/VictoryModal";
import type { FlashcardReviewData } from "@/types/activity-review.types";

interface Flashcard {
  question: string;
  answer: string;
  fact: string;
}

interface FlashcardsPageProps {
  deckTitle?: string;
  flashcards?: Flashcard[];
  assignmentId?: string;
}

export default function FlashcardsPage({
  deckTitle = "Solar System Wonders 🌍",
  flashcards = [
    {
      question: 'Which planet is known as the "Red Planet"?',
      answer: "Mars",
      fact: "Mars gets its red color from iron oxide (rust).",
    },
    {
      question: "Which planet is the biggest in our solar system?",
      answer: "Jupiter",
      fact: "Jupiter has more than 95 moons!",
    },
    {
      question: "What is the name of the galaxy we live in?",
      answer: "The Milky Way",
      fact: "The Milky Way has over 100 billion stars!",
    },
  ],
  assignmentId,
}: FlashcardsPageProps) {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const activityId = params?.id as string | undefined;

  const storageKey = user
    ? assignmentId
      ? `user-${user.id}-assignment-${assignmentId}`
      : activityId
        ? `user-${user.id}-activity-flashcards-${activityId}`
        : ""
    : "";

  const [currentCard, setCurrentCard] = useSessionStorageState(`${storageKey}-currentCard`, 0);
  const [flipped, setFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useSessionStorageState<number[]>(
    `${storageKey}-mastered`,
    []
  );
  const [reviewIds, setReviewIds] = useSessionStorageState<number[]>(`${storageKey}-review`, []);
  const [deckCompleted, setDeckCompleted] = useState(false);
  const [xpReward, setXpReward] = useState<number>(100);
  const gameStartedAtRef = useRef<number>(0);
  const [finalGameStartedAt, setFinalGameStartedAt] = useState<number>(0);

  useEffect(() => {
    gameStartedAtRef.current = Date.now();
    getActivityXp("flashcards").then(setXpReward);
  }, []);

  const card = flashcards[currentCard] || flashcards[0];
  const progress = ((currentCard + 1) / flashcards.length) * 100;

  const handleNext = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard((prev) => prev + 1);
      setFlipped(false);
    } else {
      setFinalGameStartedAt(gameStartedAtRef.current);
      setDeckCompleted(true);
    }
  };

  const handleMastered = () => {
    if (!masteredIds.includes(currentCard)) {
      setMasteredIds((prev) => [...prev, currentCard]);
    }
    setReviewIds((prev) => prev.filter((id) => id !== currentCard));
    handleNext();
  };

  const handleReview = () => {
    if (!reviewIds.includes(currentCard)) {
      setReviewIds((prev) => [...prev, currentCard]);
    }
    setMasteredIds((prev) => prev.filter((id) => id !== currentCard));
    handleNext();
  };

  const handleRestart = () => {
    if (storageKey) {
      sessionStorage.removeItem(`${storageKey}-currentCard`);
      sessionStorage.removeItem(`${storageKey}-mastered`);
      sessionStorage.removeItem(`${storageKey}-review`);
    }
    gameStartedAtRef.current = Date.now();
    setFinalGameStartedAt(0);
    setCurrentCard(0);
    setFlipped(false);
    setMasteredIds([]);
    setReviewIds([]);
    setDeckCompleted(false);
  };

  const handleFinish = () => {
    if (assignmentId) {
      router.push("/dashboard/kid");
    } else {
      router.push(APP_ROUTES.Activities);
    }
  };

  return (
    <div className="bg-background flex flex-col relative h-full max-h-full overflow-hidden">
      <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />

      <main className="relative z-10 flex-1 px-4 py-4 md:px-6 flex flex-col min-h-0 overflow-hidden">
        <div className="mx-auto max-w-4xl w-full flex-1 flex flex-col justify-start gap-4 sm:gap-5 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between shrink-0">
            <Link
              href={APP_ROUTES.Activities}
              className="inline-flex items-center gap-1.5 text-sky-600 font-bold hover:text-sky-800 hover:-translate-x-1 transition-transform bg-card px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-sm border border-border w-fit text-xs sm:text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back{" "}
              <span className="hidden sm:inline">to Activities</span>
            </Link>

            <div className="rounded-full bg-card px-2.5 py-1 sm:px-4 sm:py-1 shadow-sm border border-border text-[10px] sm:text-xs">
              <span className="font-bold text-sky-600">
                {deckCompleted ? "Finished!" : `Card ${currentCard + 1} of ${flashcards.length}`}
              </span>
            </div>
          </div>
          <div className="space-y-1 shrink-0">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:block">
                  Current Deck
                </p>
                <h2 className="text-sm sm:text-lg md:text-2xl font-black text-foreground">
                  {deckTitle}
                </h2>
              </div>
            </div>
            <Progress value={progress} className="h-1.5 rounded-full bg-muted" />
          </div>

          {card?.fact && (
            <div className="rounded-2xl border-2 border-sky-500/20 bg-sky-50/50 dark:bg-sky-950/20 px-4 py-2.5 shadow-xs max-w-3xl mx-auto w-full shrink-0 animate-in fade-in slide-in-from-top-2">
              <p className="text-xs font-bold text-sky-600 dark:text-sky-400">
                <span className="font-extrabold uppercase mr-1.5">Did you know?</span>
                {card.fact}
              </p>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0 mt-2">
            <ActivityCard
              className="border-4 border-sky-500 cursor-pointer select-none transition-colors hover:border-sky-600/80 active:scale-[0.998]"
              onClick={() => setFlipped(!flipped)}
            >
              <ActivityCardContent>
                {!flipped ? (
                  <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center gap-4 my-auto">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-foreground leading-tight">
                      {card?.question}
                    </h2>

                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider shrink-0 animate-pulse">
                      Click anywhere on the card to flip 🌟
                    </p>
                  </div>
                ) : (
                  <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center gap-4 my-auto">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-green-600 leading-tight">
                      {card?.answer}
                    </h2>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider shrink-0">
                      Click anywhere to flip back
                    </p>
                  </div>
                )}
              </ActivityCardContent>
            </ActivityCard>
          </div>

          <div className="mt-4 shrink-0">
            {!flipped ? (
              <button
                type="button"
                onClick={() => setFlipped(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-sky-500/30 hover:border-sky-500 bg-card hover:bg-sky-500/5 text-sky-600 font-extrabold text-sm sm:text-base cursor-pointer shadow-xs transition-all active:translate-y-0.5 active:shadow-none"
              >
                <RefreshCcw className="h-4.5 w-4.5 shrink-0" />
                <span>Flip Card</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleReview}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-red-500/30 hover:border-red-500 bg-card hover:bg-red-500/5 text-red-600 font-extrabold text-sm sm:text-base cursor-pointer shadow-xs transition-all active:translate-y-0.5"
                >
                  <RotateCcw className="h-4.5 w-4.5 shrink-0" />
                  <span>Study Again</span>
                </button>

                <button
                  type="button"
                  onClick={handleMastered}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-green-500/30 hover:border-green-500 bg-card hover:bg-green-500/5 text-green-600 font-extrabold text-sm sm:text-base cursor-pointer shadow-xs transition-all active:translate-y-0.5"
                >
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                  <span>I Know This</span>
                </button>
              </div>
            )}
          </div>

          <div className="my-1 flex justify-center gap-3 shrink-0 text-xs font-bold">
            <div className="rounded-full bg-card px-2 sm:px-4 py-1.5 shadow-sm border border-border">
              <span className="text-green-600">{masteredIds.length} Mastered</span>
            </div>

            <div className="rounded-full bg-card px-2 sm:px-4 py-1.5 shadow-sm border border-border">
              <span className="text-red-500">{reviewIds.length} Review</span>
            </div>

            <div className="rounded-full bg-card px-2 sm:px-4 py-1.5 shadow-sm border border-border">
              <span className="text-sky-600">{flashcards.length - currentCard} Remaining</span>
            </div>
          </div>
        </div>
      </main>

      <VictoryModal
        isOpen={deckCompleted}
        onReplay={handleRestart}
        onContinue={handleFinish}
        xpEarned={Math.round((xpReward * masteredIds.length) / (flashcards.length || 1))}
        activitySlug="flashcards"
        activityTitle="Flashcards"
        score={`${Math.round((masteredIds.length / (flashcards.length || 1)) * 100)}%`}
        scoreDescription={`Incredible learning speed! You finished studying the deck "${deckTitle}".`}
        rewardsDescription={`${masteredIds.length}/${flashcards.length} Cards Mastered`}
        assignmentId={assignmentId}
        gameStartedAt={finalGameStartedAt}
        reviewData={
          {
            type: "flashcards",
            title: deckTitle,
            total_cards: flashcards.length,
            mastered: masteredIds.map((i) => ({
              question: flashcards[i]?.question ?? "",
              answer: flashcards[i]?.answer ?? "",
            })),
            review: reviewIds.map((i) => ({
              question: flashcards[i]?.question ?? "",
              answer: flashcards[i]?.answer ?? "",
            })),
          } satisfies FlashcardReviewData
        }
        onClaimSuccess={() => {
          if (storageKey) {
            sessionStorage.removeItem(`${storageKey}-currentCard`);
            sessionStorage.removeItem(`${storageKey}-mastered`);
            sessionStorage.removeItem(`${storageKey}-review`);
          }
        }}
      />

      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-sky-500 shadow-md hover:bg-sky-600 z-50 shrink-0 text-white"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    </div>
  );
}
