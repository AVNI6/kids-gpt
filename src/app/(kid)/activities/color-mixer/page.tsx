"use client";

import { useState, useEffect } from "react";
import { Palette, ArrowLeft, Award, RotateCcw, Loader2, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/constant/AppRoutes";
import { saveKidActivityProgress } from "@/actions/dashboard.actions";
import { getActivityXp } from "@/actions/activity.actions";
import { toast } from "sonner";

interface MixLevel {
  targetColorName: string;
  targetHex: string;
  requiredColors: string[]; // e.g., ["Red", "Yellow"]
  hint: string;
}

interface ColorMixerPageProps {
  mixerTitle?: string;
  levels?: MixLevel[];
}

const defaultLevels: MixLevel[] = [
  {
    targetColorName: "Orange 🍊",
    targetHex: "bg-orange-500",
    requiredColors: ["Red", "Yellow"],
    hint: "Mix the color of a sweet strawberry (Red) with a bright sunny day (Yellow)!",
  },
  {
    targetColorName: "Green 🌳",
    targetHex: "bg-green-500",
    requiredColors: ["Yellow", "Blue"],
    hint: "Combine a ripe lemon (Yellow) with the deep ocean waves (Blue)!",
  },
  {
    targetColorName: "Purple 🍇",
    targetHex: "bg-purple-600",
    requiredColors: ["Red", "Blue"],
    hint: "Add red fruit punch drops (Red) into cool ocean water (Blue)!",
  },
];

export default function ColorMixerPage({
  mixerTitle = "Color Mixer",
  levels = defaultLevels,
}: ColorMixerPageProps) {
  const router = useRouter();
  const [currentLevel, setCurrentLevel] = useState(0);
  const [addedDrops, setAddedDrops] = useState<string[]>([]);
  const [isMixed, setIsMixed] = useState(false);
  const [mixSuccess, setMixSuccess] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [xpReward, setXpReward] = useState<number>(110);

  useEffect(() => {
    getActivityXp("color-mixer").then(setXpReward);
  }, []);

  const levelInfo = levels[currentLevel] || levels[0];
  const progress = (currentLevel / levels.length) * 100;

  const addDrop = (color: string) => {
    if (isMixed) return;
    setAddedDrops((prev) => [...prev, color]);
  };

  const handleClear = () => {
    setAddedDrops([]);
    setIsMixed(false);
    setMixSuccess(false);
  };

  const handleMix = () => {
    if (addedDrops.length === 0) {
      toast.error("Add some color drops to the flask first!");
      return;
    }

    setIsMixed(true);

    // Check if addedDrops has exactly the required primary colors (any order, duplicates allowed but must contain both and nothing else)
    const uniqueAdded = Array.from(new Set(addedDrops));
    const reqs = levelInfo.requiredColors;

    const containsAllReqs = reqs.every((c) => uniqueAdded.includes(c));
    const hasOnlyReqs = uniqueAdded.every((c) => reqs.includes(c));
    const correctMix = containsAllReqs && hasOnlyReqs;

    if (correctMix) {
      setMixSuccess(true);
      toast.success("Perfect mix! 🎨", {
        description: `You successfully made ${levelInfo.targetColorName}!`,
      });
    } else {
      setMixSuccess(false);
      toast.error("Oops! That didn't make the target color.", {
        description: "Click Clear and read the hint to try again!",
      });
    }
  };

  const handleNextLevel = () => {
    if (currentLevel === levels.length - 1) {
      setGameCompleted(true);
    } else {
      setCurrentLevel((prev) => prev + 1);
      setAddedDrops([]);
      setIsMixed(false);
      setMixSuccess(false);
    }
  };

  const handleFinishMission = async () => {
    setIsSavingProgress(true);
    try {
      const slug = mixerTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const res = await saveKidActivityProgress(
        slug || "color-mixer",
        xpReward,
        `${mixerTitle} 🎨`,
        "100% Correct"
      );

      if (res.success) {
        toast.success("Progress Saved!", {
          description: `+${xpReward} XP earned! Streak updated! 🎉`,
        });
        router.push(APP_ROUTES.Activities);
      } else {
        toast.error("Failed to save progress", {
          description: res.error || "Please try again later.",
        });
      }
    } catch (err) {
      console.error("Error saving color mixer progress:", err);
      toast.error("Error saving progress");
    } finally {
      setIsSavingProgress(false);
    }
  };

  const resetGame = () => {
    setCurrentLevel(0);
    setAddedDrops([]);
    setIsMixed(false);
    setMixSuccess(false);
    setGameCompleted(false);
  };

  // Determine current display color of flask fluid
  const getFluidColorClass = () => {
    if (!isMixed) {
      if (addedDrops.length === 0) return "bg-slate-200 dark:bg-slate-800 opacity-20";
      // If only Red added
      if (addedDrops.every((c) => c === "Red")) return "bg-red-500 animate-pulse";
      // If only Yellow added
      if (addedDrops.every((c) => c === "Yellow")) return "bg-yellow-400 animate-pulse";
      // If only Blue added
      if (addedDrops.every((c) => c === "Blue")) return "bg-blue-500 animate-pulse";
      // Mixed color draft (muddy yellow-orange-blue before mixing)
      return "bg-slate-400 dark:bg-slate-600 animate-pulse";
    }

    if (mixSuccess) {
      if (levelInfo.targetColorName.includes("Orange")) return "bg-orange-500";
      if (levelInfo.targetColorName.includes("Green")) return "bg-green-500";
      if (levelInfo.targetColorName.includes("Purple")) return "bg-purple-600";
    }

    return "bg-slate-600 opacity-80 text-white flex items-center justify-center font-bold text-xs"; // Muddy mix failed
  };

  if (gameCompleted) {
    return (
      <div className="h-full bg-background overflow-hidden flex flex-col relative min-h-screen">
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

        <main className="relative z-10 flex-1 px-4 py-6 md:px-8 md:py-8 overflow-hidden flex flex-col min-h-0 justify-center">
          <div className="mx-auto max-w-xl w-full flex flex-col justify-between gap-4 min-h-0">
            <div className="flex items-center justify-between shrink-0 mb-2">
              <Link
                href={APP_ROUTES.Activities}
                className="inline-flex items-center gap-2 text-purple-600 font-bold hover:text-purple-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Activities
              </Link>

              <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border text-xs font-bold text-purple-600 animate-pulse">
                Mission Complete!
              </div>
            </div>

            <Card className="border-4 border-purple-500/30 shadow-2xl rounded-[32px] bg-card p-6 md:p-8 text-center flex flex-col justify-center items-center gap-4 my-2 animate-in zoom-in duration-300 relative overflow-hidden">
              <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

              <div className="mb-2 flex h-24 w-24 items-center justify-center rounded-[32px] bg-purple-500/10 border-4 border-dashed border-purple-500 animate-bounce">
                <Award className="h-12 w-12 text-purple-600" />
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
                Master Color Scientist! 👩‍🔬🎨
              </h2>

              <p className="text-muted-foreground text-sm md:text-base max-w-sm leading-relaxed">
                Superb color mixing! You solved all color mix formulas successfully and got a
                perfect score.
              </p>

              <div className="grid grid-cols-3 gap-3 w-full max-w-md mt-6">
                <div className="bg-purple-500/10 rounded-2xl p-3 border border-purple-500/20 flex flex-col justify-center items-center">
                  <h4 className="text-[10px] font-black uppercase text-purple-600 tracking-wider">
                    Levels
                  </h4>
                  <p className="text-xl md:text-2xl font-black text-purple-600 mt-1">
                    {levels.length} / {levels.length}
                  </p>
                </div>
                <div className="bg-blue-500/10 rounded-2xl p-3 border border-blue-500/20 flex flex-col justify-center items-center">
                  <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                    Formula Accuracy
                  </h4>
                  <p className="text-xl md:text-2xl font-black text-blue-600 mt-1">100%</p>
                </div>
                <div className="bg-green-500/10 rounded-2xl p-3 border border-green-500/20 flex flex-col justify-center items-center">
                  <h4 className="text-[10px] font-black uppercase text-green-600 tracking-wider">
                    Reward
                  </h4>
                  <p className="text-xl md:text-2xl font-black text-green-600 mt-1">
                    +{xpReward} XP
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-md relative z-10">
                <Button
                  onClick={handleFinishMission}
                  disabled={isSavingProgress}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold py-6 shadow-md transform hover:-translate-y-0.5 active:translate-y-px text-sm"
                >
                  {isSavingProgress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Claim Rewards 🎉"
                  )}
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
      <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

      <main className="relative z-10 flex-1 px-4 py-4 md:px-8 md:py-5 overflow-hidden flex flex-col min-h-0">
        <div className="mx-auto max-w-4xl w-full h-full flex flex-col justify-between gap-3 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <Link
              href={APP_ROUTES.Activities}
              className="inline-flex items-center gap-2 text-purple-600 font-bold hover:text-purple-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm shrink-0"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Activities
            </Link>

            <div className="rounded-full bg-card px-4 py-1.5 shadow-sm border border-border text-xs shrink-0 font-bold text-purple-600 max-w-[200px] truncate">
              Color Lab Level {currentLevel + 1}
            </div>
          </div>

          <div className="space-y-1.5 shrink-0 mt-1">
            <div className="flex items-center justify-between text-xs text-purple-600 font-bold">
              <span>Color Mixer Progress</span>
              <span className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-0.5 shadow-sm border border-border">
                Target: {levelInfo.targetColorName}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2 rounded-full bg-purple-500/10 [&>div]:bg-purple-500"
            />
          </div>

          {/* Mixing Area */}
          <div className="grid md:grid-cols-2 gap-4 flex-1 min-h-0 py-2">
            {/* Target Display and Lab Beaker */}
            <Card className="border-4 border-purple-500/20 shadow-md rounded-[1.5rem] bg-card overflow-hidden flex flex-col min-h-0">
              <div className="bg-purple-500 p-3 text-center shrink-0">
                <h2 className="text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-1">
                  <Palette className="h-4 w-4" /> Target Blend
                </h2>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col items-center justify-center gap-4 min-h-0 overflow-y-auto">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs font-bold text-muted-foreground mb-1">Target Color</p>
                    <div
                      className={`h-16 w-16 rounded-full border-4 border-white shadow-md ${levelInfo.targetHex}`}
                    />
                  </div>
                  <div className="text-2xl font-black">➡</div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-muted-foreground mb-1">Flask Mixture</p>
                    <div
                      className={`h-16 w-16 rounded-full border-4 border-white shadow-md transition-colors duration-500 ${getFluidColorClass()}`}
                    />
                  </div>
                </div>

                {/* Beaker Vector */}
                <div className="relative w-36 h-44 border-4 border-slate-400 dark:border-slate-500 rounded-b-[40px] rounded-t-lg overflow-hidden flex flex-col justify-end bg-background shadow-inner">
                  {/* Flask neck */}
                  <div className="absolute top-0 left-[46px] right-[46px] h-12 border-x-4 border-slate-400 dark:border-slate-500 bg-background z-20" />

                  {/* Fluid liquid */}
                  <div
                    className={`w-full transition-all duration-700 ease-out ${getFluidColorClass()}`}
                    style={{
                      height:
                        addedDrops.length === 0
                          ? "0%"
                          : isMixed
                            ? "80%"
                            : `${Math.min(75, 15 + addedDrops.length * 15)}%`,
                    }}
                  >
                    {/* Bubbles in liquid */}
                    {addedDrops.length > 0 && (
                      <div className="absolute inset-0 flex justify-around items-end pb-4 pointer-events-none">
                        <div
                          className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <div
                          className="w-3 h-3 bg-white/30 rounded-full animate-bounce"
                          style={{ animationDelay: "0.5s" }}
                        />
                        <div
                          className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"
                          style={{ animationDelay: "0.8s" }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="absolute top-14 left-0 right-0 text-center text-[10px] font-black text-slate-400 pointer-events-none select-none">
                    {addedDrops.length === 0
                      ? "EMPTY FLASK"
                      : isMixed
                        ? "MIXED CHEMICALS"
                        : `${addedDrops.length} DROPS ADDED`}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* controls drop rack */}
            <Card className="border-4 border-purple-500/20 shadow-md rounded-[1.5rem] bg-card overflow-hidden flex flex-col min-h-0">
              <div className="bg-purple-600 p-3 text-center shrink-0">
                <h3 className="text-white font-black text-sm uppercase tracking-widest">
                  Primary Pipettes
                </h3>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col justify-between gap-4 min-h-0 overflow-y-auto">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground text-center">
                    Click a Pipette below to add fluid drops to the beaker:
                  </p>

                  {/* Pipettes Row */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => addDrop("Red")}
                      disabled={isMixed}
                      className="p-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-2xl border-b-4 border-red-700 shadow-md font-bold text-xs flex flex-col items-center gap-1 active:translate-y-0.5 active:border-b-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>🔴 Red</span>
                      <span className="text-[9px] opacity-75">Pipette</span>
                    </button>
                    <button
                      onClick={() => addDrop("Yellow")}
                      disabled={isMixed}
                      className="p-3 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-slate-900 rounded-2xl border-b-4 border-yellow-600 shadow-md font-bold text-xs flex flex-col items-center gap-1 active:translate-y-0.5 active:border-b-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>🟡 Yellow</span>
                      <span className="text-[9px] opacity-75">Pipette</span>
                    </button>
                    <button
                      onClick={() => addDrop("Blue")}
                      disabled={isMixed}
                      className="p-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-2xl border-b-4 border-blue-700 shadow-md font-bold text-xs flex flex-col items-center gap-1 active:translate-y-0.5 active:border-b-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>🔵 Blue</span>
                      <span className="text-[9px] opacity-75">Pipette</span>
                    </button>
                  </div>

                  {/* Added drops inventory log */}
                  <div className="bg-slate-500/5 border-2 border-slate-500/10 p-3 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-purple-600 mb-1.5">
                      Drops in beaker:
                    </p>
                    <div className="flex flex-wrap gap-1.5 min-h-[40px] items-center">
                      {addedDrops.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">
                          No drops added yet...
                        </span>
                      ) : (
                        addedDrops.map((drop, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded-full text-xs font-bold text-white border-2 border-white/25 shadow-sm ${
                              drop === "Red"
                                ? "bg-red-500"
                                : drop === "Yellow"
                                  ? "bg-yellow-400 text-slate-900"
                                  : "bg-blue-500"
                            }`}
                          >
                            💧 {drop}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-purple-600 font-bold bg-purple-500/5 border border-purple-500/10 p-3 rounded-xl">
                    💡 Hint: {levelInfo.hint}
                  </p>
                </div>

                {/* Mixing verification controls */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleClear}
                    variant="outline"
                    className="flex-1 rounded-2xl border-2 py-5 font-bold text-xs shrink-0"
                  >
                    Clear Beaker 🧹
                  </Button>
                  {!isMixed ? (
                    <Button
                      onClick={handleMix}
                      disabled={addedDrops.length === 0}
                      className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-5 font-bold shadow-md shadow-purple-600/20 text-xs shrink-0"
                    >
                      Mix Chemicals! 🧪✨
                    </Button>
                  ) : (
                    <Button
                      onClick={mixSuccess ? handleNextLevel : handleClear}
                      className={`flex-[2] text-white rounded-2xl py-5 font-bold text-xs shrink-0 ${
                        mixSuccess
                          ? "bg-green-600 hover:bg-green-700 shadow-green-600/20"
                          : "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                      }`}
                    >
                      {mixSuccess ? (
                        <>
                          Next Level <Sparkles className="ml-1.5 h-4 w-4 text-yellow-400" />
                        </>
                      ) : (
                        "Failed, Try Again 🔄"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
