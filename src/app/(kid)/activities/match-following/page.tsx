"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Award,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { APP_ROUTES } from "@/constant/AppRoutes";
import { saveKidActivityProgress } from "@/actions/dashboard.actions";
import { getActivityXp } from "@/actions/activity.actions";
import { toast } from "sonner";

interface MatchItem {
  id: string;
  leftText: string; // e.g. "🦁 Lion"
  rightText: string; // e.g. "Wild Animal"
}

interface MatchFollowingPageProps {
  matchTitle?: string;
  pairs?: MatchItem[];
}

const defaultPairs: MatchItem[] = [
  { id: "1", leftText: "🦁 Lion", rightText: "Wild Animal 🐾" },
  { id: "2", leftText: "🍎 Apple", rightText: "Fruit 🌳" },
  { id: "3", leftText: "🚀 Rocket", rightText: "Space Vehicle 🌌" },
  { id: "4", leftText: "🐳 Whale", rightText: "Ocean Animal 🌊" },
];

// Vibrant HSL colors for paths
const connectionColors = ["#f97316", "#3b82f6", "#a855f7", "#ec4899", "#06b6d4"];

export default function MatchFollowingPage({
  matchTitle = "Match Pairs",
  pairs = defaultPairs,
}: MatchFollowingPageProps) {
  const router = useRouter();
  const boardRef = useRef<HTMLDivElement>(null);

  // Check if pairs contain any emojis to dynamically customize column headings
  const hasEmoji = (text: string) => /[\uD800-\uDFFF\u2600-\u27BF]/.test(text);
  const containsEmojis = pairs.some((p) => hasEmoji(p.leftText) || hasEmoji(p.rightText));
  const leftHeading = containsEmojis ? "Questions 🧩" : "Questions";
  const rightHeading = containsEmojis ? "Matches 🔗" : "Matches";

  // Scrambled right side cards
  const [rightOrder, setRightOrder] = useState<MatchItem[]>([]);

  // Established connections: Array of leftId and rightId
  const [connections, setConnections] = useState<Array<{ leftId: string; rightId: string }>>([]);

  // Current active drawing line
  const [drawingState, setDrawingState] = useState<{
    startId: string;
    startSide: "left" | "right";
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Click-to-select tap fallback dot
  const [selectedDot, setSelectedDot] = useState<{ id: string; side: "left" | "right" } | null>(
    null
  );

  // Element coordinate positions relative to the board container
  const [coords, setCoords] = useState<Record<string, { x: number; y: number }>>({});

  // Submission & evaluation states
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [incorrectItems, setIncorrectItems] = useState<string[]>([]);
  const [xpReward, setXpReward] = useState<number>(90);
  const hasClaimed = useRef(false);

  // Play a cute synthesizer sound effect using the Web Audio API
  const playSound = (type: "pop" | "connect" | "disconnect" | "success" | "error" | "complete") => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "pop") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === "connect") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === "disconnect") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === "success") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.3); // C6
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === "error") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.setValueAtTime(130, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "complete") {
        // High-flourish arpeggio chords for 100% win
        const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = "triangle";
          o.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
          o.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.5 + idx * 0.06);
          g.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5 + idx * 0.06);
          o.start(ctx.currentTime + idx * 0.06);
          o.stop(ctx.currentTime + 0.6 + idx * 0.06);
        });
      }
    } catch (e) {
      console.warn("Web Audio API not allowed or initialized yet", e);
    }
  };

  useEffect(() => {
    getActivityXp("match-following").then(setXpReward);
  }, []);

  // Background Auto-Claiming Logic
  useEffect(() => {
    if (showScorecard && !hasClaimed.current) {
      hasClaimed.current = true;
      const autoClaim = async () => {
        const correctCount = connections.filter((c) => c.leftId === c.rightId).length;
        const accuracy = Math.round((correctCount / pairs.length) * 100);
        const scoreStr = `${accuracy}% Accuracy`;
        const scaledXp = Math.round((correctCount / pairs.length) * xpReward);

        try {
          const slug = matchTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

          const res = await saveKidActivityProgress(
            slug || "match-following",
            scaledXp,
            matchTitle,
            scoreStr
          );

          if (res.success) {
            toast.success("Progress Saved! 🎉", {
              description: `+${scaledXp} XP earned!`,
            });
          }
        } catch (err) {
          console.error("Auto-claim error:", err);
        }
      };
      autoClaim();
    }
  }, [showScorecard, connections, pairs.length, xpReward, matchTitle]);

  // Compute positions of anchor dots relative to the parent board container
  const recalculateCoords = () => {
    if (!boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    const newCoords: Record<string, { x: number; y: number }> = {};

    pairs.forEach((item) => {
      const leftEl = document.getElementById(`dot-left-${item.id}`);
      if (leftEl) {
        const rect = leftEl.getBoundingClientRect();
        newCoords[`left-${item.id}`] = {
          x: rect.left - boardRect.left + rect.width / 2,
          y: rect.top - boardRect.top + rect.height / 2,
        };
      }

      const rightEl = document.getElementById(`dot-right-${item.id}`);
      if (rightEl) {
        const rect = rightEl.getBoundingClientRect();
        newCoords[`right-${item.id}`] = {
          x: rect.left - boardRect.left + rect.width / 2,
          y: rect.top - boardRect.top + rect.height / 2,
        };
      }
    });

    setCoords(newCoords);
  };

  const resetGame = () => {
    const scrambled = [...pairs].sort(() => Math.random() - 0.5);
    setRightOrder(scrambled);
    setConnections([]);
    setDrawingState(null);
    setSelectedDot(null);
    setHasSubmitted(false);
    setShowScorecard(false);
    setShowAnswers(false);
    setIncorrectItems([]);
    hasClaimed.current = false;
  };

  // Scramble cards on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairs]);

  // Handle window resizing to keep SVG coordinates snapped
  useEffect(() => {
    window.addEventListener("resize", recalculateCoords);
    const timer = setTimeout(recalculateCoords, 150);
    return () => {
      window.removeEventListener("resize", recalculateCoords);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightOrder, pairs, showScorecard]);

  // Establish standard 1-to-1 pair connection
  const connectPairs = (leftId: string, rightId: string) => {
    setConnections((prev) => {
      // Clear any prior links sharing these coordinates to preserve 1-to-1 uniqueness
      const filtered = prev.filter((c) => c.leftId !== leftId && c.rightId !== rightId);
      return [...filtered, { leftId, rightId }];
    });
  };

  // Dissolve an active connection
  const disconnectPair = (leftId: string) => {
    playSound("disconnect");
    setConnections((prev) => prev.filter((c) => c.leftId !== leftId));
  };

  // Click / Tap Fallback pairing selection
  const handleTapDot = (id: string, side: "left" | "right") => {
    if (hasSubmitted) return;

    if (!selectedDot) {
      setSelectedDot({ id, side });
    } else {
      if (selectedDot.id === id && selectedDot.side === side) {
        // Deselect
        setSelectedDot(null);
        playSound("disconnect");
      } else if (selectedDot.side !== side) {
        // Connect opposite sides
        const leftId = side === "left" ? id : selectedDot.id;
        const rightId = side === "right" ? id : selectedDot.id;
        connectPairs(leftId, rightId);
        playSound("connect");
        setSelectedDot(null);
      } else {
        // Shift selection
        setSelectedDot({ id, side });
        playSound("pop");
      }
    }
  };

  // Drag and draw coordinate movements
  const handlePointerDown = (e: React.PointerEvent, id: string, side: "left" | "right") => {
    if (hasSubmitted) return;
    e.preventDefault();
    playSound("pop");

    const key = `${side}-${id}`;
    const startCoord = coords[key];
    if (!startCoord) return;

    // Capture dragging pointer coords relative to board container
    if (boardRef.current) {
      const boardRect = boardRef.current.getBoundingClientRect();
      setDrawingState({
        startId: id,
        startSide: side,
        startX: startCoord.x,
        startY: startCoord.y,
        currentX: e.clientX - boardRect.left,
        currentY: e.clientY - boardRect.top,
      });
    }
  };

  // Manage dynamic pointer moving
  useEffect(() => {
    if (!drawingState) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!boardRef.current) return;
      const boardRect = boardRef.current.getBoundingClientRect();
      setDrawingState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentX: e.clientX - boardRect.left,
          currentY: e.clientY - boardRect.top,
        };
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!boardRef.current) return;

      const element = document.elementFromPoint(e.clientX, e.clientY);
      const targetDot = element?.closest("[data-dot-id]");

      if (targetDot) {
        const targetId = targetDot.getAttribute("data-dot-id")!;
        const targetSide = targetDot.getAttribute("data-dot-side") as "left" | "right";
        const startId = drawingState.startId;
        const startSide = drawingState.startSide;

        if (targetSide !== startSide) {
          const leftId = startSide === "left" ? startId : targetId;
          const rightId = startSide === "right" ? startId : targetId;
          connectPairs(leftId, rightId);
          playSound("connect");
        } else {
          playSound("disconnect");
        }
      } else {
        // Calculate drag offset to evaluate if they tap-clicked or actually dragged
        const dx =
          e.clientX - (drawingState.startX + boardRef.current.getBoundingClientRect().left);
        const dy = e.clientY - (drawingState.startY + boardRef.current.getBoundingClientRect().top);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 8) {
          // Trigger click fallback tap-selection
          handleTapDot(drawingState.startId, drawingState.startSide);
        } else {
          playSound("disconnect");
        }
      }
      setDrawingState(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingState]);

  // Evaluate matches on submit click
  const handleSubmitGame = () => {
    if (connections.length < pairs.length) {
      toast.warning("Link all items before submitting! 🧩", { duration: 1500 });
      return;
    }

    setHasSubmitted(true);
    setSelectedDot(null);
    setShowAnswers(false); // Do not show answers yet

    // Identify incorrect items to shake them and play failure triggers
    const wrongs: string[] = [];
    connections.forEach((c) => {
      if (c.leftId !== c.rightId) {
        wrongs.push(c.leftId);
      }
    });

    setIncorrectItems(wrongs);

    if (wrongs.length === 0) {
      playSound("complete");
      toast.success("AMAZING! 100% Perfect Score! 🏆🌟", { duration: 2000 });
    } else {
      playSound("error");
      toast.error(
        `Check your matches! ${pairs.length - wrongs.length} / ${pairs.length} correct.`,
        { duration: 2000 }
      );
    }

    // Delay revealing scorecard slightly (200ms) to transition immediately to scorecard without highlighting board answers
    setTimeout(() => {
      setShowScorecard(true);
    }, 200);
  };

  // Save progress and claim XP points
  const handleFinishMission = () => {
    router.push(APP_ROUTES.Activities);
  };

  const getBezierPath = (startX: number, startY: number, endX: number, endY: number) => {
    // Generate curved Bezier paths instead of basic line strokes
    const controlDist = Math.abs(endX - startX) * 0.45;
    return `M ${startX} ${startY} C ${startX + controlDist} ${startY}, ${endX - controlDist} ${endY}, ${endX} ${endY}`;
  };

  const correctCount = connections.filter((c) => c.leftId === c.rightId).length;
  const progressPercent = (connections.length / pairs.length) * 100;
  const scaledXpEarned = Math.round((correctCount / pairs.length) * xpReward);

  // Render game success scorecard screen
  if (showScorecard) {
    const accuracy = Math.round((correctCount / pairs.length) * 100);

    return (
      <div className="h-full bg-background overflow-hidden flex flex-col relative min-h-screen">
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none" />

        <main className="relative z-10 flex-1 px-4 py-6 md:px-8 md:py-8 overflow-hidden flex flex-col min-h-0 justify-center">
          <div className="mx-auto max-w-xl w-full flex flex-col justify-between gap-4 min-h-0">
            <div className="flex items-center justify-between shrink-0 mb-2">
              <Link
                href={APP_ROUTES.Activities}
                className="inline-flex items-center gap-2 text-orange-600 font-bold hover:text-orange-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Activities
              </Link>

              <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border text-xs font-bold text-orange-600 animate-pulse">
                Game Complete!
              </div>
            </div>

            <Card className="border-4 border-orange-500/30 shadow-2xl rounded-[32px] bg-card p-6 md:p-8 text-center flex flex-col justify-center items-center gap-4 my-2 animate-in zoom-in duration-300 relative overflow-hidden">
              <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-orange-500/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-yellow-500/10 blur-2xl pointer-events-none" />

              <div className="mb-2 flex h-24 w-24 items-center justify-center rounded-[32px] bg-orange-500/10 border-4 border-dashed border-orange-500 animate-bounce">
                <Award className="h-12 w-12 text-orange-600" />
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
                {accuracy === 100 ? "Perfect Pairing! 🎉🔗" : "Good Try! Keep Learning! 🧠🌟"}
              </h2>

              <p className="text-muted-foreground text-sm md:text-base max-w-sm leading-relaxed">
                {accuracy === 100
                  ? "Super connection wizard! You matched all pairs correctly and linked everything perfectly!"
                  : "You've successfully finished pairing! Let's check your results and grab your rewards."}
              </p>

              <div className="grid grid-cols-3 gap-3 w-full max-w-md mt-6">
                <div className="bg-orange-500/10 rounded-2xl p-3 border border-orange-500/20 flex flex-col justify-center items-center">
                  <h4 className="text-[10px] font-black uppercase text-orange-600 tracking-wider">
                    Score
                  </h4>
                  <p className="text-xl md:text-2xl font-black text-orange-600 mt-1">
                    {correctCount} / {pairs.length}
                  </p>
                </div>
                <div className="bg-yellow-500/10 rounded-2xl p-3 border border-yellow-500/20 flex flex-col justify-center items-center">
                  <h4 className="text-[10px] font-black uppercase text-yellow-600 tracking-wider">
                    Accuracy
                  </h4>
                  <p className="text-xl md:text-2xl font-black text-yellow-600 mt-1">{accuracy}%</p>
                </div>
                <div className="bg-green-500/10 rounded-2xl p-3 border border-green-500/20 flex flex-col justify-center items-center">
                  <h4 className="text-[10px] font-black uppercase text-green-600 tracking-wider">
                    Reward
                  </h4>
                  <p className="text-xl md:text-2xl font-black text-green-600 mt-1">
                    +{scaledXpEarned} XP
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowAnswers(!showAnswers)}
                variant="ghost"
                className="mt-4 text-orange-600 hover:bg-orange-500/10 font-black rounded-xl text-xs py-2 h-fit"
              >
                {showAnswers ? "Hide Answers 🙈" : "See Answers 🔍"}
              </Button>

              {showAnswers && (
                <div className="mt-4 w-full max-w-md bg-orange-500/[0.02] dark:bg-orange-500/[0.01] rounded-[24px] p-4 text-left border-2 border-dashed border-orange-500/20 animate-in slide-in-from-top-4 duration-300 max-h-[250px] overflow-y-auto pr-1">
                  <h3 className="text-[10px] font-black uppercase text-orange-600 tracking-wider mb-3 select-none text-center">
                    Correct Pairings & Your Results 🧩
                  </h3>
                  <div className="space-y-3">
                    {pairs.map((item) => {
                      // Find what the user matched this left item to
                      const userConnection = connections.find((c) => c.leftId === item.id);
                      const userMatchedRightItem = rightOrder.find(
                        (r) => r.id === userConnection?.rightId
                      );
                      const isUserCorrect = userConnection?.rightId === item.id;

                      return (
                        <div
                          key={`ans-${item.id}`}
                          className="bg-card rounded-xl p-3 border-2 border-border/80 flex flex-col gap-2 shadow-sm"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <span className="font-extrabold text-xs text-foreground/90 whitespace-normal break-words leading-relaxed">
                              {item.leftText}
                            </span>
                            <span className="hidden sm:inline text-muted-foreground/60 text-xs">
                              ➔
                            </span>
                            <span className="font-black text-xs text-emerald-600 whitespace-normal break-words leading-relaxed sm:text-right">
                              {item.rightText}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-border/40 pt-1.5 text-[10px] font-bold">
                            <span className="text-muted-foreground/75">Your Choice:</span>
                            {isUserCorrect ? (
                              <span className="text-emerald-600 flex items-center gap-1">
                                Perfect Match! ✓
                              </span>
                            ) : (
                              <span className="text-rose-500 flex items-center gap-1 whitespace-normal break-words text-right max-w-[200px]">
                                {userMatchedRightItem ? userMatchedRightItem.rightText : "None"} ❌
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-md relative z-10">
                <Button
                  onClick={handleFinishMission}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold py-6 shadow-md transform hover:-translate-y-0.5 active:translate-y-px text-sm"
                >
                  Continue 🎉
                </Button>
                <Button
                  onClick={resetGame}
                  variant="outline"
                  className="flex-1 border-2 border-border hover:bg-muted text-foreground rounded-2xl font-bold py-6 shadow-sm text-sm"
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Start Over
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-hidden flex flex-col relative min-h-screen">
      {/* Inject custom CSS keyframes dynamically for high-fidelity animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.95; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s infinite ease-in-out;
        }
      `}</style>

      <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none" />

      <main className="relative z-10 flex-1 px-4 py-4 md:px-8 md:py-5 overflow-hidden flex flex-col min-h-0">
        <div className="mx-auto max-w-3xl w-full h-full flex flex-col justify-between gap-3 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <Link
              href={APP_ROUTES.Activities}
              className="inline-flex items-center gap-2 text-orange-600 font-bold hover:text-orange-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm shrink-0"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Activities
            </Link>

            <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border text-xs shrink-0 font-bold text-orange-600 flex items-center gap-1">
              <span>
                Links: {connections.length} / {pairs.length}
              </span>
              <HelpCircle
                className="h-3.5 w-3.5 text-orange-400 cursor-pointer"
                onClick={() =>
                  toast.info(
                    "Drag from a dot to connect pairs! Or click a left dot and a right dot! ✨",
                    { duration: 3000 }
                  )
                }
              />
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="space-y-1.5 shrink-0 mt-1">
            <div className="flex items-center justify-between text-xs text-orange-600 font-bold">
              <span>Matching Progress</span>
              <span className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-0.5 shadow-sm border border-border">
                {Math.round(progressPercent)}% Linked
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-2 rounded-full bg-orange-500/10 [&>div]:bg-orange-500 transition-all duration-300"
            />
          </div>

          {/* Core Interactive Board Workspace */}
          <div
            ref={boardRef}
            className="relative flex-1 min-h-[400px] border-4 border-dashed border-orange-500/10 rounded-[32px] bg-orange-500/[0.01] items-center py-6 px-4 select-none touch-none mt-2"
          >
            {/* SVG Connecting Canvas Layer */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full z-20 overflow-visible">
              {/* Dynamic definitions for styling effects */}
              <defs>
                <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Render User connections */}
              {connections.map((c, index) => {
                const start = coords[`left-${c.leftId}`];
                const end = coords[`right-${c.rightId}`];
                if (!start || !end) return null;

                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;
                const isCorrect = c.leftId === c.rightId;

                let strokeColor = connectionColors[index % connectionColors.length];
                let strokeDash = "none";
                let strokeWidth = "6";

                if (hasSubmitted) {
                  if (isCorrect) {
                    strokeColor = "#10b981"; // Vibrant green
                    strokeWidth = "8";
                  } else {
                    strokeColor = "#ef4444"; // Red
                    strokeDash = "8,5";
                    strokeWidth = "5";
                  }
                }

                const d = getBezierPath(start.x, start.y, end.x, end.y);

                return (
                  <g key={`conn-${c.leftId}`}>
                    {/* Shadow overlay line */}
                    <path
                      d={d}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={Number(strokeWidth) + 8}
                      className="opacity-20 blur-[3px] transition-all duration-300"
                    />

                    {/* Main solid SVG cubic curve */}
                    <path
                      d={d}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                      className="transition-all duration-300 animate-pulse-slow"
                    />

                    {/* midpoint badge overlay */}
                    <foreignObject
                      x={midX - 16}
                      y={midY - 16}
                      width={32}
                      height={32}
                      className="overflow-visible"
                    >
                      <div className="w-8 h-8 flex items-center justify-center pointer-events-auto select-none">
                        {!hasSubmitted ? (
                          <button
                            onClick={() => disconnectPair(c.leftId)}
                            className="w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 hover:scale-115 active:scale-90 transition-transform font-black text-sm z-30"
                            title="Delete connection"
                          >
                            ×
                          </button>
                        ) : isCorrect ? (
                          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-bounce font-black text-xs">
                            ✓
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg animate-shake font-black text-xs">
                            ×
                          </div>
                        )}
                      </div>
                    </foreignObject>
                  </g>
                );
              })}

              {/* Dynamic preview line during dragging action */}
              {drawingState && (
                <g>
                  {/* Thick translucent orange dragging outline */}
                  <path
                    d={getBezierPath(
                      drawingState.startX,
                      drawingState.startY,
                      drawingState.currentX,
                      drawingState.currentY
                    )}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="12"
                    className="opacity-20 blur-[2px]"
                  />
                  {/* Dashed primary vector */}
                  <path
                    d={getBezierPath(
                      drawingState.startX,
                      drawingState.startY,
                      drawingState.currentX,
                      drawingState.currentY
                    )}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="5"
                    strokeDasharray="6,4"
                  />
                  {/* Ripple pulse point at cursor position */}
                  <circle
                    cx={drawingState.currentX}
                    cy={drawingState.currentY}
                    r="8"
                    fill="#f97316"
                    className="animate-ping"
                  />
                  <circle
                    cx={drawingState.currentX}
                    cy={drawingState.currentY}
                    r="5"
                    fill="#f97316"
                  />
                </g>
              )}
            </svg>

            {/* Board elements Columns */}
            <div className="grid grid-cols-2 gap-x-8 sm:gap-x-16 md:gap-x-24 lg:gap-x-32 gap-y-6 h-full items-center max-w-3xl mx-auto z-10 relative">
              {/* Left Column Cards */}
              <div className="flex flex-col gap-5 justify-center items-end w-full">
                <p className="text-[10px] font-black uppercase text-orange-600 text-center w-full tracking-widest mb-1 select-none">
                  {leftHeading}
                </p>
                {pairs.map((item) => {
                  const isConnected = connections.some((c) => c.leftId === item.id);
                  const isSelected = selectedDot?.id === item.id && selectedDot?.side === "left";
                  const isWrong = hasSubmitted && incorrectItems.includes(item.id);

                  return (
                    <div
                      key={`left-box-${item.id}`}
                      className="relative flex items-center w-full max-w-[140px] sm:max-w-[180px] md:max-w-[215px]"
                    >
                      {/* Left Button Card */}
                      <button
                        disabled={hasSubmitted}
                        onClick={() => handleTapDot(item.id, "left")}
                        className={`w-full py-4 px-5 rounded-[22px] border-4 text-left font-bold text-xs md:text-sm transition-all duration-300 select-none whitespace-normal break-words leading-relaxed ${
                          hasSubmitted
                            ? isWrong
                              ? "border-red-500 bg-red-500/10 text-red-700 opacity-90 scale-95 animate-shake"
                              : "border-green-500 bg-green-500/10 text-green-700 opacity-60 scale-95"
                            : isSelected
                              ? "border-orange-500 bg-orange-500/10 text-orange-700 scale-102 shadow-md shadow-orange-500/10"
                              : isConnected
                                ? "border-orange-500/40 bg-orange-500/5 text-orange-600 scale-98"
                                : "border-orange-500/20 bg-card text-foreground hover:bg-orange-500/5 hover:-translate-y-0.5 active:translate-y-px active:shadow-none shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 px-1">
                          <span className="flex-1 min-w-0 text-left whitespace-normal break-words leading-relaxed">
                            {item.leftText}
                          </span>
                          {hasSubmitted ? (
                            isWrong ? (
                              <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                            ) : (
                              <CheckCircle2 className="h-4.5 w-4.5 text-green-500 shrink-0" />
                            )
                          ) : isSelected ? (
                            <Sparkles className="h-4 w-4 text-orange-500 shrink-0 animate-pulse" />
                          ) : null}
                        </div>
                      </button>

                      {/* Connection Dot Anchor */}
                      <div
                        id={`dot-left-${item.id}`}
                        data-dot-side="left"
                        data-dot-id={item.id}
                        className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 bg-background z-30 cursor-crosshair transition-all flex items-center justify-center touch-none select-none ${
                          hasSubmitted
                            ? "pointer-events-none opacity-50 border-muted"
                            : isSelected
                              ? "border-orange-500 scale-120 animate-pulse ring-4 ring-orange-500/20"
                              : isConnected
                                ? "border-orange-500 scale-110 shadow-md shadow-orange-500/20"
                                : "border-orange-500/20 hover:border-orange-500/60 hover:scale-110"
                        }`}
                        onPointerDown={(e) => handlePointerDown(e, item.id, "left")}
                      >
                        <div
                          className={`w-2 h-2 rounded-full transition-colors ${
                            hasSubmitted
                              ? isWrong
                                ? "bg-red-500"
                                : "bg-green-500"
                              : isConnected || isSelected
                                ? "bg-orange-500 animate-pulse"
                                : "bg-muted-foreground/30"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column Cards */}
              <div className="flex flex-col gap-5 justify-center items-start w-full">
                <p className="text-[10px] font-black uppercase text-orange-600 text-center w-full tracking-widest mb-1 select-none">
                  {rightHeading}
                </p>
                {rightOrder.map((item) => {
                  const isConnected = connections.some((c) => c.rightId === item.id);
                  const isSelected = selectedDot?.id === item.id && selectedDot?.side === "right";
                  // To check if this particular right item connection is wrong
                  const relevantConn = connections.find((c) => c.rightId === item.id);
                  const isWrong = hasSubmitted && relevantConn && relevantConn.leftId !== item.id;

                  return (
                    <div
                      key={`right-box-${item.id}`}
                      className="relative flex items-center w-full max-w-[140px] sm:max-w-[180px] md:max-w-[215px]"
                    >
                      {/* Connection Dot Anchor */}
                      <div
                        id={`dot-right-${item.id}`}
                        data-dot-side="right"
                        data-dot-id={item.id}
                        className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 bg-background z-30 cursor-crosshair transition-all flex items-center justify-center touch-none select-none ${
                          hasSubmitted
                            ? "pointer-events-none opacity-50 border-muted"
                            : isSelected
                              ? "border-orange-500 scale-120 animate-pulse ring-4 ring-orange-500/20"
                              : isConnected
                                ? "border-orange-500 scale-110 shadow-md shadow-orange-500/20"
                                : "border-orange-500/20 hover:border-orange-500/60 hover:scale-110"
                        }`}
                        onPointerDown={(e) => handlePointerDown(e, item.id, "right")}
                      >
                        <div
                          className={`w-2 h-2 rounded-full transition-colors ${
                            hasSubmitted
                              ? isWrong
                                ? "bg-red-500"
                                : "bg-green-500"
                              : isConnected || isSelected
                                ? "bg-orange-500 animate-pulse"
                                : "bg-muted-foreground/30"
                          }`}
                        />
                      </div>

                      {/* Right Button Card */}
                      <button
                        disabled={hasSubmitted}
                        onClick={() => handleTapDot(item.id, "right")}
                        className={`w-full py-4 px-5 rounded-[22px] border-4 text-right font-bold text-xs md:text-sm transition-all duration-300 select-none whitespace-normal break-words leading-relaxed ${
                          hasSubmitted
                            ? isWrong
                              ? "border-red-500 bg-red-500/10 text-red-700 opacity-90 scale-95 animate-shake"
                              : "border-green-500 bg-green-500/10 text-green-700 opacity-60 scale-95"
                            : isSelected
                              ? "border-orange-500 bg-orange-500/10 text-orange-700 scale-102 shadow-md shadow-orange-500/10"
                              : isConnected
                                ? "border-orange-500/40 bg-orange-500/5 text-orange-600 scale-98"
                                : "border-orange-500/20 bg-card text-foreground hover:bg-orange-500/5 hover:-translate-y-0.5 active:translate-y-px active:shadow-none shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 px-1">
                          {hasSubmitted ? (
                            isWrong ? (
                              <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                            ) : (
                              <CheckCircle2 className="h-4.5 w-4.5 text-green-500 shrink-0" />
                            )
                          ) : isSelected ? (
                            <Sparkles className="h-4 w-4 text-orange-500 shrink-0 animate-pulse" />
                          ) : null}
                          <span className="flex-1 min-w-0 text-right whitespace-normal break-words leading-relaxed">
                            {item.rightText}
                          </span>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center px-2 shrink-0 py-2">
            <Button
              onClick={resetGame}
              variant="ghost"
              className="text-orange-600 hover:bg-orange-500/10 font-bold rounded-full transition-colors"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" /> Reset Links
            </Button>

            <Button
              onClick={handleSubmitGame}
              disabled={connections.length < pairs.length || hasSubmitted}
              className={`font-black px-8 py-5 rounded-[20px] shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                connections.length === pairs.length && !hasSubmitted
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white cursor-pointer hover:shadow-orange-500/20 animate-pulse"
                  : "bg-muted text-muted-foreground cursor-not-allowed shadow-none border-transparent"
              }`}
            >
              Submit Answers 🚀
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
