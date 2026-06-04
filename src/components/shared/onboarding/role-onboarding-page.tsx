"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Users,
  GraduationCap,
  Rocket,
} from "lucide-react";
import Image from "next/image";

import { Card, CardContent } from "@/components/shared/ui/card";
import { createClient } from "@/lib/supabase/client";
import { APP_ROUTES } from "@/lib/constants/common";
import Logo from "@/components/shared/ui/Logo";
import { useAuth } from "@/hooks/useAuth";

const supabase = createClient();

type Role = "parent" | "teacher" | "kid";

type Props = {
  role?: Role;
};

export function RoleOnboardingPage({ role }: Props) {
  const router = useRouter();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSelectRole = async (selected: Role) => {
    setIsSubmitting(true);
    try {
      if (!user) throw new Error("Please sign in first.");

      const { error } = await supabase
        .from("profile")
        .update({ role: selected })
        .eq("user_id", user.id);

      if (error) throw error;

      // Redirect to the role-specific onboarding page
      router.push(`/onboarding/${selected}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(error);
      const message = error.message || "An unexpected error occurred";
      setStatusMessage("Failed to set role: " + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSidebar = {
    icon: Sparkles,
    text: "“Welcome! I'm so glad you're here. Tell me, who are you? An explorer, a guide, or a mentor?”",
    badge: "New Journey",
  };
  const SidebarIcon = currentSidebar.icon;

  return (
    <main className="min-h-screen flex flex-col px-6 font-sans bg-gradient-to-br from-sky-100 via-background to-emerald-50/30 dark:from-slate-950 dark:via-background dark:to-slate-950">
      <div className="my-auto mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* Left Side: Creative Content */}
        <div className="hidden flex-col gap-8 lg:flex">
          <Link href="/" className="flex items-center gap-4">
            <Logo />
          </Link>

          <Card className="relative border-2 border-border/50 rounded-[32px] bg-card text-card-foreground p-2 shadow-xl overflow-visible dark:border-slate-800">
            <CardContent className="p-8">
              <div className="absolute -top-5 -left-5 w-14 h-14 rounded-full bg-sky-600 flex items-center justify-center shadow-lg dark:bg-sky-500">
                <SidebarIcon className="text-white" />
              </div>

              <p className="text-xl text-muted-foreground italic leading-relaxed">
                {currentSidebar.text}
              </p>

              <div className="mt-8 flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 dark:border-sky-500/30 dark:bg-sky-500/20">
                  <ShieldCheck className="w-4 h-4 text-sky-500" />
                  <span className="font-bold text-sm text-foreground/80">Protected</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 dark:border-emerald-500/30 dark:bg-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-sm text-foreground/80">
                    {currentSidebar.badge}
                  </span>
                </div>
              </div>

              <div className="absolute -bottom-16 -right-8 pointer-events-none">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxDgf-02-AXOs-V48tFjAQajOESWiJjOwgWc5kV1J90hdnwLqvUzFHNgYtZVHxmSl3C0mAUzg5Emwp_wwfdaYtZ9R33Sd2HlPVhWz_W8UrWEkscg-9r9kj3CmDECSyeRVwdDCaWQ8iBH5lqJ9WudeXzVoENYkxd33KnUk_r41pVqHoC_VRof_D9_zUE8N1VbWuXqekSJ9SM0tTGJ7R5zovAzRphvaDvSoWEkjUZnLZp97qZXP_Qds__dLdJ_J5r_r5LaT8jE5_lvI"
                  alt="Mascot"
                  width={140}
                  height={140}
                  className="h-32 w-32 object-contain"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Onboarding Card */}
        <Card className="rounded-[40px] border-2 border-border/50 bg-card/90 text-card-foreground p-8 shadow-[0_40px_80px_-24px_rgba(0,101,141,0.15)] backdrop-blur-xl sm:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar dark:border-slate-800">
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-4xl font-black text-foreground tracking-tight">
              {role === "parent" ? "Family Setup" : "Classroom Setup"}
            </h2>
            <p className="mt-1 text-base font-medium text-muted-foreground">
              Create a safe space for your explorers! 🚀
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4">
              {[
                { id: "kid", label: "Kid", desc: "A playful learning space", icon: Rocket },
                { id: "parent", label: "Parent", desc: "Set family guardrails", icon: Users },
                {
                  id: "teacher",
                  label: "Teacher",
                  desc: "Prepare classroom learning",
                  icon: GraduationCap,
                },
              ].map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRole(r.id as Role)}
                    disabled={isSubmitting}
                    className="flex items-center gap-4 rounded-3xl border-2 border-border bg-card p-6 text-left transition-all hover:border-sky-500 hover:bg-sky-500/10 active:scale-[0.98] disabled:opacity-50 dark:border-slate-800 dark:hover:bg-sky-500/20"
                  >
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
                      <Icon size={28} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-foreground">{r.label}</h4>
                      <p className="text-sm text-muted-foreground">{r.desc}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground/50" />
                  </button>
                );
              })}
            </div>

            {statusMessage && (
              <p className="text-center text-xs font-bold text-sky-500 animate-pulse">
                {statusMessage}
              </p>
            )}

            <p className="text-center text-xs font-bold text-muted-foreground">
              Need help?{" "}
              <Link href={APP_ROUTES.Signin} className="text-sky-500 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
