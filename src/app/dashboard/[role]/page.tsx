import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, ShieldCheck, Sparkles, Users, GraduationCap } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Role = "parent" | "kid" | "teacher";

const allowedRoles: Role[] = ["parent", "kid", "teacher"];

const roleCopy: Record<
  Role,
  {
    title: string;
    subtitle: string;
    accent: string;
    summary: string;
    primaryLabel: string;
  }
> = {
  parent: {
    title: "Parent dashboard",
    subtitle: "Review guardrails, invite your child, and monitor progress.",
    accent: "from-sky-500 to-cyan-400",
    summary:
      "Your family space is ready. Keep an eye on the first chat and adjust the guardrails whenever needed.",
    primaryLabel: "Open family chat",
  },
  kid: {
    title: "Kid dashboard",
    subtitle: "A safe launchpad for learning, exploring, and chatting.",
    accent: "from-emerald-500 to-lime-400",
    summary: "Start with guided prompts, friendly avatars, and parent-approved boundaries.",
    primaryLabel: "Continue to chat",
  },
  teacher: {
    title: "Teacher dashboard",
    subtitle: "Manage the classroom code and keep learning structured.",
    accent: "from-teal-500 to-cyan-400",
    summary: "Use the dashboard to prepare lessons, review safety defaults, and invite students.",
    primaryLabel: "Open classroom chat",
  },
};

export default async function DashboardRoute({ params }: { params: Promise<{ role: string }> }) {
  const resolvedParams = await params;
  if (!allowedRoles.includes(resolvedParams.role as Role)) {
    notFound();
  }

  const role = resolvedParams.role as Role;
  const copy = roleCopy[role];
  const quickCards = [
    {
      icon: ShieldCheck,
      title: "Safety",
      text:
        role === "kid"
          ? "Filtered, age-appropriate responses."
          : "Family-first guardrails and review tools.",
    },
    {
      icon: BookOpen,
      title: "Learning",
      text:
        role === "teacher"
          ? "Lesson-friendly prompts and study support."
          : "Adaptive help for homework and curiosity.",
    },
    {
      icon: Sparkles,
      title: "Personalization",
      text:
        role === "kid"
          ? "Avatar and nickname stay with the child profile."
          : "Code-based setup stays tied to your account.",
    },
  ];

  const roleIcon = role === "parent" ? Users : role === "kid" ? Sparkles : GraduationCap;
  const RoleIcon = roleIcon;

  return (
    <main className="min-h-screen bg-linear-to-br from-sky-50 via-white to-emerald-50 px-6 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[36px] border border-sky-100 bg-white/90 p-8 shadow-[0_24px_80px_rgba(0,101,141,0.1)]">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Onboarding complete
            </Badge>

            <div className="mt-6 flex items-center gap-4">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br ${copy.accent} text-white shadow-lg`}
              >
                <RoleIcon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight">{copy.title}</h1>
                <p className="mt-2 text-base leading-7 text-slate-600">{copy.subtitle}</p>
              </div>
            </div>

            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-slate-600">{copy.summary}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {quickCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card key={card.title} className="rounded-[28px] border-sky-100 shadow-sm">
                    <CardContent className="space-y-3 p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="font-bold text-slate-950">{card.title}</h2>
                      <p className="text-sm leading-6 text-slate-500">{card.text}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <aside className="space-y-5">
            <Card className="rounded-[32px] border-slate-200 bg-slate-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.25)]">
              <CardContent className="space-y-4 p-6">
                <p className="text-sm uppercase tracking-[0.18em] text-white/60">What’s next</p>
                <h2 className="text-2xl font-black">Jump into your role-specific chat.</h2>
                <p className="text-sm leading-6 text-white/80">
                  The middleware now keeps this route tied to the correct role, so you only see the
                  workspace that belongs to you.
                </p>
                <Link
                  href={`/chat/${role}`}
                  className="mt-2 inline-flex h-12 items-center justify-center rounded-2xl bg-white px-5 font-semibold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {copy.primaryLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-sky-100 shadow-sm">
              <CardContent className="space-y-4 p-6">
                <p className="text-sm font-semibold text-slate-500">Current route</p>
                <div className="rounded-3xl bg-sky-50 px-4 py-3 font-mono text-sm text-slate-700">
                  /dashboard/{role}
                </div>
                <p className="text-sm leading-6 text-slate-500">
                  Authenticated users with this role can access dashboard and chat routes only for
                  the same role.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
