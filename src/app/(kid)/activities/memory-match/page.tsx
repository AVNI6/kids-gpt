"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Award,
  RotateCcw,
  Loader2,
  Lock,
  CheckCircle2,
  Sparkles,
  Star,
  ChevronDown,
  ChevronUp,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { APP_ROUTES } from "@/constant/AppRoutes";
import {
  getActivityXp,
  getMemoryMatchProgress,
  saveMemoryCampaignProgress,
} from "@/actions/activity.actions";
import { toast } from "sonner";
import { memoryCampaignLevels, MemoryLevel, MemoryStep } from "@/constant/MemoryCampaign";

interface MemoryCard {
  id: number;
  emoji: string;
  matched: boolean;
  uniqueId: number;
}

export default function MemoryMatchPage() {
  // Campaign State
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [unlockedWorld, setUnlockedWorld] = useState(1);
  const [unlockedStep, setUnlockedStep] = useState(1);
  const [completedSlugs, setCompletedSlugs] = useState<string[]>([]);
  const [expandedWorldId, setExpandedWorldId] = useState<number | null>(1);
  const [xpReward, setXpReward] = useState<number>(80);

  // Active Game State
  const [activeStep, setActiveStep] = useState<{ level: MemoryLevel; step: MemoryStep } | null>(
    null
  );
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [matches, setMatches] = useState(0);
  const [flipsCount, setFlipsCount] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const hasClaimed = useRef(false);

  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [gameFailed, setGameFailed] = useState(false);

  // Sneak Peek Preview State
  const [isRevealedPreview, setIsRevealedPreview] = useState(false);
  const [previewCountdown, setPreviewCountdown] = useState(5);

  // Fetch campaign progress and base XP reward on mount
  const fetchProgress = async (showLoadingScreen: boolean = false) => {
    try {
      if (showLoadingScreen) {
        setLoadingProgress(true);
      }
      const [xpData, progressData] = await Promise.all([
        getActivityXp("memory-match"),
        getMemoryMatchProgress(),
      ]);

      setXpReward(xpData);

      if (progressData.success) {
        setUnlockedWorld(progressData.unlockedWorld ?? 1);
        setUnlockedStep(progressData.unlockedStep ?? 1);
        setCompletedSlugs(progressData.completedSlugs ?? []);
        // Automatically expand the kid's active world
        setExpandedWorldId(progressData.unlockedWorld ?? 1);
      }
    } catch (err) {
      console.error("Error loading campaign progress:", err);
      toast.error("Failed to load progress maps.");
    } finally {
      if (showLoadingScreen) {
        setLoadingProgress(false);
      }
    }
  };

  useEffect(() => {
    if (gameCompleted && activeStep && !hasClaimed.current) {
      hasClaimed.current = true;

      const autoClaim = async () => {
        const accuracy = Math.max(
          20,
          Math.min(100, Math.round((activeStep.step.pairCount / flipsCount) * 100))
        );
        const scoreStr = `${accuracy}% Accuracy`;

        try {
          const res = await saveMemoryCampaignProgress(
            activeStep.level.id,
            activeStep.step.stepNumber,
            xpReward,
            scoreStr
          );

          if (res.success) {
            toast.success("Stage Cleared! 🎉", {
              description: `+${xpReward} XP earned! Next step unlocked!`,
            });
            await fetchProgress(false);
          } else {
            console.error("Memory match auto-claim returned failure status:", res.error);
          }
        } catch (err) {
          console.error("Memory match auto-claim exception:", err);
        }
      };

      autoClaim();
    }
  }, [gameCompleted, activeStep, flipsCount, xpReward]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProgress(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Main countdown timer effect (paused during preview)
  useEffect(() => {
    if (
      !activeStep ||
      gameCompleted ||
      gameFailed ||
      timeLeft === null ||
      timeLeft <= 0 ||
      isRevealedPreview
    )
      return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          setGameFailed(true);
          setDisabled(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeStep, gameCompleted, gameFailed, timeLeft, isRevealedPreview]);

  // Sneak Peek countdown timer effect
  useEffect(() => {
    if (!activeStep || !isRevealedPreview || previewCountdown <= 0) return;

    const timer = setInterval(() => {
      setPreviewCountdown((prev) => {
        if (prev <= 1) {
          setIsRevealedPreview(false);
          setFlipped([]);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeStep, isRevealedPreview, previewCountdown]);

  // Check if a specific step is completed
  const isStepCompleted = (levelId: number, stepNum: number) => {
    return completedSlugs.includes(`memory-match-w${levelId}-s${stepNum}`);
  };

  // Check if a specific step is unlocked
  const isStepUnlocked = (levelId: number, stepNum: number) => {
    // Current world is unlocked if levelId <= unlockedWorld
    if (levelId < unlockedWorld) return true;
    if (levelId > unlockedWorld) return false;
    // If inside the current active world, step is unlocked if <= unlockedStep
    return stepNum <= unlockedStep;
  };

  // Check if a world is unlocked (contains at least one unlocked step)
  const isWorldUnlocked = (levelId: number) => {
    return levelId <= unlockedWorld;
  };

  // Deck initialization for selected step
  const initializeGame = (level: MemoryLevel, step: MemoryStep) => {
    const pairCount = step.pairCount;
    // Take the required amount of unique emojis for this world
    const selectedEmojis = step.emojis.slice(0, pairCount);

    // Duplicate, map ids and unique values
    const deck = [...selectedEmojis, ...selectedEmojis].map((emoji, index) => ({
      id: index,
      emoji,
      matched: false,
      uniqueId: Math.random(),
    }));

    // Shuffle deck
    const shuffled = deck.sort(() => Math.random() - 0.5);

    setCards(shuffled);
    setFlipped([]);
    setMatches(0);
    setFlipsCount(0);
    setDisabled(false);
    setGameCompleted(false);
    setTimeLeft(step.timeLimit);
    setGameFailed(false);
    hasClaimed.current = false;

    // Trigger the initial 5s memory preview sneak peek
    setIsRevealedPreview(true);
    setPreviewCountdown(5);

    setActiveStep({ level, step });
  };

  const handleCardClick = (index: number) => {
    if (
      disabled ||
      flipped.includes(index) ||
      cards[index].matched ||
      !activeStep ||
      gameFailed ||
      isRevealedPreview
    )
      return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setDisabled(true);
      setFlipsCount((f) => f + 1);
      const [first, second] = newFlipped;

      if (cards[first].emoji === cards[second].emoji) {
        setCards((prev) =>
          prev.map((card, i) => (i === first || i === second ? { ...card, matched: true } : card))
        );
        setMatches((m) => m + 1);
        setFlipped([]);
        setDisabled(false);

        // Check completion (matches === pairCount)
        if (matches + 1 === activeStep.step.pairCount) {
          setTimeout(() => {
            setGameCompleted(true);
          }, 600);
        }
      } else {
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, 1000);
      }
    }
  };

  const handleFinishMission = () => {
    setActiveStep(null);
    setGameCompleted(false);
  };

  const totalCompletedCount = completedSlugs.length;
  const campaignProgressPercentage = (totalCompletedCount / 200) * 100;

  // View toggles & layouts
  if (loadingProgress) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">
          Loading campaign map...
        </p>
      </div>
    );
  }

  // GAME CORE VIEW
  if (activeStep) {
    const step = activeStep.step;
    const level = activeStep.level;
    const gridProgress = (matches / step.pairCount) * 100;
    const accuracy =
      flipsCount > 0
        ? Math.max(20, Math.min(100, Math.round((step.pairCount / flipsCount) * 100)))
        : 100;

    // Card-shrinking responsive helper based on column layout
    const getCardStyleClasses = () => {
      const cols = step.gridCols;
      if (cols <= 4) {
        return {
          card: "border-4 rounded-[16px] md:rounded-[24px]",
          emoji: "text-5xl md:text-7xl",
          question: "text-4xl md:text-6xl font-black text-white",
        };
      }
      if (cols <= 8) {
        return {
          card: "border-2 rounded-xl",
          emoji: "text-3xl md:text-4xl",
          question: "text-2xl md:text-3xl font-bold text-white",
        };
      }
      if (cols <= 12) {
        return {
          card: "border rounded-lg",
          emoji: "text-xl md:text-2xl",
          question: "text-lg md:text-xl font-bold text-white",
        };
      }
      // For massive grids (up to 20 columns)
      return {
        card: "border-[0.5px] rounded-md",
        emoji: "text-sm md:text-base leading-none",
        question: "text-xs md:text-sm font-bold text-white leading-none",
      };
    };

    const getGridGapClass = () => {
      const cols = step.gridCols;
      if (cols <= 4) return "gap-3 md:gap-4";
      if (cols <= 8) return "gap-2 md:gap-3";
      if (cols <= 12) return "gap-1.5 md:gap-2";
      return "gap-0.5 md:gap-1";
    };

    // DEFEAT / TIME'S UP SCREEN
    if (gameFailed) {
      return (
        <div className="h-screen bg-background overflow-hidden flex flex-col relative min-h-0">
          <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

          <main className="relative z-10 flex-1 px-4 py-6 md:px-8 md:py-8 overflow-hidden flex flex-col justify-center items-center">
            <div className="max-w-xl w-full flex flex-col justify-between gap-4 min-h-0">
              <div className="flex items-center justify-between shrink-0 mb-2">
                <Button
                  onClick={() => {
                    setActiveStep(null);
                    setGameFailed(false);
                  }}
                  variant="ghost"
                  className="inline-flex items-center gap-2 text-red-600 font-bold hover:text-red-800 bg-card px-4 py-1.5 rounded-full shadow-sm border border-border text-sm"
                >
                  <ArrowLeft className="h-4 w-4" /> Exit Mission
                </Button>

                <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border text-xs font-bold text-red-600 animate-pulse">
                  Time&apos;s Up!
                </div>
              </div>

              <Card className="border-4 border-red-500/30 shadow-2xl rounded-[32px] bg-card p-6 text-center flex flex-col justify-center items-center gap-4 animate-in zoom-in duration-300 relative overflow-hidden">
                <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-red-500/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

                <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-red-500/10 border-4 border-dashed border-red-500 animate-bounce">
                  <span className="text-4xl">⏰</span>
                </div>

                <h2 className="text-3xl font-black text-foreground tracking-tight leading-none">
                  Time&apos;s Up! ⏰💔
                </h2>

                <p className="text-muted-foreground text-sm max-w-sm">
                  Don&apos;t give up! Your brain is growing stronger even when it&apos;s hard.
                  Let&apos;s try again!
                </p>

                <div className="grid grid-cols-2 gap-3 w-full max-w-md mt-4">
                  <div className="bg-pink-500/10 rounded-2xl p-3 border border-pink-500/20 flex flex-col justify-center items-center">
                    <h4 className="text-[10px] font-black uppercase text-pink-600 tracking-wider">
                      Flips Made
                    </h4>
                    <p className="text-xl font-black text-pink-600 mt-1">{flipsCount}</p>
                  </div>
                  <div className="bg-purple-500/10 rounded-2xl p-3 border border-purple-500/20 flex flex-col justify-center items-center">
                    <h4 className="text-[10px] font-black uppercase text-purple-600 tracking-wider">
                      Matches Found
                    </h4>
                    <p className="text-xl font-black text-purple-600 mt-1">
                      {matches} / {step.pairCount}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3 w-full max-w-md relative z-10">
                  <Button
                    onClick={() => initializeGame(level, step)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold py-6 shadow-md transform hover:-translate-y-0.5 active:translate-y-px text-sm"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Try Again
                  </Button>
                  <Button
                    onClick={() => {
                      setActiveStep(null);
                      setGameFailed(false);
                    }}
                    variant="outline"
                    className="flex-1 border-2 border-border hover:bg-muted text-foreground rounded-2xl font-bold py-6 shadow-sm text-sm"
                  >
                    Back to Hub Map
                  </Button>
                </div>
              </Card>
            </div>
          </main>
        </div>
      );
    }

    // VICTORY SCREEN
    if (gameCompleted) {
      return (
        <div className="h-screen bg-background overflow-hidden flex flex-col relative min-h-0">
          <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-pink-500/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

          <main className="relative z-10 flex-1 px-4 py-6 md:px-8 md:py-8 overflow-hidden flex flex-col justify-center items-center">
            <div className="max-w-xl w-full flex flex-col justify-between gap-4 min-h-0">
              <div className="flex items-center justify-between shrink-0 mb-2">
                <Button
                  onClick={() => {
                    setActiveStep(null);
                    setGameCompleted(false);
                  }}
                  variant="ghost"
                  className="inline-flex items-center gap-2 text-pink-600 font-bold hover:text-pink-800 bg-card px-4 py-1.5 rounded-full shadow-sm border border-border text-sm"
                >
                  <ArrowLeft className="h-4 w-4" /> Exit Mission
                </Button>

                <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border text-xs font-bold text-pink-600 animate-pulse">
                  Step Cleared!
                </div>
              </div>

              <Card className="border-4 border-pink-500/30 shadow-2xl rounded-[32px] bg-card p-6 text-center flex flex-col justify-center items-center gap-4 animate-in zoom-in duration-300 relative overflow-hidden">
                <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-pink-500/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

                <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-pink-500/10 border-4 border-dashed border-pink-500 animate-bounce">
                  <Award className="h-10 w-10 text-pink-600" />
                </div>

                <h2 className="text-3xl font-black text-foreground tracking-tight leading-none">
                  Stage Cleared! 🎉🧠
                </h2>

                <p className="text-muted-foreground text-sm max-w-sm">
                  Awesome! You conquered World {level.id} - Step {step.stepNumber} and expanded your
                  mind!
                </p>

                <div className="grid grid-cols-3 gap-3 w-full max-w-md mt-4">
                  <div className="bg-pink-500/10 rounded-2xl p-3 border border-pink-500/20 flex flex-col justify-center items-center">
                    <h4 className="text-[10px] font-black uppercase text-pink-600 tracking-wider">
                      Flips
                    </h4>
                    <p className="text-xl font-black text-pink-600 mt-1">{flipsCount}</p>
                  </div>
                  <div className="bg-purple-500/10 rounded-2xl p-3 border border-purple-500/20 flex flex-col justify-center items-center">
                    <h4 className="text-[10px] font-black uppercase text-purple-600 tracking-wider">
                      Accuracy
                    </h4>
                    <p className="text-xl font-black text-purple-600 mt-1">{accuracy}%</p>
                  </div>
                  <div className="bg-green-500/10 rounded-2xl p-3 border border-green-500/20 flex flex-col justify-center items-center">
                    <h4 className="text-[10px] font-black uppercase text-green-600 tracking-wider">
                      Reward
                    </h4>
                    <p className="text-xl font-black text-green-600 mt-1">+{xpReward} XP</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-md relative z-10">
                  <Button
                    onClick={handleFinishMission}
                    className="flex-1 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold py-6 shadow-md transform hover:-translate-y-0.5 active:translate-y-px text-sm"
                  >
                    Continue 🎉
                  </Button>
                  <Button
                    onClick={() => initializeGame(level, step)}
                    variant="outline"
                    className="flex-1 border-2 border-border hover:bg-muted text-foreground rounded-2xl font-bold py-6 shadow-sm text-sm"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Retry Stage
                  </Button>
                </div>
              </Card>
            </div>
          </main>
        </div>
      );
    }

    const cardStyles = getCardStyleClasses();
    const rows = Math.ceil((step.pairCount * 2) / step.gridCols);

    return (
      <div className="h-screen bg-background flex flex-col relative min-h-0 overflow-hidden">
        {/* Strictly confined screen-fit wrapper */}
        <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-pink-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

        <main className="relative z-10 flex-1 px-4 py-4 md:px-8 flex flex-col min-h-0 justify-between">
          <div className="mx-auto max-w-4xl w-full h-full flex flex-col justify-between gap-3 min-h-0 pb-3">
            {/* Header info with dynamic timer widget */}
            <div className="flex items-center justify-between gap-2 shrink-0">
              <Button
                onClick={() => {
                  setActiveStep(null);
                  setGameFailed(false);
                }}
                variant="ghost"
                className="inline-flex items-center gap-2 text-pink-600 font-bold hover:text-pink-800 bg-card px-4 py-1.5 rounded-full shadow-sm border border-border text-sm shrink-0"
              >
                <ArrowLeft className="h-4 w-4" /> Exit Stage
              </Button>

              {timeLeft !== null && (
                <div
                  className={`rounded-full px-4 py-1.5 shadow-sm border text-xs font-black flex items-center gap-1.5 shrink-0 ${
                    timeLeft <= 15
                      ? "bg-red-500/10 border-red-500/20 text-red-600 animate-bounce"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-600 animate-pulse"
                  }`}
                >
                  <span>⏰ {timeLeft}s Left</span>
                </div>
              )}

              <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border text-xs shrink-0 font-bold text-pink-600">
                World {level.id} - Step {step.stepNumber} | Flips: {flipsCount}
              </div>
            </div>

            {/* Preview Sneak Peek Banner OR Progress Bar */}
            {isRevealedPreview ? (
              <div className="bg-amber-500/10 border border-dashed border-amber-500/20 rounded-2xl py-2 px-4 text-center shrink-0 animate-pulse">
                <p className="text-xs font-black text-amber-600 flex items-center justify-center gap-2">
                  <span>🤔 Memorize the grid! Starting in {previewCountdown}s...</span>
                </p>
              </div>
            ) : (
              <div className="space-y-1 shrink-0">
                <div className="flex items-center justify-between text-xs text-pink-600 font-bold">
                  <span>Matching Progress</span>
                  <span className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-0.5 shadow-sm border border-border">
                    {Math.round(gridProgress)}% Matched
                  </span>
                </div>
                <Progress
                  value={gridProgress}
                  className="h-2 rounded-full bg-pink-500/10 [&>div]:bg-pink-500"
                />
              </div>
            )}

            {/* Strict Screen-Fit Cards Grid Container using dynamic inline geometry overrides */}
            <div className="flex-1 flex items-center justify-center min-h-0 py-2">
              <div
                className={`grid ${getGridGapClass()} w-full justify-center items-center mx-auto content-center`}
                style={{
                  gridTemplateColumns: `repeat(${step.gridCols}, minmax(0, 1fr))`,
                  maxWidth: `calc(min(90vw, (58vh / ${rows}) * ${step.gridCols}))`,
                }}
              >
                {cards.map((card, i) => {
                  const isFlipped = isRevealedPreview || flipped.includes(i) || card.matched;
                  return (
                    <button
                      key={card.id}
                      onClick={() => handleCardClick(i)}
                      disabled={card.matched || disabled || isRevealedPreview}
                      className={`aspect-square w-full ${cardStyles.card} transition-all duration-300 transform ${
                        isFlipped
                          ? "bg-card border-pink-500/30 scale-95 opacity-90"
                          : "bg-gradient-to-br from-pink-500 to-purple-600 border-pink-600 shadow-lg hover:-translate-y-0.5 hover:scale-105 active:scale-95 duration-150 cursor-pointer"
                      } flex items-center justify-center`}
                    >
                      <div className="w-full h-full flex items-center justify-center transition-opacity duration-300">
                        {isFlipped ? (
                          <span
                            className={`animate-in zoom-in-75 duration-200 ${cardStyles.emoji}`}
                          >
                            {card.emoji}
                          </span>
                        ) : (
                          <span className={`select-none animate-pulse ${cardStyles.question}`}>
                            ?
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="h-10 flex justify-center shrink-0 items-center">
              <Button
                onClick={() => initializeGame(level, step)}
                variant="ghost"
                className="text-pink-600 hover:bg-pink-500/10 font-bold rounded-full text-sm"
              >
                <RotateCcw className="mr-1.5 h-4 w-4" /> Shuffle & Restart
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // CAMPAIGN HUB MAP VIEW
  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col relative min-h-0">
      {/* Background Orbs */}
      <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-pink-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

      {/* Main Campaign Dashboard Panel */}
      <main className="relative z-10 flex-1 px-4 py-4 md:px-8 flex flex-col min-h-0">
        <div className="mx-auto max-w-4xl w-full h-full flex flex-col gap-4 min-h-0">
          {/* Header Progress panel */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-card rounded-3xl p-4 md:p-6 shadow-sm border border-border gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <Link
                href={APP_ROUTES.Activities}
                className="inline-flex items-center justify-center p-2 rounded-2xl bg-muted border border-border text-foreground hover:bg-pink-500/10 hover:text-pink-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2 leading-none">
                  Memory Match Campaign <Trophy className="h-5 w-5 text-amber-500 animate-bounce" />
                </h1>
                <p className="text-xs font-bold text-muted-foreground mt-1">
                  Conquer 20 Worlds and 200 Stages to master your memory!
                </p>
              </div>
            </div>

            {/* Campaign overall progress status */}
            <div className="w-full sm:w-60 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-black text-pink-600">
                <span>Stages Cleared: {totalCompletedCount} / 200</span>
                <span>{Math.round(campaignProgressPercentage)}%</span>
              </div>
              <Progress
                value={campaignProgressPercentage}
                className="h-2.5 rounded-full bg-pink-500/10 [&>div]:bg-gradient-to-r [&>div]:from-pink-500 [&>div]:to-purple-600"
              />
            </div>
          </div>

          {/* Worlds List (Scrollable timeline) */}
          <div className="flex-1 overflow-y-auto px-1 pt-1 space-y-4 pb-6 min-h-0 scrollbar-thin">
            {memoryCampaignLevels.map((level) => {
              const unlocked = isWorldUnlocked(level.id);
              const expanded = expandedWorldId === level.id;

              // Count completed steps inside this world
              const completedInWorld = level.steps.filter((s) =>
                isStepCompleted(level.id, s.stepNumber)
              ).length;

              return (
                <div
                  key={level.id}
                  className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                    unlocked
                      ? `bg-card shadow-sm hover:shadow-md ${expanded ? "ring-2 ring-pink-500/30 border-pink-500/50" : "border-border"}`
                      : "bg-muted/40 border-muted opacity-60 pointer-events-none select-none"
                  }`}
                >
                  {/* World Header Info Panel */}
                  <div
                    onClick={() => {
                      if (unlocked) {
                        setExpandedWorldId(expanded ? null : level.id);
                      }
                    }}
                    className={`flex items-center justify-between p-4 md:p-5 cursor-pointer select-none transition-colors ${
                      unlocked ? "hover:bg-muted/40" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Level Badges */}
                      <div
                        className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${level.colorTheme.gradient} shadow-md`}
                      >
                        <Star
                          className={`h-6 w-6 ${completedInWorld === 10 ? "animate-spin" : ""}`}
                        />
                      </div>

                      <div>
                        <h3 className="text-base font-black tracking-tight text-foreground flex items-center gap-2 leading-tight">
                          {level.title}
                          {completedInWorld === 10 && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-lg hidden sm:block">
                          {level.description}
                        </p>
                        <p className="text-xs font-bold text-pink-600 mt-1 block sm:hidden">
                          Progress: {completedInWorld} / 10 Stages
                        </p>
                      </div>
                    </div>

                    {/* Progress indicators and toggles */}
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 text-right">
                        <span className="text-xs font-bold text-pink-600">
                          {completedInWorld} / 10 Cleared
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {completedInWorld === 10 ? "Perfect Score!" : "In Progress"}
                        </span>
                      </div>

                      {unlocked ? (
                        expanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                        )
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Inline Steps Path Collapsible Grid */}
                  {unlocked && expanded && (
                    <div className="px-5 pb-5 pt-1 bg-muted/20 border-t border-border animate-in slide-in-from-top-4 duration-300">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
                        World Steps Pathway:
                      </p>

                      {/* Node Grid Pathway */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {level.steps.map((step) => {
                          const stepCompleted = isStepCompleted(level.id, step.stepNumber);
                          const stepUnlocked = isStepUnlocked(level.id, step.stepNumber);

                          return (
                            <button
                              key={step.stepNumber}
                              disabled={!stepUnlocked}
                              onClick={() => {
                                if (stepUnlocked) {
                                  initializeGame(level, step);
                                }
                              }}
                              className={`group relative flex flex-col items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 min-h-[110px] ${
                                stepCompleted
                                  ? "bg-green-500/10 border-green-500/30 text-green-700 hover:bg-green-500/20 cursor-pointer"
                                  : stepUnlocked
                                    ? `bg-gradient-to-br ${level.colorTheme.gradient} text-white border-transparent shadow-md hover:scale-105 active:scale-95 cursor-pointer`
                                    : "bg-muted/40 border-muted text-muted-foreground pointer-events-none"
                              }`}
                            >
                              {/* Step Top Section */}
                              <div className="flex items-center justify-between w-full">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wide ${
                                    stepUnlocked && !stepCompleted ? "text-white/80" : ""
                                  }`}
                                >
                                  Stage {step.stepNumber}
                                </span>

                                {stepCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                ) : stepUnlocked ? (
                                  <Sparkles className="h-3.5 w-3.5 text-white animate-pulse shrink-0" />
                                ) : (
                                  <Lock className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                                )}
                              </div>

                              {/* Step Center Details */}
                              <div className="my-2 flex flex-col justify-center items-center">
                                <div
                                  className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-sm ${
                                    stepCompleted
                                      ? "bg-green-500/20 text-green-700"
                                      : stepUnlocked
                                        ? "bg-white/20 text-white"
                                        : "bg-muted/80 text-muted-foreground/60"
                                  }`}
                                >
                                  {step.stepNumber}
                                </div>
                              </div>

                              {/* Step Bottom Info */}
                              <div className="flex flex-col items-center gap-0.5 mt-auto">
                                <span
                                  className={`text-[9px] font-bold tracking-wide uppercase ${
                                    stepUnlocked && !stepCompleted
                                      ? "text-white/90"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {step.pairCount} Pairs
                                </span>
                                {step.timeLimit !== null && (
                                  <span
                                    className={`text-[8px] font-black tracking-wider uppercase flex items-center gap-0.5 ${
                                      stepUnlocked && !stepCompleted
                                        ? "text-white/80"
                                        : "text-amber-600"
                                    }`}
                                  >
                                    ⏱️ {step.timeLimit}s
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
