"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, AlertCircle, ArrowLeft, Brain } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

// Import actions
import {
  startAssignmentActivity,
  updateAssignmentSubmissionUrl,
} from "@/lib/services/kid/classroom.actions";
import { generateQuiz } from "@/lib/services/kid/activities/quiz.actions";
import { generateFlashcards } from "@/lib/services/kid/activities/flashcards.actions";
import { generateMathChallenge } from "@/lib/services/kid/activities/math-challenge.actions";
import { generateWordScramble } from "@/lib/services/kid/activities/word-scramble.actions";

function mapWordScrambleDifficulty(difficultyStr: string): "easy" | "medium" | "hard" {
  const normalized = (difficultyStr || "").toLowerCase();
  if (
    normalized.includes("grade 1") ||
    normalized.includes("grade 2") ||
    normalized.includes("easy")
  ) {
    return "easy";
  }
  if (
    normalized.includes("grade 6") ||
    normalized.includes("grade 7") ||
    normalized.includes("grade 8") ||
    normalized.includes("hard")
  ) {
    return "hard";
  }
  return "medium"; // default
}

export default function AssignmentLauncherPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
          <div
            className="absolute top-10 left-10 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none animate-pulse"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none animate-pulse"
            style={{ animationDuration: "6s" }}
          />
          <main className="relative z-10 w-full max-w-md">
            <Card className="border border-white/10 shadow-2xl rounded-3xl bg-slate-900/60 backdrop-blur-xl p-8 text-center text-white border-none">
              <CardContent className="pt-6 space-y-8">
                <div className="relative h-32 w-32 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10" />
                  <div
                    className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-indigo-400 animate-spin"
                    style={{ animationDuration: "1.2s" }}
                  />
                  <div className="absolute inset-4 rounded-full bg-slate-900 flex items-center justify-center border border-white/5 shadow-inner">
                    <Brain className="h-10 w-10 text-indigo-400 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-200 to-emerald-200 bg-clip-text text-transparent">
                    AI Activity Portal
                  </h1>
                  <div className="flex items-center justify-center gap-2 text-sm text-indigo-300 font-bold px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 w-fit mx-auto animate-pulse">
                    <span>Loading...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      }
    >
      <LauncherContent />
    </Suspense>
  );
}

function LauncherContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get("assignment_id");

  const [status, setStatus] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(
    assignmentId ? null : "No assignment ID provided."
  );
  const initialized = useRef(false);

  useEffect(() => {
    if (!assignmentId) {
      return;
    }

    if (initialized.current) return;
    initialized.current = true;

    async function launch() {
      try {
        setStatus("Verifying classroom & assignment...");
        const startRes = await startAssignmentActivity(assignmentId!);

        if (!startRes.success || !startRes.submission) {
          setError(startRes.error || "Failed to start assignment activity.");
          return;
        }

        const submission = startRes.submission;

        // Resume if session already exists
        if (submission.submission_url) {
          setStatus("Resuming your session...");
          const supabase = createClient();
          const { data: assignment } = await supabase
            .from("assignments")
            .select("activity_type")
            .eq("id", assignmentId!)
            .single();

          if (assignment) {
            router.replace(
              `/activities/${assignment.activity_type}/${submission.submission_url}?assignment_id=${assignmentId}`
            );
          } else {
            setError("Could not retrieve assignment configuration.");
          }
          return;
        }

        // Fetch assignment configuration for generation
        setStatus("Loading assignment rules...");
        const supabase = createClient();
        const { data: assignment, error: assignErr } = await supabase
          .from("assignments")
          .select("activity_type, topic, difficulty, question_count")
          .eq("id", assignmentId!)
          .single();

        if (assignErr || !assignment) {
          setError("Failed to fetch assignment details.");
          return;
        }

        const { activity_type, topic, difficulty, question_count } = assignment;
        if (!activity_type || !topic) {
          setError("Assignment configurations are incomplete.");
          return;
        }

        // Generate activity content on-demand
        setStatus("AI is crafting your questions...");
        let genRes: { success?: boolean; activityId?: string; error?: string } = {};

        if (activity_type === "quizzes") {
          genRes = await generateQuiz(topic, question_count || 3, difficulty || "Grade 5");
        } else if (activity_type === "flashcards") {
          genRes = await generateFlashcards(topic, question_count || 5, difficulty || "Grade 5");
        } else if (activity_type === "math-challenges") {
          genRes = await generateMathChallenge(topic, question_count || 5, difficulty || "Grade 5");
        } else if (activity_type === "word-scrambles") {
          const mappedDiff = mapWordScrambleDifficulty(difficulty || "Grade 5");
          genRes = await generateWordScramble(topic, question_count || 5, mappedDiff);
        } else {
          setError(`Unsupported activity type: ${activity_type}`);
          return;
        }

        if (genRes.error || !genRes.success || !genRes.activityId) {
          setError(genRes.error || "Failed to generate activity content.");
          return;
        }

        // Save generated activity id into submission_url
        setStatus("Saving your game session...");
        const updRes = await updateAssignmentSubmissionUrl(submission.id, genRes.activityId);

        if (!updRes.success) {
          setError(updRes.error || "Failed to link your session.");
          return;
        }

        setStatus("Launching game! Get ready...");
        router.replace(
          `/activities/${activity_type}/${genRes.activityId}?assignment_id=${assignmentId}`
        );
      } catch (err) {
        console.error("Launcher error:", err);
        setError("An unexpected error occurred during launch.");
      }
    }

    launch();
  }, [assignmentId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      <div
        className="absolute top-10 left-10 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none animate-pulse"
        style={{ animationDuration: "4s" }}
      />
      <div
        className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none animate-pulse"
        style={{ animationDuration: "6s" }}
      />

      <main className="relative z-10 w-full max-w-md">
        {error ? (
          <Card className="border-2 border-red-500/20 shadow-2xl rounded-3xl bg-slate-900/80 backdrop-blur-xl p-8 space-y-6 text-center text-white border-none">
            <CardContent className="pt-6 space-y-6">
              <div className="h-20 w-20 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
                <AlertCircle className="h-10 w-10 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-black">Launch Failed</h1>
                <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
              </div>
              <Link
                href="/dashboard/kid"
                className="w-full rounded-2xl bg-slate-800 hover:bg-slate-755 text-white font-bold py-4 text-base border border-slate-700/50 shadow-md transition-all active:translate-y-px inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" /> Go Back to Dashboard
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-white/10 shadow-2xl rounded-3xl bg-slate-900/60 backdrop-blur-xl p-8 space-y-8 text-center text-white border-none">
            <CardContent className="pt-6 space-y-8">
              <div className="relative h-32 w-32 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10" />
                <div
                  className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-indigo-400 animate-spin"
                  style={{ animationDuration: "1.2s" }}
                />

                <div className="absolute inset-4 rounded-full bg-slate-900 flex items-center justify-center border border-white/5 shadow-inner">
                  <Brain className="h-10 w-10 text-indigo-400 animate-pulse" />
                </div>

                <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-400 rounded-full flex items-center justify-center animate-bounce shadow-md">
                  <Sparkles className="h-3 w-3 text-slate-900" />
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-200 to-emerald-200 bg-clip-text text-transparent">
                  AI Activity Portal
                </h1>
                <div className="flex items-center justify-center gap-2 text-sm text-indigo-300 font-bold px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 w-fit mx-auto animate-pulse">
                  <span>{status}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Gemini is customizing this learning activity. This might take a few moments.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
