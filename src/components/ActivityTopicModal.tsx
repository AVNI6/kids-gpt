"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Loader2, Rocket } from "lucide-react";
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

            <div className="max-h-[220px] overflow-y-auto pr-1 py-1">
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
            <div className="relative mb-6 h-28 w-28 flex items-center justify-center bg-sky-500/10 rounded-[36px] border-4 border-dashed border-sky-500 animate-pulse">
              <Rocket className="h-14 w-14 text-sky-600 transform -rotate-45 animate-bounce" />
              <Loader2 className="absolute h-24 w-24 text-sky-500/40 animate-spin" />
            </div>

            <h3 className="text-3xl font-black text-foreground">GPT-KID Crafting World... 🧙‍♂️</h3>
            <div className="mt-4 px-6 py-3 bg-sky-500/10 text-sky-600 rounded-full font-bold text-sm sm:text-base animate-pulse min-h-[48px] flex items-center justify-center border border-sky-500/20">
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
