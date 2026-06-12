"use client";

import { useState, useEffect } from "react";
import { Beaker, CheckCircle2, FlaskConical, ArrowLeft } from "lucide-react";
import { getActivityXp } from "@/lib/services/kid/activities/activity.actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/lib/constants/common";
import { type ScienceLabItem } from "@/types/activities.type";
import VictoryModal from "@/components/shared/VictoryModal";

interface ScienceLabPageProps {
  labTitle?: string;
  experiments?: ScienceLabItem[];
  assignmentId?: string;
}

const defaultExperiments: ScienceLabItem[] = [
  {
    title: "The Floating Egg",
    setup: "What happens when you add lots of salt to a glass of water with an egg in it?",
    options: [
      { label: "The egg sinks faster", correct: false },
      { label: "The egg floats!", correct: true },
    ],
    explanation: "Salt makes the water more dense than the egg, causing it to float up to the top!",
  },
  {
    title: "Volcano Eruption",
    setup: "What do you mix with baking soda to make a fizzy eruption?",
    options: [
      { label: "Vinegar", correct: true },
      { label: "Water", correct: false },
    ],
    explanation:
      "Baking soda and vinegar create a chemical reaction that releases carbon dioxide gas bubbles!",
  },
];

export default function ScienceLabPage({
  labTitle = "Science Lab",
  experiments = defaultExperiments,
  assignmentId,
}: ScienceLabPageProps) {
  const router = useRouter();
  const [currentExp, setCurrentExp] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [xpReward, setXpReward] = useState<number>(160);

  useEffect(() => {
    getActivityXp("science-lab").then(setXpReward);
  }, []);

  const safeExperiments = experiments.length > 0 ? experiments : defaultExperiments;

  const rawExp = safeExperiments[currentExp] || safeExperiments[0];

  const exp = {
    ...rawExp,
    options: rawExp.options.map((opt, index) => ({
      ...opt,
      id: index === 0 ? "A" : "B",
    })),
  };

  const progress = ((currentExp + 1) / safeExperiments.length) * 100;

  const handleNext = () => {
    if (currentExp === safeExperiments.length - 1) {
      setChallengeCompleted(true);
    } else {
      setCurrentExp((prev) => prev + 1);
      setSelected(null);
    }
  };

  const handleFinishMission = () => {
    if (assignmentId) {
      router.push("/dashboard/kid");
    } else {
      router.push(APP_ROUTES.Activities);
    }
  };

  const handleReset = () => {
    setCurrentExp(0);
    setSelected(null);
    setCorrectCount(0);
    setChallengeCompleted(false);
  };

  // Render normal game view; VictoryModal handles completion celebrate state

  return (
    <div className="h-full bg-background overflow-hidden flex flex-col">
      <main className="flex-1 px-4 py-4 md:px-8 md:py-5 overflow-hidden flex flex-col min-h-0">
        <div className="mx-auto max-w-4xl w-full h-full flex flex-col justify-between gap-3 min-h-0">
          <Link
            href={APP_ROUTES.Activities}
            className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-800 hover:-translate-x-1 transition-transform bg-card px-4 py-1.5 rounded-full shadow-sm border border-border w-fit text-sm shrink-0"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Activities
          </Link>

          <div className="space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-xs text-emerald-600 font-bold">
              <span>{labTitle} 🧪</span>
              <span className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-0.5 shadow-sm border border-border">
                <FlaskConical className="h-3.5 w-3.5 text-emerald-500" /> Experiment{" "}
                {currentExp + 1} of {safeExperiments.length}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2 rounded-full bg-emerald-500/10 [&>div]:bg-emerald-500"
            />
          </div>

          <Card className="border-4 border-emerald-500/20 shadow-md rounded-[1.5rem] overflow-hidden bg-card flex-1 flex flex-col min-h-0">
            <div className="bg-emerald-500 p-2.5 flex justify-center shrink-0">
              <div className="bg-white p-2 rounded-full shadow-inner animate-pulse">
                <Beaker
                  className="h-8 w-8 text-emerald-600 animate-bounce"
                  style={{ animationDuration: "3s" }}
                />
              </div>
            </div>
            <CardContent className="p-4 md:p-6 text-center flex-1 flex flex-col justify-center gap-3 min-h-0 overflow-y-auto">
              <h2 className="text-xl md:text-2xl font-black text-foreground shrink-0 animate-in fade-in">
                {exp.title}
              </h2>
              <p className="text-base md:text-lg text-muted-foreground font-medium bg-emerald-500/5 p-4 rounded-xl border-2 border-emerald-500/10 animate-in zoom-in-95">
                {exp.setup}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            {exp.options.map((opt) => {
              const isSelected = selected === opt.id;
              const isCorrect = opt.correct;
              const showSuccess = isSelected && isCorrect;
              const showError = isSelected && !isCorrect;

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    if (!selected) {
                      setSelected(opt.id);
                      if (opt.correct) {
                        setCorrectCount((prev) => prev + 1);
                      }
                    }
                  }}
                  disabled={selected !== null}
                  className={`p-4 md:p-6 rounded-2xl border-4 text-lg md:text-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    showSuccess
                      ? "border-green-500 bg-green-500/10 text-green-600 scale-[1.01]"
                      : showError
                        ? "border-red-500 bg-red-500/10 text-red-600 opacity-50"
                        : "border-emerald-500/20 bg-card text-emerald-600 hover:bg-emerald-500/5 hover:-translate-y-1 hover:shadow-md active:translate-y-0.5 active:shadow-none"
                  }`}
                >
                  <span>{opt.label}</span>
                  {showSuccess && <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="h-20 shrink-0 flex items-center justify-center">
            {selected !== null && (
              <div className="w-full flex items-center gap-3 bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex-1 text-emerald-600 font-bold text-sm md:text-base flex items-start gap-2 min-w-0">
                  <span className="text-2xl shrink-0">🔬</span>
                  <p className="truncate md:whitespace-normal md:line-clamp-2">{exp.explanation}</p>
                </div>
                <Button
                  onClick={handleNext}
                  className="h-10 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-[0_4px_0px_0px_#047857] active:translate-y-1 active:shadow-none transition-all shrink-0"
                >
                  {currentExp === safeExperiments.length - 1 ? "Finish Lab 🔬" : "Next Experiment"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <VictoryModal
        isOpen={challengeCompleted}
        onReplay={handleReset}
        onContinue={handleFinishMission}
        xpEarned={Math.round((xpReward * correctCount) / (safeExperiments.length || 1))}
        activitySlug="science-lab"
        activityTitle="Science Lab"
        score={`${Math.round((correctCount / (safeExperiments.length || 1)) * 100)}%`}
        scoreDescription={`Super lab experiment! You completed "${labTitle}".`}
        rewardsDescription={`${correctCount}/${safeExperiments.length} Correct Experiments`}
        assignmentId={assignmentId}
      />
    </div>
  );
}
