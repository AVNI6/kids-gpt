"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardCopy,
  Copy,
  Palette,
  ShieldCheck,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const permissionCategories = [
  {
    key: "chat",
    title: "Chat",
    description: "Age-appropriate conversations and helpful explanations.",
    icon: BookOpen,
  },
  {
    key: "learn",
    title: "Learn",
    description: "Quizzes, homework help, and guided discovery.",
    icon: Brain,
  },
  {
    key: "game",
    title: "Game",
    description: "Creative learning games and playful practice.",
    icon: Sparkles,
  },
  {
    key: "social",
    title: "Social",
    description: "Social features and sharing with supervision.",
    icon: Users,
  },
  {
    key: "account",
    title: "Account",
    description: "Profile editing, linking, and account changes.",
    icon: BadgeCheck,
  },
  {
    key: "safety",
    title: "Safety",
    description: "Sensitive topics, moderation, and guardrails.",
    icon: ShieldCheck,
  },
] as const;

type Role = "parent" | "teacher";
type PermissionKey = (typeof permissionCategories)[number]["key"];

type Props = {
  role: Role;
};

const roleCopy: Record<
  Role,
  {
    eyebrow: string;
    title: string;
    description: string;
    primaryAction: string;
    successRoute: string;
    footerNote: string;
    intro: string;
  }
> = {
  parent: {
    eyebrow: "Parent onboarding",
    title: "Set the family rules before your child joins.",
    description:
      "Generate a private connection code, decide the first guardrails, and finish with a clean dashboard handoff.",
    primaryAction: "Generate family code",
    successRoute: "/dashboard/parent",
    footerNote: "Your child will use this code once to join your family space.",
    intro: "Build the protected learning environment first, then invite your child in.",
  },
  teacher: {
    eyebrow: "Teacher onboarding",
    title: "Create a classroom-friendly learning environment.",
    description:
      "Generate a classroom code, choose the first guardrails, and prepare a structured space for students.",
    primaryAction: "Generate classroom code",
    successRoute: "/dashboard/teacher",
    footerNote: "You can later share the code with your classroom or co-teacher.",
    intro: "Set the baseline for the classroom before students join.",
  },
};

function generateConnectionCode() {
  return `KID-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function buildDefaultGuardrails() {
  return permissionCategories.reduce<Record<PermissionKey, boolean>>(
    (accumulator, category) => {
      accumulator[category.key] = category.key !== "social";
      return accumulator;
    },
    {} as Record<PermissionKey, boolean>
  );
}

export function RoleOnboardingPage({ role }: Props) {
  const router = useRouter();
  const copy = roleCopy[role];

  const [connectionCode, setConnectionCode] = useState(generateConnectionCode());
  const [profileName, setProfileName] = useState("");
  const [note, setNote] = useState("");
  const [guardrails, setGuardrails] = useState(buildDefaultGuardrails());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeGuardrailCount = useMemo(
    () => Object.values(guardrails).filter(Boolean).length,
    [guardrails]
  );

  const handleGenerateCode = () => {
    setConnectionCode(generateConnectionCode());
    setStatusMessage("A new code is ready.");
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(connectionCode);
    setStatusMessage("Code copied to clipboard.");
  };

  const toggleGuardrail = (key: PermissionKey) => {
    setGuardrails((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatusMessage("Please sign in again to continue.");
        return;
      }

      const code = connectionCode.trim().toUpperCase() || generateConnectionCode();

      const defaults = permissionCategories.map((item) => ({
        granted_by_user_id: user.id,
        category: item.key,
        is_allowed: guardrails[item.key],
        default_allowed: guardrails[item.key],
      }));

      await supabase.from("kid_permissions_default").delete().eq("granted_by_user_id", user.id);

      const { error: defaultError } = await supabase
        .from("kid_permissions_default")
        .insert(defaults);

      if (defaultError) {
        setStatusMessage("The guardrail defaults could not be saved yet.");
        return;
      }

      const { error: profileError } = await supabase
        .from("profile")
        .update({
          first_name: profileName || null,
          connection_code: code,
          is_onboarded: true,
        })
        .eq("user_id", user.id);

      if (profileError) {
        setStatusMessage("Your setup could not be completed yet.");
        return;
      }

      setConnectionCode(code);
      router.replace(copy.successRoute);
    } catch (error) {
      console.error(error);
      setStatusMessage("Something unexpected happened. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className="min-h-screen overflow-hidden px-4 py-6 text-slate-900 sm:px-6 lg:px-8"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(198,231,255,0.88) 0%, rgba(246,250,254,1) 35%, rgba(132,251,66,0.09) 100%)",
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative hidden overflow-hidden rounded-[36px] border border-white/70 bg-white/75 p-8 shadow-[0_24px_80px_rgba(0,101,141,0.12)] backdrop-blur lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative space-y-8">
              <Link href="/" className="inline-flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500 shadow-lg shadow-sky-500/20">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">
                    ChatGPT Kid
                  </p>
                  <h1 className="text-4xl font-black text-slate-900">{copy.eyebrow}</h1>
                </div>
              </Link>

              <div className="max-w-xl space-y-4">
                <Badge className="rounded-full bg-sky-100 px-4 py-1.5 text-sky-700 hover:bg-sky-100">
                  {copy.eyebrow}
                </Badge>
                <h2 className="text-5xl font-black leading-tight tracking-tight text-slate-950">
                  {copy.title}
                </h2>
                <p className="text-lg leading-relaxed text-slate-600">{copy.description}</p>
              </div>

              <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Safety first",
                    text: "Guardrails are stored before the learning session starts.",
                  },
                  {
                    icon: WandSparkles,
                    title: "Fast setup",
                    text: "The flow only asks for the information needed to begin.",
                  },
                  {
                    icon: Palette,
                    title: "Friendly visuals",
                    text: "Warm cards, clear hierarchy, and zero clutter.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Role-aware routing",
                    text: "Each user lands in the right space automatically.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm"
                    >
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className="relative mt-8 rounded-[30px] border border-sky-100 p-6 shadow-sm"
              style={{
                background:
                  "linear-gradient(90deg, rgba(240,249,255,0.95) 0%, rgba(236,253,245,0.95) 100%)",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                    What happens next
                  </p>
                  <p className="mt-2 text-base leading-relaxed text-slate-700">{copy.intro}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Step
                  </p>
                  <p className="text-2xl font-black text-slate-900">01</p>
                </div>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[36px] border border-sky-100 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-sky-100/70 blur-3xl" />

            <div className="relative space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    Role-based onboarding
                  </Badge>
                  <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-4xl">
                    {copy.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                    {copy.description}
                  </p>
                </div>
                <div className="hidden rounded-3xl bg-slate-900 px-4 py-3 text-right text-white sm:block">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">Role</p>
                  <p className="text-lg font-bold capitalize">{role}</p>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <div className="space-y-5">
                  <Card className="rounded-[28px] border-sky-100 shadow-sm">
                    <CardContent className="space-y-5 p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-500">Connection code</p>
                          <h3 className="mt-1 text-xl font-bold text-slate-950">
                            {role === "teacher"
                              ? "Create a classroom code"
                              : "Generate a family invite code"}
                          </h3>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGenerateCode}
                          className="rounded-2xl px-4"
                        >
                          <ClipboardCopy className="mr-2 h-4 w-4" />
                          Regenerate
                        </Button>
                      </div>

                      <div className="flex flex-col gap-3 rounded-[24px] border border-dashed border-sky-200 bg-sky-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Current code
                          </p>
                          <p className="mt-1 text-2xl font-black tracking-[0.24em] text-slate-950">
                            {connectionCode}
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={handleCopyCode}
                          className="rounded-2xl px-4"
                          variant="secondary"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy code
                        </Button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                          value={profileName}
                          onChange={(event) => setProfileName(event.target.value)}
                          className="h-14 rounded-2xl px-4"
                          placeholder={role === "teacher" ? "Classroom name" : "Parent name"}
                        />
                        <Input
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          className="h-14 rounded-2xl px-4"
                          placeholder={role === "teacher" ? "Grade / subject note" : "Family note"}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[28px] border-sky-100 shadow-sm">
                    <CardContent className="space-y-4 p-6">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">Initial guardrails</p>
                        <h3 className="mt-1 text-xl font-bold text-slate-950">
                          Set the first AI permissions
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          These defaults are stored before the child joins so the first chat already
                          reflects your rules.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {permissionCategories.map((category) => {
                          const Icon = category.icon;
                          const active = guardrails[category.key];

                          return (
                            <button
                              key={category.key}
                              type="button"
                              onClick={() => toggleGuardrail(category.key)}
                              className={`rounded-[24px] border p-4 text-left transition-all ${
                                active
                                  ? "border-sky-500 bg-sky-50 shadow-[0_12px_30px_rgba(0,101,141,0.1)]"
                                  : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/50"
                              }`}
                            >
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700">
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    active ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {active ? "Allowed" : "Review"}
                                </div>
                              </div>
                              <h4 className="font-semibold text-slate-900">{category.title}</h4>
                              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                                {category.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-5">
                  <Card className="rounded-[28px] border-sky-100 bg-slate-950 text-white shadow-lg">
                    <CardContent className="space-y-4 p-6">
                      <p className="text-sm uppercase tracking-[0.18em] text-white/60">
                        Setup summary
                      </p>
                      <div className="space-y-3 text-sm leading-6 text-white/85">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-300" />
                          <span>
                            {role === "teacher"
                              ? "A class-ready code will be created for your students."
                              : "A family code will be created for one parent and one child."}
                          </span>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-300" />
                          <span>
                            {activeGuardrailCount} guardrails are currently enabled for the first
                            session.
                          </span>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-300" />
                          <span>{copy.footerNote}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[28px] border-sky-100 shadow-sm">
                    <CardContent className="space-y-4 p-6">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">Profile note</p>
                        <h3 className="mt-1 text-xl font-bold text-slate-950">
                          Keep the first handoff simple
                        </h3>
                      </div>
                      <Textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        className="min-h-28 rounded-2xl px-4 py-3"
                        placeholder={
                          role === "teacher"
                            ? "Add a classroom note, subject, or grade level."
                            : "Add a small note for the first learning session."
                        }
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <Button
                  type="button"
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="h-14 w-full rounded-2xl text-base font-bold shadow-[0_16px_32px_rgba(0,101,141,0.18)]"
                >
                  {isSubmitting ? "Saving setup..." : copy.primaryAction}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                {statusMessage && (
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-600">
                    {statusMessage}
                  </div>
                )}

                <p className="text-center text-sm text-slate-500">
                  Need to switch accounts?{" "}
                  <Link href="/signin" className="font-semibold text-sky-700 hover:underline">
                    Go back to sign in
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
