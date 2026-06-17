"use client";

import { useState, useEffect, useRef } from "react";
import { RefreshCcw, CheckCircle2, RotateCcw, Sparkles, Rocket, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSessionStorageState } from "@/hooks/shared/useSessionStorageState";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/lib/constants/common";
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
    <div className="h-full bg-background overflow-hidden flex flex-col relative min-h-screen">
      <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />

      <main className="relative z-10 flex-1 px-4 py-4 md:px-8 md:py-5 overflow-hidden flex flex-col min-h-0">
        <div className="mx-auto max-w-4xl w-full h-full flex flex-col justify-between gap-3 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <Link
              href={APP_ROUTES.Activities}
              className="inline-flex items-center gap-2 text-sky-600 font-bold hover:text-sky-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Activities
            </Link>

            <div className="rounded-full bg-card px-4 py-1 shadow-sm border border-border text-xs">
              <span className="font-bold text-sky-600">
                {deckCompleted ? "Finished!" : `Card ${currentCard + 1} of ${flashcards.length}`}
              </span>
            </div>
          </div>
          <div className="space-y-1.5 shrink-0">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Current Deck
                </p>
                <h2 className="text-xl md:text-2xl font-black text-foreground">{deckTitle}</h2>
              </div>
            </div>
            <Progress value={progress} className="h-2 rounded-full bg-muted" />
          </div>

          <div className="relative flex-1 flex flex-col min-h-0 mt-2">
            <div className="absolute -top-12 right-2 md:right-4 z-20">
              <div className="rounded-2xl border-2 border-sky-500/20 bg-card px-3 py-1.5 shadow-md max-w-50">
                <p className="text-xs font-bold text-sky-600 truncate-3-lines">{card?.fact}</p>
              </div>
            </div>

            <Card className="border-4 border-sky-500 shadow-md rounded-[20px] bg-card flex-1 flex flex-col min-h-0 overflow-hidden mt-6">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center flex-1 min-h-0 overflow-y-auto">
                {!flipped ? (
                  <>
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[20px] bg-sky-500/10 shrink-0">
                      <Rocket className="h-10 w-10 text-sky-600" />
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-foreground leading-tight max-w-lg">
                      {card?.question}
                    </h2>

                    <p className="mt-4 text-[10px] font-bold uppercase text-muted-foreground tracking-wider shrink-0 animate-pulse">
                      Click to flip
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[20px] bg-green-500/10 shrink-0">
                      <Sparkles className="h-10 w-10 text-green-600" />
                    </div>

                    <h2 className="text-3xl md:text-4xl font-black text-green-600 leading-tight max-w-lg">
                      {card?.answer}
                    </h2>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-20 shrink-0">
              <Button
                onClick={() => setFlipped(!flipped)}
                className="h-10 rounded-xl px-6 text-sm font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md active:translate-y-0.5 active:shadow-sm"
              >
                <RefreshCcw className="mr-1.5 h-4 w-4" />
                Flip Card
              </Button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 shrink-0">
            <Card
              onClick={handleReview}
              className="border-2 border-red-500/50 rounded-[16px] shadow-sm cursor-pointer hover:bg-red-500/5 transition-all bg-card"
            >
              <CardContent className="flex flex-col items-center gap-1.5 py-3 text-center">
                <div className="rounded-full bg-red-500/10 p-2">
                  <RotateCcw className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-base font-black text-red-600">Study Again</h3>
                <p className="text-[10px] text-muted-foreground font-medium">Need more practice</p>
              </CardContent>
            </Card>

            <Card
              onClick={handleMastered}
              className="border-2 border-green-500/50 rounded-[16px] shadow-sm cursor-pointer hover:bg-green-500/5 transition-all bg-card"
            >
              <CardContent className="flex flex-col items-center gap-1.5 py-3 text-center">
                <div className="rounded-full bg-green-500/10 p-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-base font-black text-green-600">I Know This</h3>
                <p className="text-[10px] text-muted-foreground font-medium">Mastered it!</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-1.5 flex justify-center gap-3 shrink-0 text-xs font-bold">
            <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border">
              <span className="text-green-600">{masteredIds.length} Mastered</span>
            </div>

            <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border">
              <span className="text-red-500">{reviewIds.length} Review</span>
            </div>

            <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border">
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
        reviewData={{
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
        } satisfies FlashcardReviewData}
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
