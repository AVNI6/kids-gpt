"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { ArrowRight, Lightbulb, HelpCircle, Shield, Lock } from "lucide-react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";

import { createClient } from "@/lib/supabase/client";
import { APP_ROUTES } from "@/lib/constants/common";
import Logo from "@/components/shared/logo/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const supabase = createClient();

type FormInputs = {
  password: string;
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [linkChecked, setLinkChecked] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormInputs>();

  useEffect(() => {
    let isMounted = true;
    const initRecoverySession = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        let sessionReady = false;
        let activeSession = null;

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data?.session) {
            sessionReady = true;
            activeSession = data.session;
          }
        }

        if (!sessionReady) {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          const type = hashParams.get("type");

          if (type === "recovery" && accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!error && data?.session) {
              sessionReady = true;
              activeSession = data.session;
            }
          }
        }

        // Only query getSession if not already loaded to minimize parallel auth lock contention
        let currentSession = activeSession;
        if (!currentSession) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          currentSession = session;
        }

        if (!isMounted) return;

        if (!currentSession && !sessionReady) {
          setLinkError("This reset link is invalid or expired. Please request a new one.");
        } else {
          setLinkError("");
          window.history.replaceState({}, "", "/resetpassword");
        }
      } catch {
        if (isMounted) {
          setLinkError("Unable to verify reset link. Please request a new one.");
        }
      } finally {
        if (isMounted) {
          setLinkChecked(true);
        }
      }
    };

    initRecoverySession();
    return () => {
      isMounted = false;
    };
  }, []);

  const validatePassword = (password: string): boolean | string => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return true;
  };

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setMessage("");
    clearErrors("password");

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      const normalized = error.message.toLowerCase();
      const friendlyMessage = normalized.includes(
        "new password should be different from the old password"
      )
        ? "Choose a different password from your current one."
        : error.message || "Unable to reset password. Please try again.";

      setError("password", {
        type: "manual",
        message: friendlyMessage,
      });
      return;
    }

    setMessage("Password updated successfully! Redirecting to sign in...");
    await supabase.auth.signOut();
    setTimeout(() => {
      router.push("/signin");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-6 py-3 relative overflow-hidden transition-colors duration-300">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 dark:opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[120px]" />
      </div>

      <div className="my-auto w-full flex flex-col items-center relative z-10">
        <header className="mb-3 text-center flex flex-col items-center">
          <Logo size="md" className="justify-center" />
          <p className="text-muted-foreground text-sm mt-1">Your AI Learning Buddy</p>
        </header>

        <main className="w-full max-w-lg relative">
          <section className="bg-card border-2 border-border/80 rounded-[2rem] p-8 shadow-xl relative overflow-hidden dark:border-slate-800">
            <div className="bg-muted/50 rounded-2xl p-5 mb-8 border-2 border-dashed border-sky-450/40 flex gap-4 items-start">
              <Lightbulb className="w-8 h-8 text-sky-500 shrink-0" />

              <div>
                <h3 className="text-xl font-bold text-sky-600 dark:text-sky-400 mb-2">
                  Reset Your Password
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {linkChecked
                    ? linkError
                      ? linkError
                      : "Enter a new password to finish updating your account."
                    : "Verifying your secure reset link..."}
                </p>
              </div>
            </div>

            {message && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold rounded-2xl text-center">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                  Enter Your Password
                </Label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 w-5 h-5 z-10" />
                  <Input
                    {...register("password", {
                      required: "Password is required",
                      validate: validatePassword,
                    })}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full h-14 pl-12 pr-12 bg-muted/30 border-2 border-border focus-visible:border-sky-500 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-2xl text-base outline-none transition-all text-foreground"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground/60 hover:text-foreground transition-colors z-25"
                  >
                    {showPassword ? <IoEyeOutline size={20} /> : <IoEyeOffOutline size={20} />}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-2 px-1 text-xs text-red-500 font-bold">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                loading={isSubmitting}
                disabled={!linkChecked || !!linkError}
                className="w-full h-14 bg-sky-600 hover:bg-sky-700 text-white text-base font-bold rounded-2xl shadow-lg hover:shadow-sky-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
              >
                Reset password
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground">Remembered your password?</p>

              <Link
                href={APP_ROUTES.Signin}
                className="flex items-center gap-2 font-bold text-sky-600 hover:text-sky-700 transition-colors text-sm"
              >
                Back to sign in
              </Link>
            </div>
          </section>
        </main>

        <footer className="mt-6 text-center">
          <div className="flex items-center justify-center gap-6 text-sm">
            <Link
              href={APP_ROUTES.Help}
              className="flex items-center gap-2 text-muted-foreground hover:text-sky-500 font-semibold"
            >
              <HelpCircle className="w-4 h-4" />
              Help Center
            </Link>

            <span className="text-muted-foreground/30">•</span>

            <Link
              href="/safety"
              className="flex items-center gap-2 text-muted-foreground hover:text-sky-500 font-semibold"
            >
              <Shield className="w-4 h-4" />
              Safety First
            </Link>
          </div>

          <p className="mt-5 text-xs text-muted-foreground/50">
            © 2026 Kidoza AI Learning Buddy
          </p>
        </footer>
      </div>
    </div>
  );
}
