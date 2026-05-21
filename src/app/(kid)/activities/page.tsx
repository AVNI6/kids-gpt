"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, Timer, Zap, X, Sparkles, Loader2, Rocket } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { kidActivities, activityButtonStyles, activityColorStyles } from "@/lib/kid-activities";
import {
  generateFlashcards,
  generateQuiz,
  generateWordScramble,
  generateMathChallenge,
  generateScienceLab,
  generateLogicPuzzle,
  generateColorMixer,
  generateMatchPairs,
  getActivityXpSettings,
} from "@/actions/activity.actions";
import { type ActivitySlug } from "@/types/activities.type";

const LOADING_MESSAGES = [
  "🚀 Prepping rocket thrusters...",
  "🧠 Gathering kid-friendly knowledge...",
  "✨ Formatting awesome challenges...",
  "🦖 Researching mind-blowing facts...",
  "🎨 Drawing gorgeous illustrations...",
  "🌈 Almost ready for blast off...",
];

const PRESET_TOPICS = [
  { emoji: "🌌", name: "Space & Planets" },
  { emoji: "🦖", name: "Dinosaurs & Fossils" },
  { emoji: "🦈", name: "Deep Ocean Life" },
  { emoji: "🤖", name: "Robots & Future AI" },
  { emoji: "🌋", name: "Volcanoes & Earthquakes" },
  { emoji: "🦁", name: "African Safari Animals" },
];

export default function ActivitiesPage() {
  const router = useRouter();
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [activeActivitySlug, setActiveActivitySlug] = useState<ActivitySlug | null>(null);
  const [xpSettings, setXpSettings] = useState<Record<string, number>>({});

  useEffect(() => {
    getActivityXpSettings().then((data) => {
      setXpSettings(data);
    });
  }, []);

  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleStartActivity = (slug: ActivitySlug, href: string) => {
    const isAiPowered =
      slug === "flashcards" ||
      slug === "quizzes" ||
      slug === "word-scrambles" ||
      slug === "math-challenges" ||
      slug === "science-lab" ||
      slug === "logic-puzzles" ||
      slug === "color-mixer" ||
      slug === "match-following";

    if (isAiPowered) {
      setActiveActivitySlug(slug);
      setShowTopicModal(true);
    } else {
      router.push(href);
    }
  };

  const handleGenerate = async (selectedTopic: string) => {
    const finalTopic = selectedTopic.trim();
    if (!finalTopic) {
      toast.error("Please enter or select a topic first!");
      return;
    }

    setLoadingStep(0);
    setIsGenerating(true);
    setShowTopicModal(false);

    try {
      if (activeActivitySlug === "flashcards") {
        const result = await generateFlashcards(finalTopic);
        if (result.error) {
          toast.error("Generation failed", { description: result.error });
          setIsGenerating(false);
        } else if (result.success && result.activityId) {
          toast.success("Flashcards ready! 🚀");
          router.push(`/activities/flashcards/${result.activityId}`);
        }
      } else if (activeActivitySlug === "quizzes") {
        const result = await generateQuiz(finalTopic);
        if (result.error) {
          toast.error("Generation failed", { description: result.error });
          setIsGenerating(false);
        } else if (result.success && result.activityId) {
          toast.success("Quiz ready! 🚀");
          router.push(`/activities/quizzes/${result.activityId}`);
        }
      } else if (activeActivitySlug === "word-scrambles") {
        const result = await generateWordScramble(finalTopic);
        if (result.error) {
          toast.error("Generation failed", { description: result.error });
          setIsGenerating(false);
        } else if (result.success && result.activityId) {
          toast.success("Word Scramble ready! 🚀");
          router.push(`/activities/word-scrambles/${result.activityId}`);
        }
      } else if (activeActivitySlug === "math-challenges") {
        const result = await generateMathChallenge(finalTopic);
        if (result.error) {
          toast.error("Generation failed", { description: result.error });
          setIsGenerating(false);
        } else if (result.success && result.activityId) {
          toast.success("Math Challenge ready! 🚀");
          router.push(`/activities/math-challenges/${result.activityId}`);
        }
      } else if (activeActivitySlug === "science-lab") {
        const result = await generateScienceLab(finalTopic);
        if (result.error) {
          toast.error("Generation failed", { description: result.error });
          setIsGenerating(false);
        } else if (result.success && result.activityId) {
          toast.success("Science Lab ready! 🚀");
          router.push(`/activities/science-lab/${result.activityId}`);
        }
      } else if (activeActivitySlug === "logic-puzzles") {
        const result = await generateLogicPuzzle(finalTopic);
        if (result.error) {
          toast.error("Generation failed", { description: result.error });
          setIsGenerating(false);
        } else if (result.success && result.activityId) {
          toast.success("Logic Puzzles ready! 🚀");
          router.push(`/activities/logic-puzzles/${result.activityId}`);
        }
      } else if (activeActivitySlug === "color-mixer") {
        const result = await generateColorMixer(finalTopic);
        if (result.error) {
          toast.error("Generation failed", { description: result.error });
          setIsGenerating(false);
        } else if (result.success && result.activityId) {
          toast.success("Color Mixer ready! 🚀");
          router.push(`/activities/color-mixer/${result.activityId}`);
        }
      } else if (activeActivitySlug === "match-following") {
        const result = await generateMatchPairs(finalTopic);
        if (result.error) {
          toast.error("Generation failed", { description: result.error });
          setIsGenerating(false);
        } else if (result.success && result.activityId) {
          toast.success("Match Pairs ready! 🚀");
          router.push(`/activities/match-following/${result.activityId}`);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during generation. Please try again.");
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-8 relative">
      <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-green-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Learning Activities 🎮
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Pick a fun educational challenge to level up your brain!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {kidActivities.map((activity) => {
            const Icon = activity.icon;
            const isAiPowered =
              activity.slug === "flashcards" ||
              activity.slug === "quizzes" ||
              activity.slug === "word-scrambles" ||
              activity.slug === "math-challenges" ||
              activity.slug === "science-lab" ||
              activity.slug === "logic-puzzles" ||
              activity.slug === "color-mixer" ||
              activity.slug === "match-following";

            return (
              <Card
                key={activity.id}
                className="border-2 border-border shadow-sm hover:shadow-xl hover:border-sky-500/50 transition-all duration-300 bg-card text-foreground flex flex-col h-full rounded-[24px] overflow-visible relative"
              >
                {/* Premium Dynamic XP Badge */}
                <div className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white font-black text-xs px-3.5 py-1.5 rounded-2xl shadow-md border-2 border-card z-20 hover:scale-105 transition-transform duration-200 cursor-default select-none animate-pulse">
                  +{xpSettings[activity.slug] || 150} XP
                </div>

                <CardContent className="p-6 flex flex-col h-full justify-between">
                  <div>
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-200 ${
                        activityColorStyles[activity.color]
                      }`}
                    >
                      <Icon className="w-8 h-8" />
                    </div>

                    <h3 className="text-2xl font-black tracking-tight mb-2 text-foreground">
                      {activity.title}
                    </h3>

                    <p className="mb-6 text-muted-foreground leading-relaxed">
                      {activity.description}
                    </p>
                  </div>

                  <div className="flex items-end justify-between mt-6">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {isAiPowered && (
                          <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold">
                            ✨ AI Powered
                          </Badge>
                        )}
                        {activity.badge && (
                          <Badge variant="secondary" className="font-bold">
                            {activity.badge}
                          </Badge>
                        )}
                      </div>

                      {activity.duration && (
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-1">
                          <Timer className="w-4 h-4" />
                          {activity.duration}
                        </div>
                      )}

                      {activity.stars && (
                        <div className="flex gap-1 mb-1">
                          {Array.from({ length: activity.stars }).map((_, index) => (
                            <Star key={index} className="w-4 h-4 fill-sky-500 text-sky-500" />
                          ))}
                        </div>
                      )}

                      {activity.users && (
                        <div className="flex -space-x-2 mt-1">
                          {activity.users.map((user) => (
                            <div
                              key={user}
                              className="w-8 h-8 rounded-full border-2 border-card bg-muted text-xs font-black flex items-center justify-center"
                            >
                              {user}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleStartActivity(activity.slug, activity.href)}
                      className={`${activityButtonStyles[activity.color]} rounded-[16px] py-6 px-6 shadow-md hover:shadow-lg font-bold text-white transition-all`}
                    >
                      Start Activity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {showTopicModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="border-4 border-sky-500 rounded-[28px] bg-card p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in duration-300">
            <button
              onClick={() => {
                setShowTopicModal(false);
                setActiveActivitySlug(null);
              }}
              className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-[20px] bg-sky-500/10 mb-3">
                <Sparkles className="w-8 h-8 text-sky-600" />
              </div>
              <h2 className="text-2xl font-black text-foreground">
                {activeActivitySlug === "quizzes"
                  ? "Create Quiz! 🧠"
                  : activeActivitySlug === "word-scrambles"
                    ? "Create Word Scramble! 🔠"
                    : activeActivitySlug === "math-challenges"
                      ? "Create Math Challenge! 🧮"
                      : activeActivitySlug === "science-lab"
                        ? "Create Science Lab! 🧪"
                        : activeActivitySlug === "logic-puzzles"
                          ? "Create Logic Puzzle! 🧩"
                          : activeActivitySlug === "color-mixer"
                            ? "Create Color Mixer! 🎨"
                            : activeActivitySlug === "match-following"
                              ? "Create Match Pairs! 🔗"
                              : "Create Flashcards! 📚"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {activeActivitySlug === "quizzes"
                  ? "Choose a preset topic or write your own to generate a custom quiz!"
                  : activeActivitySlug === "word-scrambles"
                    ? "Choose a preset topic or write your own to generate a custom scramble!"
                    : activeActivitySlug === "math-challenges"
                      ? "Choose a preset topic or write your own to generate a custom math challenge!"
                      : activeActivitySlug === "science-lab"
                        ? "Choose a preset topic or write your own to generate custom experiments!"
                        : activeActivitySlug === "logic-puzzles"
                          ? "Choose a preset topic or write your own to generate custom puzzles!"
                          : activeActivitySlug === "color-mixer"
                            ? "Choose a preset topic or write your own to generate custom mixing levels!"
                            : activeActivitySlug === "match-following"
                              ? "Choose a preset topic or write your own to generate custom matching pairs!"
                              : "Choose a preset topic or write your own to generate a custom deck!"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {PRESET_TOPICS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleGenerate(preset.name)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-sky-500/5 hover:border-sky-500/30 transition-all text-left text-xs font-bold"
                >
                  <span className="text-lg">{preset.emoji}</span>
                  <span className="truncate text-foreground">{preset.name}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-2 border-t border-border">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Or Type a Custom Topic
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="e.g., Magic Wizards 🧙‍♂️"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="rounded-xl border-2 focus-visible:ring-sky-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGenerate(topic);
                  }}
                />
                <Button
                  onClick={() => handleGenerate(topic)}
                  className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold px-4"
                >
                  Go!
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-lg flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="text-center max-w-sm flex flex-col items-center">
            <div className="relative mb-6 h-28 w-28 flex items-center justify-center bg-sky-500/10 rounded-[36px] border-4 border-dashed border-sky-500 animate-pulse">
              <Rocket className="h-14 w-14 text-sky-600 transform -rotate-45 animate-bounce" />
              <Loader2 className="absolute h-24 w-24 text-sky-500/40 animate-spin" />
            </div>

            <h3 className="text-2xl font-black text-foreground">AI Wizard at Work! 🧙‍♂️</h3>
            <div className="mt-3 px-4 py-2 bg-sky-500/10 text-sky-600 rounded-full font-bold text-sm animate-pulse min-h-[36px] flex items-center justify-center">
              {LOADING_MESSAGES[loadingStep]}
            </div>

            <p className="text-xs text-muted-foreground mt-4 leading-relaxed px-4">
              Our advanced AI model is gathering facts, structuring dynamic games, and securing
              everything inside your dashboard profile.
            </p>
          </div>
        </div>
      )}

      <div className="fixed bottom-8 right-8 group z-50">
        <Button
          size="icon"
          className="w-16 h-16 rounded-full bg-sky-600 hover:bg-sky-700 shadow-2xl"
        >
          <Zap className="w-8 h-8 group-hover:rotate-12 transition-transform" />
        </Button>

        <div className="absolute right-20 top-3 bg-sky-600 text-white px-4 py-2 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Quick Challenge!
        </div>
      </div>
    </main>
  );
}
