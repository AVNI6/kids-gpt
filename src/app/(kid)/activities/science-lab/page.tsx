"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, FlaskConical, ArrowLeft } from "lucide-react";
import { getActivityXp } from "@/lib/services/kid/activities/activity.actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ActivityCard, ActivityCardContent } from "@/components/ui/card";
import { APP_ROUTES } from "@/lib/constants/app_routes";
import { type ScienceLabItem } from "@/types/activities.type";
import VictoryModal from "@/components/shared/VictoryModal";
import type { QuizReviewData, ScienceLabReviewItem } from "@/types/activity-review.types";

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
  const resultsRef = useRef<ScienceLabReviewItem[]>([]);
  const gameStartedAtRef = useRef<number>(0);

  const [finalGameStartedAt, setFinalGameStartedAt] = useState<number>(0);
  const [finalReviewItems, setFinalReviewItems] = useState<ScienceLabReviewItem[]>([]);

  useEffect(() => {
    gameStartedAtRef.current = Date.now();
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
      setFinalGameStartedAt(gameStartedAtRef.current);
      setFinalReviewItems(resultsRef.current);
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
    resultsRef.current = [];
    gameStartedAtRef.current = Date.now();
    setFinalGameStartedAt(0);
    setFinalReviewItems([]);
    setCurrentExp(0);
    setSelected(null);
    setCorrectCount(0);
    setChallengeCompleted(false);
  };

  // Render normal game view; VictoryModal handles completion celebrate state

  return (
    <div className="bg-background flex flex-col relative h-full max-h-full overflow-hidden">
      <main className="flex-1 px-4 py-4 md:px-6 flex flex-col min-h-0 overflow-hidden">
        <div className="mx-auto max-w-4xl w-full flex-1 flex flex-col justify-start gap-4 sm:gap-5 min-h-0 overflow-hidden">
          <Link
            href={APP_ROUTES.Activities}
            className="inline-flex items-center gap-1.5 text-emerald-600 font-bold hover:text-emerald-800 hover:-translate-x-1 transition-transform bg-card px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-sm border border-border w-fit text-xs sm:text-sm shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back{" "}
            <span className="hidden sm:inline">to Activities</span>
          </Link>

          <div className="space-y-1 shrink-0">
            <div className="flex items-center justify-between text-xs text-emerald-600 font-bold">
              <span className="truncate max-w-[120px] sm:max-w-none text-[11px] sm:text-xs">
                {labTitle} 🧪
              </span>
              <span className="flex items-center gap-1 rounded-full bg-card px-2 py-0.5 shadow-sm border border-border text-[10px] sm:text-xs">
                <FlaskConical className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500" /> Experiment{" "}
                {currentExp + 1} of {safeExperiments.length}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-1.5 rounded-full bg-emerald-500/10 [&>div]:bg-emerald-500"
            />
          </div>

          <ActivityCard className="border-4 border-emerald-500/20 my-2">
            <ActivityCardContent>
              <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center gap-4 my-auto">
                <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black text-foreground shrink-0 animate-in fade-in">
                  {exp.title}
                </h2>
                <p className="text-xs sm:text-base md:text-lg text-muted-foreground font-medium bg-emerald-500/5 p-3 sm:p-4 rounded-xl border-2 border-emerald-500/10 animate-in zoom-in-95 w-full">
                  {exp.setup}
                </p>
              </div>
            </ActivityCardContent>
          </ActivityCard>

          <div className="grid grid-cols-2 gap-2.5 shrink-0">
            {exp.options.map((opt) => {
              const isSelected = selected === opt.id;
              const isCorrect = opt.correct;
              const showSuccess = isSelected && isCorrect;
              const showError = isSelected && !isCorrect;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (selected === null) {
                      setSelected(opt.id);
                      if (opt.correct) {
                        setCorrectCount((prev) => prev + 1);
                      }
                      resultsRef.current.push({
                        title: exp.title,
                        setup: exp.setup,
                        kid_answer: opt.label,
                        correct_answer: exp.options.find((o) => o.correct)?.label ?? "",
                        is_correct: opt.correct,
                        explanation: exp.explanation,
                      });
                    }
                  }}
                  disabled={selected !== null}
                  className={`p-2.5 sm:p-3 md:p-4 rounded-2xl border-2 text-xs sm:text-base md:text-lg font-bold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 ${
                    showSuccess
                      ? "border-green-500 bg-green-500/10 text-green-600 scale-[1.01]"
                      : showError
                        ? "border-red-500 bg-red-500/10 text-red-600 opacity-50"
                        : "border-emerald-500/20 bg-card text-emerald-600 hover:bg-emerald-500/5 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0.5 active:shadow-none"
                  }`}
                >
                  <span>{opt.label}</span>
                  {showSuccess && (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="min-h-0 mt-2 shrink-0 flex items-center justify-center">
            {selected !== null && (
              <div className="w-full flex items-center gap-2.5 bg-emerald-500/10 p-2.5 rounded-2xl border border-emerald-500/20 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex-1 text-emerald-600 font-bold text-[10px] sm:text-xs md:text-sm flex items-start gap-1.5 min-w-0">
                  <span className="text-lg shrink-0">🔬</span>
                  <p className="line-clamp-2 md:line-clamp-none">{exp.explanation}</p>
                </div>
                <Button
                  onClick={handleNext}
                  className="h-8 px-3 sm:h-9 sm:px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-bold shadow-[0_3px_0px_0px_#047857] active:translate-y-0.5 active:shadow-none transition-all shrink-0"
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
        gameStartedAt={finalGameStartedAt}
        reviewData={
          {
            type: "science-lab",
            title: labTitle,
            items: finalReviewItems,
            total_questions: safeExperiments.length,
            correct_count: correctCount,
          } satisfies QuizReviewData
        }
      />
    </div>
  );
}
