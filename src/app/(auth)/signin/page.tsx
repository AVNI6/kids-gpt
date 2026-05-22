"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { FcGoogle } from "react-icons/fc";
import { Mail, Lock, CheckCircle, BookOpen, Brain, Sparkles, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import Image from "next/image";
import { APP_ROUTES } from "@/constant/AppRoutes";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useState } from "react";
const supabase = createClient();

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams?.get("from");
  const fromRole = searchParams?.get("role");
  const errorParam = searchParams?.get("error");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  type FormValue = {
    email: string;
    password: string;
  };

  const { register, handleSubmit } = useForm<FormValue>();

  const onSubmitOAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error(error);
    }
  };

  const onSubmit: SubmitHandler<FormValue> = async (e) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: e.email,
        password: e.password,
      });
      if (error) {
        console.error(error);
        toast.error("Sign In Failed", {
          description: error.message || "Please check your email and password.",
        });
        return;
      }
      if (data) {
        // Attempt to read profile and route first-time users to onboarding.
        try {
          const userId = data.user?.id;
          if (userId) {
            const { data: profileData } = await supabase
              .from("profile")
              .select("role, is_onboarded")
              .eq("user_id", userId)
              .maybeSingle();

            const role = profileData?.role ?? data.user?.user_metadata?.role;
            const isOnboarded = Boolean(profileData?.is_onboarded);

            if (!isOnboarded) {
              // If role is already set, we can still go to that specific onboarding,
              // but the root /onboarding will now handle role selection if needed.
              const target = role ? `/onboarding/${role}` : "/onboarding";
              router.push(target);
              router.refresh();
              return;
            }
          }
        } catch (err) {
          console.error("Error checking profile after sign-in:", err);
        }

        router.push("/");
        router.refresh();
        toast.success("Welcome back!", {
          description: "Login successful!",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Sign In Failed", {
        description:
          err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col px-6 font-sans bg-background relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[120px]" />
      </div>

      <div className="my-auto mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 relative z-10">
        <div className="hidden flex-col gap-8 lg:flex">
          <Link href="/" className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg">
                <Sparkles className="text-white w-8 h-8" />
              </div>
              <h1 className="text-5xl font-black text-sky-600">ChatGPT Kid</h1>
            </div>
          </Link>

          <div className="relative rounded-[32px] border-2 border-border/50 bg-card p-8 shadow-xl">
            <h2 className="mb-4 text-3xl font-bold text-foreground">Welcome Back!</h2>

            <p className="leading-relaxed text-muted-foreground">
              Your AI learning buddy is waiting for you 🚀
              <br />
              Continue your learning adventure.
            </p>

            <div className="absolute -bottom-14 right-6 rounded-md overflow-hidden">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxDgf-02-AXOs-V48tFjAQajOESWiJjOwgWc5kV1J90hdnwLqvUzFHNgYtZVHxmSl3C0mAUzg5Emwp_wwfdaYtZ9R33Sd2HlPVhWz_W8UrWEkscg-9r9kj3CmDECSyeRVwdDCaWQ8iBH5lqJ9WudeXzVoENYkxd33KnUk_r41pVqHoC_VRof_D9_zUE8N1VbWuXqekSJ9SM0tTGJ7R5zovAzRphvaDvSoWEkjUZnLZp97qZXP_Qds__dLdJ_J5r_r5LaT8jE5_lvI"
                alt="Mascot"
                width={128}
                height={128}
                className="h-32 w-32 object-contain"
              />
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            {[
              { icon: CheckCircle, text: "Kid Safe" },
              { icon: BookOpen, text: "Teacher Approved" },
              { icon: Brain, text: "Smart AI" },
            ].map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.text}
                  className="flex items-center gap-2 rounded-full border border-border/50 bg-card px-4 py-2"
                >
                  <IconComponent size={20} className="text-sky-500" />
                  <span className="font-semibold text-foreground">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[32px] border-2 border-border/50 bg-card p-8 shadow-xl md:p-10">
          {errorParam === "auth_failed" && (
            <div className="mb-6 rounded-2xl border-2 border-red-500/20 bg-red-500/5 p-5 flex gap-4 items-start relative overflow-hidden dark:bg-red-500/10">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
              <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-1" />
              <div>
                <h3 className="text-base font-bold text-foreground mb-1">Verification Failed</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We couldn&apos;t verify your secure link. This can happen if the link has expired,
                  already been used, or if the security token is invalid.
                </p>
                <p className="text-sky-500 font-semibold text-xs mt-2 leading-normal">
                  💡 Tip: Try requesting a new password reset link below.
                </p>
              </div>
            </div>
          )}
          {from === "signup" && (
            <div className="mb-4 rounded-lg border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-foreground">
              Account created. Please sign in to continue to onboarding
              {fromRole ? ` as ${fromRole}` : ""}.
            </div>
          )}
          <div className="mb-8">
            <h2 className="mb-2 text-4xl font-bold text-foreground">Sign In</h2>
            <p className="text-muted-foreground">Access your learning dashboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Parent’s Email</label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                  size={20}
                />
                <input
                  {...register("email", { required: true })}
                  type="email"
                  placeholder="parent@example.com"
                  className="w-full rounded-full border-2 border-border bg-muted/50 py-4 pl-12 pr-4 outline-none transition focus:border-sky-500 text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">Password</label>
                <Link
                  href={APP_ROUTES.ForgotPassword}
                  className="text-sm font-semibold text-sky-500 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                  size={20}
                />
                <input
                  {...register("password", { required: true })}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full rounded-full border-2 border-border bg-muted/50 py-4 pl-12 pr-12 outline-none transition focus:border-sky-500 text-foreground"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-black transition-colors z-10"
                >
                  {showPassword ? <IoEyeOutline size={20} /> : <IoEyeOffOutline size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox />
              <span className="text-sm text-muted-foreground">Keep me logged in</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full py-4 font-bold text-black bg-theme-brand dark:text-white dark:bg-sky-500 shadow-[0_8px_0_rgb(0_77_109)] dark:shadow-[0_8px_0_rgba(14,165,233,0.4)] transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-4 text-sm text-muted-foreground">OR</span>
            </div>
          </div>

          <div className="grid gap-4">
            <button
              type="button"
              onClick={() => onSubmitOAuth()}
              className="rounded-full flex items-center justify-center gap-2 border-2 border-border py-4 font-bold hover:bg-muted text-foreground transition-all duration-200"
            >
              <FcGoogle className="text-xl" /> Sign In with Google
            </button>
          </div>

          <p className="mt-8 text-center text-muted-foreground">
            New explorer?{" "}
            <Link href={APP_ROUTES.Signup} className="font-semibold text-sky-500 hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
