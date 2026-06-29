"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Brain, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
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
  return "medium";
}

// ─── Shared Layout Shell ─────────────────────────────────────────────────────
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
      min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden
      bg-gradient-to-br from-slate-50 via-indigo-50/60 to-emerald-50/40
      dark:from-indigo-950 dark:via-slate-900 dark:to-emerald-950
    "
    >
      {/* Ambient blobs — light mode: soft pastels / dark mode: glowing halos */}
      <div
        className="absolute top-[-80px] left-[-80px] w-[420px] h-[420px] rounded-full blur-3xl pointer-events-none
          bg-indigo-200/50 dark:bg-indigo-500/10"
        style={{ animation: "pulse 5s ease-in-out infinite" }}
      />
      <div
        className="absolute bottom-[-80px] right-[-80px] w-[480px] h-[480px] rounded-full blur-3xl pointer-events-none
          bg-emerald-200/50 dark:bg-emerald-500/10"
        style={{ animation: "pulse 7s ease-in-out infinite" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none opacity-30
          bg-violet-100 dark:bg-violet-900/20"
        style={{ animation: "pulse 9s ease-in-out infinite" }}
      />

      {/* Subtle dot-grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #6366f1 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <main className="relative z-10 w-full max-w-sm">{children}</main>
    </div>
  );
}

// ─── Glass Card ───────────────────────────────────────────────────────────────
function GlassCard({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div
      className={`
        rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl border
        bg-white/70 dark:bg-slate-900/60
        ${
          error
            ? "border-rose-300/60 dark:border-rose-500/20"
            : "border-white/80 dark:border-white/10"
        }
        shadow-indigo-100/50 dark:shadow-black/40
      `}
    >
      {children}
    </div>
  );
}

// ─── Spinner / Brain Loader ───────────────────────────────────────────────────
function BrainSpinner() {
  return (
    <div className="relative h-32 w-32 mx-auto">
      {/* Track ring */}
      <div className="absolute inset-0 rounded-full border-4 border-indigo-200/40 dark:border-indigo-500/10" />
      {/* Spinning progress arc */}
      <div
        className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-indigo-400 border-b-transparent border-l-transparent animate-spin"
        style={{ animationDuration: "1.2s" }}
      />
      {/* Inner circle */}
      <div
        className="absolute inset-4 rounded-full flex items-center justify-center
        bg-white/80 dark:bg-slate-900
        border border-indigo-100/60 dark:border-white/5
        shadow-inner shadow-indigo-100 dark:shadow-black/40"
      >
        <Brain className="h-10 w-10 text-indigo-500 dark:text-indigo-400 animate-pulse" />
      </div>
      {/* Sparkle badge */}
      <div className="absolute -top-1 -right-1 h-6 w-6 bg-emerald-400 dark:bg-emerald-400 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-emerald-300/40 dark:shadow-emerald-500/30">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
    </div>
  );
}

// ─── Status Steps ─────────────────────────────────────────────────────────────
const STEPS = [
  "Verifying assignment…",
  "Loading assignment rules…",
  "AI is crafting your questions…",
  "Saving your session…",
  "Launching! Get ready…",
];

function StatusPill({ status }: { status: string }) {
  return (
    <div
      className="flex items-center justify-center gap-2 w-fit mx-auto
      px-4 py-1.5 rounded-full text-sm font-bold animate-pulse
      bg-indigo-100 text-indigo-700 border border-indigo-200
      dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20"
    >
      <span>{status}</span>
    </div>
  );
}

function ProgressSteps({ currentStatus }: { currentStatus: string }) {
  return (
    <div className="flex justify-center gap-1.5 mt-4">
      {STEPS.map((step, i) => {
        const isActive = currentStatus === step;
        const isDone = STEPS.indexOf(currentStatus) > i;
        return (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              isDone
                ? "bg-emerald-400 dark:bg-emerald-400 w-6"
                : isActive
                  ? "bg-indigo-500 dark:bg-indigo-400 w-8"
                  : "bg-slate-200 dark:bg-slate-700/60 w-4"
            }`}
          />
        );
      })}
    </div>
  );
}

// ─── Suspense Fallback UI ─────────────────────────────────────────────────────
function LoadingFallback() {
  return (
    <PageShell>
      <GlassCard>
        <BrainSpinner />
        <div className="mt-8 space-y-3">
          <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-emerald-500 dark:from-indigo-200 dark:to-emerald-200 bg-clip-text text-transparent">
            AI Activity Portal
          </h1>
          <StatusPill status="Loading…" />
        </div>
      </GlassCard>
    </PageShell>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function AssignmentLauncherPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LauncherContent />
    </Suspense>
  );
}

// ─── Core Logic ───────────────────────────────────────────────────────────────
function LauncherContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get("assignment_id");

  const [status, setStatus] = useState<string>(STEPS[0]);
  const [error, setError] = useState<string | null>(
    assignmentId ? null : "No assignment ID provided."
  );
  const initialized = useRef(false);

  useEffect(() => {
    if (!assignmentId) return;
    if (initialized.current) return;
    initialized.current = true;

    async function launch() {
      try {
        setStatus(STEPS[0]);
        const startRes = await startAssignmentActivity(assignmentId!);

        if (!startRes.success || !startRes.submission) {
          setError(startRes.error || "Failed to start assignment activity.");
          return;
        }

        const submission = startRes.submission;

        if (submission.submission_url) {
          setStatus("Resuming your session…");
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

        setStatus(STEPS[1]);
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

        setStatus(STEPS[2]);
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

        setStatus(STEPS[3]);
        const updRes = await updateAssignmentSubmissionUrl(submission.id, genRes.activityId);

        if (!updRes.success) {
          setError(updRes.error || "Failed to link your session.");
          return;
        }

        setStatus(STEPS[4]);
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

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <PageShell>
        <GlassCard error>
          {/* Error icon */}
          <div
            className="h-20 w-20 rounded-2xl mx-auto flex items-center justify-center border
            bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20"
          >
            <AlertCircle className="h-10 w-10 text-rose-500 dark:text-rose-400 animate-bounce" />
          </div>

          <div className="mt-6 space-y-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Launch Failed</h1>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {error}
            </p>
          </div>

          <Link
            href="/dashboard/kid"
            className="mt-6 w-full rounded-2xl inline-flex items-center justify-center gap-2
              py-3.5 px-5 font-bold text-sm transition-all active:scale-[0.98]
              bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200
              dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white dark:border-slate-700/50"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back to Dashboard
          </Link>
        </GlassCard>
      </PageShell>
    );
  }

  // ── Loading / Launch state ───────────────────────────────────────────────
  return (
    <PageShell>
      <GlassCard>
        <BrainSpinner />

        <div className="mt-8 space-y-3">
          <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-emerald-500 dark:from-indigo-200 dark:to-emerald-200 bg-clip-text text-transparent">
            AI Activity Portal
          </h1>

          <StatusPill status={status} />
          <ProgressSteps currentStatus={status} />
        </div>

        <p
          className="mt-6 text-xs leading-relaxed max-w-[240px] mx-auto
          text-slate-400 dark:text-slate-500"
        >
          Gemini is customising this learning activity. This might take a few moments.
        </p>

        {/* Subtle step checklist */}
        <div className="mt-6 text-left space-y-2">
          {STEPS.slice(0, 4).map((step, i) => {
            const currentIndex = STEPS.indexOf(status);
            const done = currentIndex > i;
            const active = currentIndex === i;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs font-medium transition-all duration-300 ${
                  done
                    ? "text-emerald-600 dark:text-emerald-400"
                    : active
                      ? "text-indigo-600 dark:text-indigo-300"
                      : "text-slate-300 dark:text-slate-600"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <div
                    className={`h-3.5 w-3.5 rounded-full border-2 shrink-0 ${
                      active
                        ? "border-indigo-500 dark:border-indigo-400 animate-pulse"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  />
                )}
                <span className={active ? "" : done ? "line-through opacity-60" : "opacity-40"}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </PageShell>
  );
}
