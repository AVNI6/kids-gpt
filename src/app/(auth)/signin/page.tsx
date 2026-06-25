"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { AuthSkeleton } from "@/components/shared/skeletonLoading";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import GoogleSignInButton from "@/components/shared/forms/GoogleSignInButton";
import { Mail, Lock, CheckCircle, BookOpen, Brain } from "lucide-react";
import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import Image from "next/image";
import { APP_ROUTES } from "@/lib/constants/app_routes";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useState, useEffect } from "react";
import Logo from "@/components/shared/logo/Logo";
import { useAuth } from "@/hooks/useAuth";

const supabase = createClient();

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams?.get("from");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { isUserLoggedIn, userProfile, user, isInitializing } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isUserLoggedIn && userProfile) {
      if (userProfile.is_onboarded) {
        router.replace("/");
      } else {
        if (user?.user_metadata?.invite_token) {
          router.replace("/onboarding/kid");
        } else {
          router.replace("/onboarding");
        }
      }
    }
  }, [isUserLoggedIn, userProfile, user, router]);

  type FormValue = {
    email: string;
    password: string;
  };

  const { register, handleSubmit, setValue } = useForm<FormValue>();

  useEffect(() => {
    const initRemembered = async () => {
      const remember = localStorage.getItem("rememberMe") === "true";
      setRememberMe(remember);
      if (remember) {
        const savedEmail = localStorage.getItem("rememberedEmail");
        if (savedEmail) {
          setValue("email", savedEmail);
        }
        const savedPassword = localStorage.getItem("rememberedPassword");
        if (savedPassword) {
          try {
            const { decryptPassword } = await import("@/lib/utils/crypto");
            const decrypted = await decryptPassword(savedPassword);
            if (decrypted) {
              setValue("password", decrypted);
            }
          } catch (err) {
            console.error("Failed to decrypt remembered password:", err);
          }
        }
      }
    };
    initRemembered();
  }, [setValue]);

  if (isInitializing || (isUserLoggedIn && !userProfile)) {
    return <AuthSkeleton />;
  }

  const onSubmit: SubmitHandler<FormValue> = async (e) => {
    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: e.email,
      password: e.password,
    });
    if (error) {
      toast.error("Sign in failed", { description: error.message });
      setIsSubmitting(false);
      return;
    }
    if (data) {
      // Save credentials if Remember Me is checked. Otherwise clear them.
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("rememberedEmail", e.email);

        try {
          const { encryptPassword } = await import("@/lib/utils/crypto");
          const encrypted = await encryptPassword(e.password);
          if (encrypted) {
            localStorage.setItem("rememberedPassword", encrypted);
          }
        } catch (err) {
          console.error("Failed to encrypt password for remember me:", err);
        }
      } else {
        localStorage.setItem("rememberMe", "false");
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
      }

      toast.success("Welcome!", {
        description: "Login successful!",
      });
    }
  };

  return (
    <main className="min-h-screen flex flex-col p-3 sm:p-6 font-sans bg-background relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[120px]" />
      </div>

      <div className="my-auto mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 relative z-10">
        <div className="hidden flex-col gap-8 lg:flex">
          <Link href="/" className="flex items-center gap-4">
            <Logo />
          </Link>

          <div className="relative rounded-[32px] border-2 border-border/50 bg-card p-8 shadow-xl">
            <h2 className="mb-4 text-3xl font-bold text-foreground">Welcome!</h2>

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
                loading="eager"
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
          {from === "signup" && (
            <div className="mb-4 rounded-lg border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-foreground">
              Account created! Please check your email to verify your account before signing in.
            </div>
          )}
          <div className="mb-4 sm:mb-8">
            <h2 className="mb-2 text-4xl font-bold text-foreground">Sign In</h2>
            <p className="text-muted-foreground">Access your learning dashboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="sm:space-y-2">
              <Label className="block mb-2 text-sm font-semibold text-foreground">Email</Label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 z-10"
                  size={20}
                />
                <Input
                  {...register("email", { required: true })}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-full border-2 border-border bg-muted/50 h-14 pl-12 pr-4 focus-visible:border-sky-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="block mb-2 text-sm font-semibold text-foreground">Password</Label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 z-10"
                  size={20}
                />
                <Input
                  {...register("password", { required: true })}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full rounded-full border-2 border-border bg-muted/50 h-14 pl-12 pr-12 focus-visible:border-sky-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-black transition-colors z-20"
                >
                  {showPassword ? <IoEyeOutline size={20} /> : <IoEyeOffOutline size={20} />}
                </button>
              </div>
              <div className="flex justify-between mt-1">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <label
                    htmlFor="remember-me"
                    className="text-sm text-muted-foreground cursor-pointer select-none"
                  >
                    Remember Me
                  </label>
                </div>
                <Link
                  href={APP_ROUTES.ForgotPassword}
                  className="text-sm font-semibold text-sky-500 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              loadingText="Signing in..."
              className="w-full rounded-full py-4 font-bold text-black bg-theme-brand dark:text-white dark:bg-sky-500 shadow-[0_8px_0_rgb(0_77_109)] dark:shadow-[0_8px_0_rgba(14,165,233,0.4)] transition hover:-translate-y-0.5 h-14"
            >
              Sign In
            </Button>
          </form>

          <div className="relative my-4 sm:my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-4 text-sm text-muted-foreground">OR</span>
            </div>
          </div>

          <div className="grid gap-4">
            <GoogleSignInButton next="/onboarding" />
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
    <Suspense fallback={<AuthSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}
