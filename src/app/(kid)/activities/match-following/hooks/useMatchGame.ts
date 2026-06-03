"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveKidActivityProgress } from "@/lib/services/kid/dashboard.actions";
import { triggerConfettiSideCannons } from "@/components/shared/ui/confetti-side-cannons";
import { getActivityXp } from "@/lib/services/kid/activities/activity.actions";
import { APP_ROUTES } from "@/lib/constants/common";
import { MatchItem, ConnectionState, SelectedDot, DrawingState } from "../types";

interface UseMatchGameProps {
  pairs: MatchItem[];
  matchTitle: string;
}

export function useMatchGame({ pairs, matchTitle }: UseMatchGameProps) {
  const router = useRouter();

  // Lazy initializer — shuffles once on first render. Next.js routing
  // always fully unmounts/remounts this component when pairs changes
  // (different activity route), so no render-time guard is needed.
  const [rightOrder, setRightOrder] = useState<MatchItem[]>(() =>
    [...pairs].sort(() => Math.random() - 0.5)
  );
  const [connections, setConnections] = useState<ConnectionState>({});
  const [selectedDot, setSelectedDot] = useState<SelectedDot | null>(null);
  const [drawingState, setDrawingState] = useState<DrawingState | null>(null);
  const [coords, setCoords] = useState<Record<string, { x: number; y: number }>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [incorrectItems, setIncorrectItems] = useState<string[]>([]);
  const [xpReward, setXpReward] = useState<number>(90);
  const hasClaimed = useRef(false);

  const playSound = useCallback(
    (type: "pop" | "connect" | "disconnect" | "success" | "error" | "complete") => {
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
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
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
          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
          osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
          osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
          osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.3);
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
          const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
          notes.forEach((freq, idx) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.type = "triangle";
            o.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
            o.frequency.exponentialRampToValueAtTime(
              freq * 1.5,
              ctx.currentTime + 0.5 + idx * 0.06
            );
            g.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.06);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5 + idx * 0.06);
            o.start(ctx.currentTime + idx * 0.06);
            o.stop(ctx.currentTime + 0.6 + idx * 0.06);
          });
        }
      } catch (e) {
        console.warn("Web Audio API not allowed or initialized yet", e);
      }
    },
    []
  );

  useEffect(() => {
    getActivityXp("match-following").then(setXpReward).catch(console.error);
  }, []);

  useEffect(() => {
    if (showScorecard && !hasClaimed.current) {
      hasClaimed.current = true;
      const autoClaim = async () => {
        const entries = Object.entries(connections);
        const correctCount = entries.filter(([lId, rId]) => lId === rId).length;
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
            triggerConfettiSideCannons();
            toast.success("Progress Saved! 🎉", {
              description: `+${scaledXp} XP automatically earned!`,
            });
          }
        } catch (err) {
          console.error("Auto-claim error:", err);
        }
      };
      autoClaim();
    }
  }, [showScorecard, connections, pairs.length, xpReward, matchTitle]);

  // Compute dot positions relative to the board container — same as original
  const recalculateCoords = useCallback(
    (boardEl: HTMLDivElement | null) => {
      if (!boardEl) return;
      const boardRect = boardEl.getBoundingClientRect();
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
    },
    [pairs]
  );

  const connectPairs = useCallback((leftId: string, rightId: string) => {
    setConnections((prev) => {
      const next = { ...prev };
      // Remove any other left key pointing to this rightId (1-to-1 rule)
      Object.keys(next).forEach((k) => {
        if (next[k] === rightId) delete next[k];
      });
      next[leftId] = rightId;
      return next;
    });
  }, []);

  const disconnectPair = useCallback(
    (leftId: string) => {
      playSound("disconnect");
      setConnections((prev) => {
        const next = { ...prev };
        delete next[leftId];
        return next;
      });
    },
    [playSound]
  );

  const resetGame = useCallback(() => {
    setRightOrder([...pairs].sort(() => Math.random() - 0.5));
    setConnections({});
    setDrawingState(null);
    setSelectedDot(null);
    setHasSubmitted(false);
    setShowScorecard(false);
    setShowAnswers(false);
    setIncorrectItems([]);
    hasClaimed.current = false;
  }, [pairs]);

  // Reset hasClaimed whenever pairs changes (writing a ref inside an effect is allowed).
  useEffect(() => {
    hasClaimed.current = false;
  }, [pairs]);

  // Tap / click fallback — identical to original
  const handleTapDot = useCallback(
    (id: string, side: "left" | "right") => {
      if (hasSubmitted) return;
      if (!selectedDot) {
        setSelectedDot({ id, side });
        playSound("pop");
      } else {
        if (selectedDot.id === id && selectedDot.side === side) {
          setSelectedDot(null);
          playSound("disconnect");
        } else if (selectedDot.side !== side) {
          const leftId = side === "left" ? id : selectedDot.id;
          const rightId = side === "right" ? id : selectedDot.id;
          connectPairs(leftId, rightId);
          playSound("connect");
          setSelectedDot(null);
        } else {
          setSelectedDot({ id, side });
          playSound("pop");
        }
      }
    },
    [hasSubmitted, selectedDot, connectPairs, playSound]
  );

  const handleSubmitGame = useCallback(() => {
    const activeCount = Object.keys(connections).length;
    if (activeCount < pairs.length) {
      toast.warning("Link all items before submitting! 🧩", { duration: 1500 });
      return;
    }
    setHasSubmitted(true);
    setSelectedDot(null);
    setShowAnswers(false);

    const wrongs: string[] = [];
    Object.entries(connections).forEach(([lId, rId]) => {
      if (lId !== rId) wrongs.push(lId);
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
    setTimeout(() => setShowScorecard(true), 200);
  }, [connections, pairs.length, playSound]);

  const handleFinishMission = useCallback(() => {
    // Clear scorecard BEFORE navigating — Next.js App Router navigation is async,
    // so the component stays mounted briefly after push(). Without this, the
    // scorecard re-renders one more time and appears to "re-open".
    setShowScorecard(false);
    setHasSubmitted(false);
    router.push(APP_ROUTES.Activities);
  }, [router]);

  const toggleShowAnswers = useCallback(() => setShowAnswers((p) => !p), []);

  const activeCount = Object.keys(connections).length;
  const correctCount = Object.entries(connections).filter(([lId, rId]) => lId === rId).length;
  const progressPercent = (activeCount / pairs.length) * 100;
  const scaledXpEarned = Math.round((correctCount / pairs.length) * xpReward);

  return {
    rightOrder,
    connections,
    selectedDot,
    drawingState,
    setDrawingState,
    coords,
    recalculateCoords,
    hasSubmitted,
    showScorecard,
    showAnswers,
    incorrectItems,
    xpReward,
    correctCount,
    activeCount,
    progressPercent,
    scaledXpEarned,
    playSound,
    connectPairs,
    disconnectPair,
    resetGame,
    handleTapDot,
    handleSubmitGame,
    handleFinishMission,
    toggleShowAnswers,
  };
}
