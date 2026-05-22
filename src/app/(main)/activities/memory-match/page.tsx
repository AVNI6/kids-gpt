"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCcw,
  Sparkles,
  ArrowLeft,
  Volume2,
  VolumeX,
  Star,
  Award,
  Trophy,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// --- LEVEL CONFIGURATION ---
interface LevelConfig {
  level: number;
  cardCount: number;
  cols: number;
  timeLimit: number;
  emojiSet: string[];
  title: string;
  bgColor: string;
  cardBg: string;
  borderColors: {
    front: string;
    back: string;
  };
}

const levels: LevelConfig[] = [
  {
    level: 1,
    cardCount: 4,
    cols: 2,
    timeLimit: 20,
    emojiSet: ["🐶", "🐱"],
    title: "Puppies & Kittens",
    bgColor: "from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950",
    cardBg: "from-orange-400 to-amber-500",
    borderColors: { front: "border-orange-600", back: "border-emerald-400" },
  },
  {
    level: 2,
    cardCount: 6,
    cols: 3,
    timeLimit: 25,
    emojiSet: ["🍎", "🍌", "🍇"],
    title: "Fruit Garden",
    bgColor: "from-lime-50 to-emerald-100 dark:from-lime-950 dark:to-emerald-950",
    cardBg: "from-emerald-400 to-green-500",
    borderColors: { front: "border-emerald-600", back: "border-rose-400" },
  },
  {
    level: 3,
    cardCount: 8,
    cols: 4,
    timeLimit: 30,
    emojiSet: ["🚗", "🚀", "🚢", "🚂"],
    title: "Zoom Zoom!",
    bgColor: "from-sky-50 to-indigo-100 dark:from-sky-950 dark:to-indigo-950",
    cardBg: "from-sky-400 to-blue-500",
    borderColors: { front: "border-sky-600", back: "border-yellow-400" },
  },
  {
    level: 4,
    cardCount: 10,
    cols: 5,
    timeLimit: 35,
    emojiSet: ["⚽", "🏀", "🎾", "🏈", "🎳"],
    title: "Sporty Play",
    bgColor: "from-violet-50 to-fuchsia-100 dark:from-violet-950 dark:to-fuchsia-950",
    cardBg: "from-violet-400 to-purple-500",
    borderColors: { front: "border-violet-600", back: "border-cyan-400" },
  },
  {
    level: 5,
    cardCount: 12,
    cols: 4,
    timeLimit: 40,
    emojiSet: ["☀️", "🌙", "☁️", "🌟", "🌈", "⚡"],
    title: "Sky & Space",
    bgColor: "from-cyan-50 to-blue-100 dark:from-cyan-950 dark:to-blue-950",
    cardBg: "from-cyan-400 to-blue-500",
    borderColors: { front: "border-cyan-600", back: "border-amber-400" },
  },
  {
    level: 6,
    cardCount: 14,
    cols: 4,
    timeLimit: 45,
    emojiSet: ["🍕", "🍔", "🍟", "🍩", "🍦", "🍿", "🍫"],
    title: "Yummy Treats",
    bgColor: "from-pink-50 to-rose-100 dark:from-pink-950 dark:to-rose-950",
    cardBg: "from-pink-400 to-rose-500",
    borderColors: { front: "border-pink-600", back: "border-green-400" },
  },
  {
    level: 7,
    cardCount: 16,
    cols: 4,
    timeLimit: 50,
    emojiSet: ["🐙", "🦑", "🦐", "🐠", "🐡", "🦀", "🐬", "🐳"],
    title: "Under the Sea",
    bgColor: "from-teal-50 to-cyan-100 dark:from-teal-950 dark:to-cyan-950",
    cardBg: "from-teal-400 to-cyan-500",
    borderColors: { front: "border-teal-600", back: "border-pink-400" },
  },
  {
    level: 8,
    cardCount: 18,
    cols: 6,
    timeLimit: 60,
    emojiSet: ["👾", "👻", "👽", "🦄", "🐉", "🤖", "🧙", "🧛", "🧚"],
    title: "Magic Monsters",
    bgColor: "from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-950",
    cardBg: "from-purple-400 to-violet-500",
    borderColors: { front: "border-purple-600", back: "border-emerald-400" },
  },
  {
    level: 9,
    cardCount: 20,
    cols: 5,
    timeLimit: 70,
    emojiSet: ["🎸", "🎺", "🥁", "🎹", "🎻", "🎷", "🎤", "🎧", "📻", "🔔"],
    title: "Music Jam",
    bgColor: "from-yellow-50 to-amber-100 dark:from-yellow-950 dark:to-amber-950",
    cardBg: "from-yellow-400 to-amber-500",
    borderColors: { front: "border-yellow-600", back: "border-sky-400" },
  },
  {
    level: 10,
    cardCount: 24,
    cols: 6,
    timeLimit: 85,
    emojiSet: ["👑", "⚔️", "🛡️", "💎", "🔮", "🔑", "🏰", "🌋", "🗺️", "📜", "🎒", "🏹"],
    title: "Epic Adventure",
    bgColor: "from-red-50 to-orange-100 dark:from-red-950 dark:to-orange-950",
    cardBg: "from-red-400 to-orange-500",
    borderColors: { front: "border-red-600", back: "border-yellow-400" },
  },
];

const colClasses: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

interface CardType {
  id: number;
  emoji: string;
  matched: boolean;
}

// --- WEB AUDIO API SYNTHESIZER ---
let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: AudioContext }).webkitAudioContext
    )();
  }
  return audioCtx;
}

function playSound(
  type: "flip" | "match" | "mismatch" | "win" | "lose" | "complete" | "tick",
  muted: boolean
) {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  switch (type) {
    case "flip":
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
      break;

    case "tick":
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;

    case "match":
      // Uplifting arpeggio (C5 then E5)
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.setValueAtTime(0.15, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
      break;

    case "mismatch":
      // Low buzz
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;

    case "win":
      // Triumphant arpeggio
      const winNotes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      winNotes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.connect(g);
        g.connect(ctx.destination);
        const t = now + idx * 0.08;
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        o.start(t);
        o.stop(t + 0.3);
      });
      break;

    case "lose":
      // Sad descending buzz
      const loseNotes = [329.63, 293.66, 261.63, 220.0]; // E4, D4, C4, A3
      loseNotes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sawtooth";
        o.connect(g);
        g.connect(ctx.destination);
        const t = now + idx * 0.12;
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.08, t);
        g.gain.linearRampToValueAtTime(0.001, t + 0.15);
        o.start(t);
        o.stop(t + 0.15);
      });
      break;

    case "complete":
      // Full scale
      const finalNotes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];
      finalNotes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.connect(g);
        g.connect(ctx.destination);
        const t = now + idx * 0.08;
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        o.start(t);
        o.stop(t + 0.45);
      });
      break;
  }
}

// --- FISHER-YATES SHUFFLE HELPER ---
function generateCards(levelIndex: number): CardType[] {
  const config = levels[levelIndex];
  const pairsNeeded = config.cardCount / 2;
  const emojis = config.emojiSet.slice(0, pairsNeeded);
  const paired = [...emojis, ...emojis];

  const cards = paired.map((emoji, index) => ({
    id: index + 1,
    emoji,
    matched: false,
  }));

  // Fisher-Yates Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = cards[i];
    cards[i] = cards[j];
    cards[j] = temp;
  }

  return cards;
}

// --- MAIN PAGE COMPONENT ---
export default function MemoryMatchPage() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [cards, setCards] = useState<CardType[]>(() => generateCards(0));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(() => levels[0].timeLimit);
  const [timerActive, setTimerActive] = useState(true);
  const [muted, setMuted] = useState(false);
  const [gameState, setGameState] = useState<"playing" | "level_clear" | "failed" | "completed">(
    "playing"
  );
  const [countdown, setCountdown] = useState(3);
  const [levelStars, setLevelStars] = useState(3);
  const [totalStars, setTotalStars] = useState(0);

  const levelConfig = levels[levelIndex];

  // Toggle Mute Helper
  const toggleMuted = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    localStorage.setItem("memory_match_muted", String(newMuted));
  };

  // Progress to Next Level or Finish
  const startNextLevel = useCallback(() => {
    const nextIdx = levelIndex + 1;
    if (nextIdx < levels.length) {
      setLevelIndex(nextIdx);
      setCards(generateCards(nextIdx));
      setTimeLeft(levels[nextIdx].timeLimit);
      setFlipped([]);
      setMatches(0);
      setMoves(0);
      setTimerActive(true);
      setGameState("playing");
    } else {
      setGameState("completed");
      playSound("complete", muted);
    }
  }, [levelIndex, muted]);

  // Reset Game to Level 1
  const restartGame = () => {
    setLevelIndex(0);
    setScore(0);
    setTotalStars(0);
    setCards(generateCards(0));
    setFlipped([]);
    setMatches(0);
    setMoves(0);
    setTimeLeft(levels[0].timeLimit);
    setTimerActive(true);
    setGameState("playing");
  };

  // Retry Level (same level)
  const retryLevel = () => {
    setCards(generateCards(levelIndex));
    setFlipped([]);
    setMatches(0);
    setMoves(0);
    setTimeLeft(levelConfig.timeLimit);
    setTimerActive(true);
    setGameState("playing");
  };

  // Level Clear Handler
  const handleLevelComplete = () => {
    setTimerActive(false);

    // Calculate Stars
    const timePercentage = (timeLeft / levelConfig.timeLimit) * 100;
    let starsEarned = 1;
    if (timePercentage >= 55) {
      starsEarned = 3;
    } else if (timePercentage >= 25) {
      starsEarned = 2;
    }

    setLevelStars(starsEarned);
    setTotalStars((s) => s + starsEarned);

    // Time Bonus points
    const timeBonus = timeLeft * 10;
    setScore((s) => s + timeBonus);

    setTimeout(() => {
      setGameState("level_clear");
      setCountdown(3);
      playSound("win", muted);
    }, 600);
  };

  // Main Card Click Handler
  const handleCardClick = (index: number) => {
    if (disabled || flipped.includes(index) || cards[index].matched || gameState !== "playing") {
      return;
    }

    playSound("flip", muted);
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setDisabled(true);
      const [first, second] = newFlipped;

      if (cards[first].emoji === cards[second].emoji) {
        // MATCH FOUND
        setTimeout(() => {
          playSound("match", muted);
          setCards((prev) =>
            prev.map((card, i) => (i === first || i === second ? { ...card, matched: true } : card))
          );
          const nextMatches = matches + 1;
          setMatches(nextMatches);
          setFlipped([]);
          setDisabled(false);
          setScore((s) => s + 100);

          // All matched?
          if (nextMatches === levelConfig.cardCount / 2) {
            handleLevelComplete();
          }
        }, 300);
      } else {
        // MISMATCH
        setTimeout(() => {
          playSound("mismatch", muted);
          setFlipped([]);
          setDisabled(false);
        }, 1000);
      }
    }
  };

  // Load sound setting from localStorage (client only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("memory_match_muted");
      if (savedMute) {
        setTimeout(() => {
          setMuted(savedMute === "true");
        }, 0);
      }
    }
  }, []);

  // Timer Tick Hook
  useEffect(() => {
    if (gameState !== "playing" || !timerActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState("failed");
          setTimerActive(false);
          playSound("lose", muted);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, gameState, muted]);

  // Auto transition for Level Clear countdown
  useEffect(() => {
    if (gameState !== "level_clear") return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setTimeout(() => {
            startNextLevel();
          }, 400);
          return 0;
        }
        playSound("tick", muted);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [gameState, muted, startNextLevel]);

  // Progress Bar Width
  const progressPct = ((levelIndex + 1) / levels.length) * 100;
  const timeBarPct = (timeLeft / levelConfig.timeLimit) * 100;

  // Custom visual scaling based on number of columns
  const getCardGridStyle = () => {
    if (levelConfig.cols <= 2) return "max-w-xs gap-3 md:gap-4";
    if (levelConfig.cols === 3) return "max-w-md gap-3 md:gap-4";
    if (levelConfig.cols === 4) return "max-w-lg gap-2.5 md:gap-3.5";
    if (levelConfig.cols === 5) return "max-w-xl gap-2 md:gap-3";
    return "max-w-2xl gap-2 md:gap-2.5";
  };

  return (
    <div
      className={`h-full bg-gradient-to-b ${levelConfig.bgColor} overflow-hidden flex flex-col transition-colors duration-1000`}
    >
      <CustomStyles />

      <main className="flex-1 px-4 py-4 md:px-8 md:py-6 overflow-hidden flex flex-col items-center min-h-0 relative select-none">
        <div className="w-full max-w-2xl h-full flex flex-col justify-between gap-3 min-h-0">
          {/* HEADER BACK NAVIGATION */}
          <div className="flex justify-between items-center shrink-0">
            <Link
              href="/activities"
              className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-800 dark:hover:text-indigo-300 hover:-translate-x-0.5 transition-transform bg-white/95 dark:bg-zinc-900/95 px-3.5 py-1.5 rounded-full shadow-sm border border-indigo-100 dark:border-zinc-800 text-sm"
            >
              <ArrowLeft className="h-4 w-4" /> Activities
            </Link>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleMuted}
                className="h-8.5 w-8.5 rounded-full border-2 border-indigo-500/20 bg-white/90 hover:bg-white dark:bg-zinc-900/90 shadow-sm"
              >
                {muted ? (
                  <VolumeX className="h-4 w-4 text-rose-500" />
                ) : (
                  <Volume2 className="h-4 w-4 text-emerald-500" />
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={restartGame}
                className="h-8.5 rounded-full border-2 border-indigo-500/20 bg-white/90 hover:bg-white dark:bg-zinc-900/90 shadow-sm text-indigo-600 font-bold px-3 text-xs"
              >
                <RefreshCcw className="mr-1 h-3.5 w-3.5" /> Reset
              </Button>
            </div>
          </div>

          {/* MAIN STATS HEADER */}
          <div className="bg-white/90 dark:bg-zinc-900/90 p-3 rounded-2xl border-4 border-indigo-500/20 shadow-md flex flex-col gap-2 shrink-0">
            {/* Level and Stars */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-extrabold shadow-sm text-sm">
                  {levelConfig.level}
                </div>
                <div>
                  <h1 className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 leading-tight">
                    {levelConfig.title}
                  </h1>
                  <span className="text-[10px] md:text-xs text-indigo-500 dark:text-indigo-400 font-extrabold uppercase tracking-wider">
                    Level {levelConfig.level} of 10
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="text-slate-800 dark:text-slate-100 font-extrabold text-sm md:text-base">
                  Score:{" "}
                  <span className="text-indigo-600 dark:text-indigo-400 font-black">{score}</span>
                </div>
                <div className="flex items-center gap-0.5 text-amber-500 text-xs">
                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                  <span className="font-extrabold">{totalStars} Stars</span>
                </div>
              </div>
            </div>

            {/* PROGRESS VISUAL BAR */}
            <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-slate-200/50 dark:border-zinc-700/50">
              <div
                className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* TIMER BAR */}
            <div className="flex items-center gap-2">
              <Clock
                className={`h-4.5 w-4.5 shrink-0 ${
                  timeLeft <= 5
                    ? "text-rose-500 animate-bounce"
                    : "text-indigo-500 dark:text-indigo-400"
                }`}
              />
              <div className="flex-1 bg-slate-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden border border-slate-200/50 dark:border-zinc-700/50 relative">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                    timeBarPct > 50
                      ? "bg-emerald-400"
                      : timeBarPct > 20
                        ? "bg-amber-400"
                        : "bg-rose-500 animate-pulse-fast"
                  }`}
                  style={{ width: `${timeBarPct}%` }}
                />
              </div>
              <div
                className={`text-xs font-black min-w-[28px] text-right ${
                  timeLeft <= 5
                    ? "text-rose-500 scale-110 font-black"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {timeLeft}s
              </div>
            </div>

            {/* MOVES AND MATCHES */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-100 dark:border-zinc-800">
              <div>
                Matches:{" "}
                <span className="text-emerald-500 dark:text-emerald-400 font-extrabold">
                  {matches} / {levelConfig.cardCount / 2}
                </span>
              </div>
              <div>
                Moves:{" "}
                <span className="text-slate-700 dark:text-slate-200 font-extrabold">{moves}</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC CARD GRID */}
          <div className="flex-1 min-h-0 flex items-center justify-center py-4">
            <div
              className={`grid ${colClasses[levelConfig.cols]} ${getCardGridStyle()} w-full transition-all duration-300`}
            >
              {cards.map((card, i) => {
                const isFlipped = flipped.includes(i) || card.matched;
                return (
                  <Card
                    key={card.id}
                    card={card}
                    isFlipped={isFlipped}
                    levelConfig={levelConfig}
                    disabled={disabled}
                    onClick={() => handleCardClick(i)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* --- LEVEL CLEAR OVERLAY --- */}
        {gameState === "level_clear" && (
          <div className="absolute inset-0 bg-white/80 dark:bg-black/85 backdrop-blur-md flex items-center justify-center z-40 p-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white dark:bg-zinc-900 border-4 border-indigo-500 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden animate-bounce-slow">
              <div className="absolute -top-12 -left-12 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl" />
              <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-pink-500/10 rounded-full blur-xl" />

              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-md mb-4 rotate-12">
                <Award className="h-9 w-9" />
              </div>

              <h2 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-1">
                Super Job! 🎉
              </h2>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-5">
                Level {levelConfig.level} Completed!
              </p>

              {/* Stars Earned */}
              <div className="flex justify-center gap-1.5 mb-6 text-amber-500">
                {[1, 2, 3].map((starIndex) => {
                  const filled = starIndex <= levelStars;
                  return (
                    <Star
                      key={starIndex}
                      className={`h-9 w-9 ${
                        filled
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 dark:text-zinc-700"
                      } transform transition-all duration-500 hover:scale-110`}
                    />
                  );
                })}
              </div>

              {/* Points Summary */}
              <div className="bg-slate-50 dark:bg-zinc-800/80 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800 text-sm font-bold mb-6 flex flex-col gap-2.5 text-left">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>Match Points:</span>
                  <span className="font-extrabold text-indigo-500">
                    +{(levelConfig.cardCount / 2) * 100}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>Time Bonus ({timeLeft}s):</span>
                  <span className="font-extrabold text-emerald-500">+{timeLeft * 10}</span>
                </div>
                <div className="h-px bg-slate-200 dark:bg-zinc-700 my-1" />
                <div className="flex justify-between items-center text-slate-800 dark:text-slate-100 text-base">
                  <span>Total Score:</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400">{score}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="text-xs font-black text-indigo-500 uppercase tracking-widest animate-pulse">
                  Next level starting in {countdown}...
                </div>
                <Button
                  onClick={startNextLevel}
                  className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white rounded-full font-bold h-11 shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                  Go Now <ArrowRight className="h-4.5 w-4.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* --- LEVEL FAILED / TIME'S UP OVERLAY --- */}
        {gameState === "failed" && (
          <div className="absolute inset-0 bg-rose-950/70 dark:bg-black/90 backdrop-blur-md flex items-center justify-center z-40 p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 border-4 border-rose-500 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950 rounded-full mx-auto flex items-center justify-center mb-4">
                <AlertCircle className="h-9 w-9 text-rose-500 animate-bounce" />
              </div>

              <h2 className="text-2xl font-black text-rose-600 mb-2">Time&apos;s Up! ⏰</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">
                Don&apos;t worry! You can try again. You&apos;ve got this!
              </p>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={retryLevel}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold h-11 shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                >
                  <RefreshCcw className="h-4.5 w-4.5" /> Try Level Again
                </Button>
                <Button
                  variant="outline"
                  onClick={restartGame}
                  className="w-full rounded-full font-bold h-11 border-2 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 active:scale-98 transition-all"
                >
                  Restart from Level 1
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* --- CONGRATULATIONS OVERLAY (GAME CLEAR) --- */}
        {gameState === "completed" && (
          <div className="absolute inset-0 bg-indigo-950/80 dark:bg-black/95 backdrop-blur-md flex items-center justify-center z-40 p-4 animate-in fade-in duration-300">
            <Confetti />
            <div className="bg-white dark:bg-zinc-900 border-4 border-amber-400 rounded-3xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden animate-float">
              <div className="absolute -top-12 -left-12 w-28 h-28 bg-amber-500/10 rounded-full blur-xl" />
              <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl" />

              <div className="w-18 h-18 bg-gradient-to-tr from-amber-400 via-orange-400 to-yellow-300 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg mb-4 rotate-6">
                <Trophy className="h-10 w-10 text-white" />
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-amber-500 mb-1 flex items-center justify-center gap-1.5">
                <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
                CONGRATULATIONS!
                <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
              </h2>
              <p className="text-sm md:text-base font-extrabold text-indigo-600 dark:text-indigo-400 mb-5">
                You Completed All 10 Levels!
              </p>

              {/* Total Stars Summary */}
              <div className="flex justify-center items-center gap-1 text-amber-500 mb-6 bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 rounded-full w-fit mx-auto shadow-inner">
                <Star className="h-5.5 w-5.5 fill-amber-400 text-amber-400 animate-spin-slow" />
                <span className="text-base font-black tracking-wide text-amber-600 dark:text-amber-400">
                  {totalStars} / 30 Stars Earned
                </span>
              </div>

              {/* Total Score Details */}
              <div className="bg-slate-50 dark:bg-zinc-800/80 rounded-2xl p-5 border border-slate-100 dark:border-zinc-800 text-sm font-bold mb-6 text-left max-w-xs mx-auto">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 mb-2">
                  <span>Levels Completed:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                    10 / 10
                  </span>
                </div>
                <div className="h-px bg-slate-200 dark:bg-zinc-700 my-2.5" />
                <div className="flex justify-between items-center text-slate-800 dark:text-slate-100 text-lg">
                  <span>Final Score:</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400 text-2xl">
                    {score}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={restartGame}
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold h-11 px-6 shadow-md flex-1 flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                >
                  <RefreshCcw className="h-4.5 w-4.5" /> Play Again
                </Button>
                <Link href="/activities" className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full rounded-full font-bold h-11 border-2 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 active:scale-98 transition-all"
                  >
                    Activities Hub
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// --- CARD COMPONENT ---
interface CardProps {
  card: CardType;
  isFlipped: boolean;
  levelConfig: LevelConfig;
  disabled: boolean;
  onClick: () => void;
}

const Card = ({ card, isFlipped, levelConfig, disabled, onClick }: CardProps) => {
  // Return different sizes depending on cardCount/cols to fit screen height nicely
  const getCardSizeClass = () => {
    if (levelConfig.cardCount <= 4) {
      return "aspect-square w-full select-none cursor-pointer max-w-[120px] md:max-w-[160px]";
    }
    if (levelConfig.cardCount <= 8) {
      return "aspect-square w-full select-none cursor-pointer max-w-[95px] md:max-w-[130px]";
    }
    if (levelConfig.cardCount <= 12) {
      return "aspect-square w-full select-none cursor-pointer max-w-[80px] md:max-w-[110px]";
    }
    if (levelConfig.cardCount <= 18) {
      return "aspect-square w-full select-none cursor-pointer max-w-[65px] md:max-w-[95px]";
    }
    return "aspect-square w-full select-none cursor-pointer max-w-[55px] md:max-w-[80px]";
  };

  const getEmojiClass = () => {
    if (levelConfig.cardCount <= 6) return "text-4xl md:text-5xl lg:text-6xl";
    if (levelConfig.cardCount <= 12) return "text-3xl md:text-4xl lg:text-5xl";
    if (levelConfig.cardCount <= 18) return "text-2xl md:text-3.5xl lg:text-4.5xl";
    return "text-xl md:text-3xl lg:text-4xl";
  };

  return (
    <button
      disabled={disabled || isFlipped}
      onClick={onClick}
      className={`relative focus:outline-none group ${getCardSizeClass()} justify-self-center`}
    >
      <div
        className="w-full h-full duration-500 ease-out transform-gpu"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* CARD FRONT (COVER) */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl border-4 ${
            levelConfig.borderColors.front
          } bg-gradient-to-br ${
            levelConfig.cardBg
          } shadow-md group-hover:scale-105 group-hover:brightness-105 active:scale-95 transition-all flex flex-col items-center justify-center text-white`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <span className="text-xl md:text-3xl drop-shadow-md select-none">❓</span>
        </div>

        {/* CARD BACK (REVEALED EMOJI) */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl border-4 ${
            card.matched
              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
              : levelConfig.borderColors.back
          } bg-white dark:bg-zinc-900 shadow-inner flex items-center justify-center`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <span
            className={`${getEmojiClass()} select-none drop-shadow-sm filter transition-transform duration-300 ${
              card.matched ? "scale-115 animate-bounce-slow" : "scale-110"
            }`}
          >
            {card.emoji}
          </span>
        </div>
      </div>
    </button>
  );
};

// --- CUSTOM INLINE STYLES FOR CONFETTI AND FLOATING EFFECTS ---
const CustomStyles = () => (
  <style
    dangerouslySetInnerHTML={{
      __html: `
    @keyframes fall {
      0% {
        transform: translateY(-20px) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-8px) rotate(2deg); }
    }
    @keyframes bounce-slow {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    @keyframes pulse-fast {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(0.97); }
    }
    .animate-fall {
      animation: fall linear infinite;
    }
    .animate-float {
      animation: float 4s ease-in-out infinite;
    }
    .animate-bounce-slow {
      animation: bounce-slow 2.5s ease-in-out infinite;
    }
    .animate-pulse-fast {
      animation: pulse-fast 1s ease-in-out infinite;
    }
    .animate-spin-slow {
      animation: spin 6s linear infinite;
    }
    .backface-hidden {
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
  `,
    }}
  />
);

// --- CONFETTI PARTICLE SYSTEM ---
const Confetti = () => {
  const [particles] = useState<
    {
      left: number;
      delay: number;
      duration: number;
      size: number;
      color: string;
      rotation: number;
    }[]
  >(() => {
    const colors = [
      "bg-red-400",
      "bg-yellow-400",
      "bg-blue-400",
      "bg-green-400",
      "bg-pink-400",
      "bg-purple-400",
      "bg-orange-400",
      "bg-indigo-400",
      "bg-teal-400",
    ];
    const generated = Array.from({ length: 60 }).map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 2.5 + Math.random() * 3.5,
      size: 6 + Math.random() * 14,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
    }));
    return generated;
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p, i) => (
        <div
          key={i}
          className={`absolute rounded-sm opacity-90 animate-fall ${p.color}`}
          style={{
            left: `${p.left}%`,
            top: `-20px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};
