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

import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { APP_ROUTES } from "@/constant/AppRoutes";

const supabase = createClient();

type Role = "parent" | "teacher" | "kid";

type Props = {
  role?: Role;
};

export function RoleOnboardingPage({ role }: Props) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSelectRole = async (selected: Role) => {
    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
    <main
      className="min-h-screen flex flex-col px-6 font-sans"
      style={{
        background: `radial-gradient(circle at top left, #c6e7ff 0%, #f6fafe 45%, rgb(132 251 66 / 0.08) 100%)`,
      }}
    >
      <div className="my-auto mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* Left Side: Creative Content */}
        <div className="hidden flex-col gap-8 lg:flex">
          <Link href="/" className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg">
                <Sparkles className="text-white w-8 h-8" />
              </div>
              <h1 className="text-5xl font-black text-sky-600">ChatGPT Kid</h1>
            </div>
          </Link>

          <Card className="relative border-2 border-slate-100 rounded-[32px] bg-white p-2 shadow-xl overflow-visible">
            <CardContent className="p-8">
              <div className="absolute -top-5 -left-5 w-14 h-14 rounded-full bg-blue-900 flex items-center justify-center shadow-lg">
                <SidebarIcon className="text-white" />
              </div>

              <p className="text-xl text-slate-600 italic leading-relaxed">{currentSidebar.text}</p>

              <div className="mt-8 flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-2">
                  <ShieldCheck className="w-4 h-4 text-sky-500" />
                  <span className="font-bold text-sm text-slate-700">Protected</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-sm text-slate-700">{currentSidebar.badge}</span>
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
        <Card className="rounded-[40px] border-2 border-white bg-white/90 p-8 shadow-[0_40px_80px_-24px_rgba(0,101,141,0.15)] backdrop-blur-xl sm:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              {role === "parent" ? "Family Setup" : "Classroom Setup"}
            </h2>
            <p className="mt-1 text-base font-medium text-slate-500">
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
                    className="flex items-center gap-4 rounded-3xl border-2 border-slate-100 bg-white p-6 text-left transition-all hover:border-sky-400 hover:bg-sky-50 active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
                      <Icon size={28} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-slate-900">{r.label}</h4>
                      <p className="text-sm text-slate-500">{r.desc}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300" />
                  </button>
                );
              })}
            </div>

            {statusMessage && (
              <p className="text-center text-xs font-bold text-sky-600 animate-pulse">
                {statusMessage}
              </p>
            )}

            <p className="text-center text-xs font-bold text-slate-400">
              Need help?{" "}
              <Link href={APP_ROUTES.Signin} className="text-sky-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
