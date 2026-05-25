"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ACTIVITY_TOPICS_PRESETS, ACTIVITY_UI_CONFIGS } from "@/lib/config/activity-topics";
import {
  generateFlashcards,
  generateQuiz,
  generateWordScramble,
  generateMathChallenge,
  generateScienceLab,
  generateLogicPuzzle,
  generateJigsawPuzzle,
  generateMatchPairs,
} from "@/actions/activity.actions";
import { type ActivitySlug } from "@/types/activities.type";

interface ActivityTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  activitySlug: ActivitySlug | null;
}

const ACTIVITY_GENERATORS: Record<
  string,
  (topic: string) => Promise<{ success?: boolean; activityId?: string; error?: string }>
> = {
  flashcards: generateFlashcards,
  quizzes: generateQuiz,
  "word-scrambles": generateWordScramble,
  "math-challenges": generateMathChallenge,
  "science-lab": generateScienceLab,
  "logic-puzzles": generateLogicPuzzle,
  "jigsaw-puzzle": generateJigsawPuzzle,
  "match-following": generateMatchPairs,
};

const getDifficultyColor = (difficulty?: string) => {
  switch (difficulty) {
    case "Easy":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
    case "Medium":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
    case "Hard":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400";
    case "Expert":
      return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400";
    default:
      return "bg-muted text-muted-foreground border-transparent";
  }
};

export default function ActivityTopicModal({
  isOpen,
  onClose,
  activitySlug,
}: ActivityTopicModalProps) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const presets = activitySlug ? ACTIVITY_TOPICS_PRESETS[activitySlug] || [] : [];
  const uiConfig = activitySlug ? ACTIVITY_UI_CONFIGS[activitySlug] : null;

  // Setup rotating loading message interval
  useEffect(() => {
    if (!isGenerating || !uiConfig) return;

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % uiConfig.loadingWording.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [isGenerating, uiConfig]);

  if (!isOpen || !activitySlug || !uiConfig) return null;

  const colorTheme = uiConfig.colorTheme;

  const handleGenerate = async (selectedTopic: string) => {
    const finalTopic = selectedTopic.trim();
    if (!finalTopic) {
      toast.error("Please enter or select a topic first!");
      return;
    }

    setLoadingStep(0);
    setIsGenerating(true);

    try {
      // Special-case: make `jigsaw-puzzle` static and client-only.
      if (activitySlug === "jigsaw-puzzle") {
        const presetsFor = ACTIVITY_TOPICS_PRESETS[activitySlug] || [];
        const preset = presetsFor.find((p) => p.name === selectedTopic);

        // Choose image by difficulty or fallback to default.
        const imageByDifficulty: Record<string, string> = {
          Easy: "/jigsaw-puzzle/metaverse-portrait.webp",
          Medium: "/jigsaw-puzzle/cityscape-of-hong-kong-and-junkboat-at-twilight.webp",
          Hard: "/jigsaw-puzzle/360_F_832252608_Aj6e38MCjkf6XwppkLCRLUkAzbnpbywI.webp",
          Expert: "/jigsaw-puzzle/315751175_6424346414249018_4776111044190949685_n.webp",
        };

        const difficulty = (preset?.difficulty as string) || "Medium";
        const rowsColsByDifficulty: Record<string, { rows: number; columns: number }> = {
          Easy: { rows: 3, columns: 3 },
          Medium: { rows: 5, columns: 5 },
          Hard: { rows: 6, columns: 6 },
          Expert: { rows: 8, columns: 8 },
        };

        const grid = rowsColsByDifficulty[difficulty] || { rows: 5, columns: 5 };

        const content = {
          correctedTopic: finalTopic,
          selectedImage: imageByDifficulty[difficulty] || "/jigsaw-puzzle/metaverse-portrait.webp",
          difficulty: difficulty.toLowerCase(),
          rows: grid.rows,
          columns: grid.columns,
          totalPieces: grid.rows * grid.columns,
          imageInstructions: `Slice the image into a balanced ${grid.rows}x${grid.columns} puzzle for topic ${finalTopic}.`,
          gameplayTips: `Start from corners and group by color for ${finalTopic}.`,
          puzzleStyle: "classic-jigsaw",
          recommendedPieceSize: "92px",
          shufflePieces: true,
          snapSensitivity: "medium",
          previewEnabled: true,
          timerRecommended: false,
          hintsAllowed: true,
        };

        // Encode content into compact base64 to pass via query param
        const toBase64 = (obj: unknown): string => {
          try {
            const str = JSON.stringify(obj);
            return typeof window !== "undefined"
              ? window.btoa(unescape(encodeURIComponent(str)))
              : Buffer.from(str).toString("base64");
          } catch (err) {
            console.error("Failed to encode content:", err);
            return "";
          }
        };

        const encoded = toBase64(content);
        onClose();
        setIsGenerating(false);
        toast.success("Your puzzle is ready locally! 🧩");
        router.push(`/activities/jigsaw-puzzle/play?c=${encodeURIComponent(encoded)}`);
        return;
      }

      // Fallback: call server generator for other activities
      const generator = ACTIVITY_GENERATORS[activitySlug];
      if (!generator) {
        toast.error("No AI generator registered for this activity type.");
        setIsGenerating(false);
        return;
      }

      const result = await generator(finalTopic);
      if (result.error) {
        toast.error("Generation failed", { description: result.error });
        setIsGenerating(false);
      } else if (result.success && result.activityId) {
        toast.success("Your smart activity is ready! 🚀");
        setIsGenerating(false);
        onClose();
        // Route to the new custom generated activity detail interface
        router.push(`/activities/${activitySlug}/${result.activityId}`);
      } else {
        toast.error("Generation failed: No response payload received.");
        setIsGenerating(false);
      }
    } catch (err) {
      console.error("Activity topic generation error:", err);
      toast.error("An unexpected error occurred during generation. Please try again.");
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Backdrop & Modal container */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div
          className={`border-4 border-muted rounded-[28px] bg-card p-6 w-full max-w-xl shadow-2xl relative animate-in zoom-in duration-300 transition-all`}
          style={{ borderColor: `var(--theme-border)` }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div
              className={`inline-flex h-14 w-14 items-center justify-center rounded-[20px] mb-3 ${colorTheme.bg}`}
            >
              <Sparkles className={`w-8 h-8 ${colorTheme.text}`} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {uiConfig.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 px-4 leading-relaxed">
              {uiConfig.subtitle}
            </p>
          </div>

          {/* Preset Suggestions Grid */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Select a Premium Presets Topic
            </label>

            <div className="max-h-55 overflow-y-auto pr-1 py-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleGenerate(preset.name)}
                    className={`
            flex flex-col
            items-start
            gap-3
            p-3
            rounded-2xl
            border
            text-left
            bg-card
            transition-all duration-200
            hover:-translate-y-0.5
            active:translate-y-0
            ${colorTheme.border}
          `}
                  >
                    <div className="flex items-center gap-2 w-full min-w-0">
                      <span className="text-xl shrink-0">{preset.emoji}</span>

                      <span className="font-extrabold text-sm text-foreground truncate">
                        {preset.name}
                      </span>
                    </div>

                    {(preset.category || preset.difficulty) && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {preset.category && (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0.5 px-2 font-bold opacity-75"
                          >
                            {preset.category}
                          </Badge>
                        )}

                        {preset.difficulty && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0.5 px-2 border font-bold ${getDifficultyColor(
                              preset.difficulty
                            )}`}
                          >
                            {preset.difficulty}
                          </Badge>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Topic Input */}
          <div className="pt-2">
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Or Type Your Own Custom Adventure
            </label>
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder={uiConfig.placeholder}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="rounded-2xl border-2 focus-visible:ring-sky-500 h-12 text-sm font-semibold"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleGenerate(topic);
                }}
              />
              <Button
                onClick={() => handleGenerate(topic)}
                className={`${colorTheme.primary} text-white rounded-2xl font-black px-6 h-12 transition-all shrink-0`}
              >
                Go! 🚀
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-lg flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="text-center max-w-md flex flex-col items-center">
            <div className="relative mb-6 h-40 w-40 motion-reduce:animate-none">
              <div className="absolute inset-0 rounded-full border border-sky-500/15 border-dashed" />

              <div className="absolute inset-8 overflow-hidden rounded-full bg-[#39beff] shadow-[0_0_40px_rgba(57,190,255,0.28)]">
                <div className="absolute left-0 top-0 h-full w-1/2 bg-[#2f9fe0]/35" />
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_34%_28%,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.16)_12%,rgba(255,255,255,0)_30%)]" />

                <div className="absolute left-[28%] top-[24%] h-3.5 w-3.5 rounded-full bg-[#2a8ec8]/55" />
                <div className="absolute left-[54%] top-[22%] h-2.5 w-2.5 rounded-full bg-[#2a8ec8]/55" />
                <div className="absolute left-[18%] top-[44%] h-2.5 w-2.5 rounded-full bg-[#2a8ec8]/55" />
                <div className="absolute left-[43%] top-[53%] h-3 w-3 rounded-full bg-[#2a8ec8]/55" />
                <div className="absolute left-[61%] top-[48%] h-4 w-4 rounded-full bg-[#2a8ec8]/55" />

                <div className="absolute left-[38%] top-[46%] h-10.5 w-10.5 rounded-full border-b-8 border-[#1f6f9d]/55 opacity-35" />
                <div className="absolute left-[33%] top-[40%] h-5 w-5 rounded-full bg-[#17658d]/45" />
                <div className="absolute left-[58%] top-[40%] h-5 w-5 rounded-full bg-[#17658d]/45" />
                <div className="absolute left-[42%] top-[58%] h-3.5 w-7 rounded-b-full border-b-4 border-[#17658d]/45 opacity-45" />
                <div className="absolute left-[28%] top-[63%] h-4 w-8 rounded-full bg-[#ff9db3]/45 blur-[1px]" />
                <div className="absolute right-[28%] top-[63%] h-4 w-8 rounded-full bg-[#ff9db3]/45 blur-[1px]" />
              </div>

              <div className="absolute inset-0 animate-[spin_5.8s_linear_infinite] motion-reduce:animate-none">
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                  <div className="text-4xl drop-shadow-sm">🌏</div>
                </div>
              </div>

              <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/80 shadow-[0_0_0_10px_rgba(14,165,233,0.12)]" />
            </div>

            <h3 className="text-3xl font-black text-foreground">GPT-KID Crafting World... 🧙‍♂️</h3>
            <div className="mt-4 px-6 py-3 bg-sky-500/10 text-sky-600 rounded-full font-bold text-sm sm:text-base animate-pulse min-h-12 flex items-center justify-center border border-sky-500/20">
              {uiConfig.loadingWording[loadingStep]}
            </div>

            <p className="text-xs text-muted-foreground mt-5 leading-relaxed px-6">
              Our advanced AI model is researching custom patterns, educational structures, and
              placing everything inside your dashboard profile. This usually takes just a few
              seconds!
            </p>
          </div>
        </div>
      )}
    </>
  );
}
