"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, School, User, Mail, Lock, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { APP_ROUTES } from "@/lib/constants/common";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import Logo from "@/components/shared/logo/Logo";

const supabase = createClient();

export default function ChatGPTKidSignupPage() {
  const router = useRouter();
  const [signupState, setSignupState] = useState<"idle" | "loading" | "check-email">("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [activeModal, setActiveModal] = useState<"safety" | "privacy" | null>(null);

  type FormValue = {
    name: string;
    email: string;
    password: string;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValue>();
  const [agreed, setAgreed] = useState(false);

  const onSubmit: SubmitHandler<FormValue> = async (e) => {
    if (!agreed) {
      toast.error("Terms & Safety Rules Agreement Required", {
        description: "Please check the box to agree to the Safety Rules and Privacy Terms.",
      });
      return;
    }

    setSignupState("loading");

    const siteUrl = window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email: e.email,
      password: e.password,
      options: {
        data: {
          fullname: e.name,
        },
        emailRedirectTo: `${siteUrl}/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      setSignupState("idle");

      toast.error("Signup failed", {
        description: error.message,
      });
      return;
    }
    if (data) {
      toast.success("Signup successful!", {
        description: "Please check your email to confirm your account.",
      });

      if (data.session) {
        router.push(`/onboarding`);
        return;
      }

      router.push(`/signin?from=signup`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col px-6 font-sans bg-background relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[120px]" />
      </div>

      <div className="my-auto mx-auto max-w-6xl w-full grid lg:grid-cols-2 gap-10 items-center relative z-10">
        <div className="hidden lg:flex flex-col gap-8 relative">
          <Link href="/" className="flex items-center gap-4">
            <Logo />
          </Link>

          <Card className="relative border-2 border-border/50 rounded-[32px] bg-card p-2 shadow-xl overflow-visible">
            <CardContent className="p-8">
              <p className="text-xl text-muted-foreground italic leading-relaxed">
                “Hi there! I’m your AI learning buddy. Let’s create your account and start exploring
                fun adventures together!”
              </p>

              <div className="mt-8 flex gap-3 flex-wrap">
                <Button
                  variant="outline"
                  className="rounded-full px-4 py-2 flex items-center gap-2 pointer-events-none border-border/50"
                >
                  <ShieldCheck className="w-4 h-4 text-sky-500" />
                  <span className="font-semibold text-sm text-foreground">Kid-Safe AI</span>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full px-4 py-2 flex items-center gap-2 pointer-events-none border-border/50"
                >
                  <School className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold text-sm text-foreground">Teacher Approved</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[32px] border-2 border-border/50 bg-card shadow-xl overflow-hidden">
          <CardContent className="p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-2 text-foreground">Create Account</h2>
              <p className="text-muted-foreground">
                Fill in the bubbles to start your learning journey 🚀
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="block mb-2 font-semibold text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                  <Input
                    {...register("name", { required: true })}
                    className="pl-12 h-14 rounded-4xl border-border bg-muted/50 focus-visible:ring-sky-500 text-foreground"
                    placeholder="Alex Explorer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block mb-2 font-semibold text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                  <Input
                    {...register("email", { required: true })}
                    type="email"
                    className="pl-12 h-14 rounded-4xl border-border bg-muted/50 focus-visible:ring-sky-500 text-foreground"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block mb-2 font-semibold text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                  <Input
                    {...register("password", {
                      required: "Password is required",
                      validate: {
                        minLength: (v) =>
                          v.length >= 8 || "Password must be at least 8 characters long",
                        hasUppercase: (v) =>
                          /[A-Z]/.test(v) || "Password must contain at least 1 uppercase letter",
                        hasSpecial: (v) =>
                          /[^A-Za-z0-9]/.test(v) ||
                          "Password must contain at least 1 special symbol",
                      },
                    })}
                    type={showPassword ? "text" : "password"}
                    className="pl-12 pr-12 h-14 rounded-4xl border-border bg-muted/50 focus-visible:ring-sky-500 text-foreground"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-black transition-colors"
                  >
                    {showPassword ? <IoEyeOutline size={20} /> : <IoEyeOffOutline size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 px-1 text-xs text-red-500 font-bold animate-in fade-in slide-in-from-top-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="agree-terms"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked === true)}
                />
                <label
                  htmlFor="agree-terms"
                  className="text-sm text-muted-foreground leading-relaxed cursor-pointer select-none"
                >
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setActiveModal("safety")}
                    className="text-sky-600 font-semibold hover:underline bg-transparent border-none p-0 inline cursor-pointer outline-none"
                  >
                    Safety Rules
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={() => setActiveModal("privacy")}
                    className="text-sky-600 font-semibold hover:underline bg-transparent border-none p-0 inline cursor-pointer outline-none"
                  >
                    Privacy Terms
                  </button>
                </label>
              </div>

              <Button
                type="submit"
                disabled={signupState === "loading"}
                className="w-full h-14 rounded-2xl text-lg font-bold flex items-center gap-2 text-black bg-theme-brand dark:text-white dark:bg-sky-500 shadow-[0_8px_0_rgb(0_77_109)] dark:shadow-[0_8px_0_rgba(14,165,233,0.4)] transition hover:-translate-y-0.5"
              >
                {signupState === "loading" ? "Creating Account..." : "Create Account"}
                <Rocket className="w-5 h-5" />
              </Button>

              {signupState === "check-email" && (
                <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-foreground animate-in fade-in slide-in-from-top-2">
                  Check your email to confirm your account. Once confirmed, you can sign in and
                  continue to your onboarding flow.
                </div>
              )}

              <p className="text-center text-muted-foreground">
                Already an explorer?{" "}
                <Link
                  href={APP_ROUTES.Signin}
                  className="font-semibold text-sky-500 hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={activeModal !== null} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 p-6 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              {activeModal === "safety" ? "🛡️ Safety Rules" : "🔒 Privacy Terms"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {activeModal === "safety"
                ? "Here is how to stay safe and have fun with your AI learning buddy!"
                : "How we protect your data and keep your learning journey private."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {activeModal === "safety" ? (
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100/30">
                  <span className="text-xl">🤝</span>
                  <div>
                    <h4 className="font-bold text-slate-850 dark:text-slate-200">
                      Be Kind & Respectful
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Always talk nicely to your AI buddy, just like you would to a friend at
                      school.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/30">
                  <span className="text-xl">🤫</span>
                  <div>
                    <h4 className="font-bold text-slate-850 dark:text-slate-200">
                      Keep Secrets Secret
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Never tell the AI your real home address, phone number, school name, or
                      passwords.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/30">
                  <span className="text-xl">🙋‍♂️</span>
                  <div>
                    <h4 className="font-bold text-slate-850 dark:text-slate-200">Ask a Grown-up</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      If the AI ever says anything that makes you feel weird or uncomfortable, tell
                      your parent or teacher right away.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/30">
                  <span className="text-xl">🚀</span>
                  <div>
                    <h4 className="font-bold text-slate-850 dark:text-slate-200">
                      Learn & Explore
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Use the chat to ask cool questions, read amazing stories, and get help with
                      homework!
                    </p>
                  </div>
                </li>
              </ul>
            ) : (
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/30">
                  <span className="text-xl">🛡️</span>
                  <div>
                    <h4 className="font-bold text-slate-850 dark:text-slate-200">We Protect You</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      We do not sell your personal details, and we do not advertise inside the
                      application.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100/30">
                  <span className="text-xl">👨‍👩‍👧</span>
                  <div>
                    <h4 className="font-bold text-slate-850 dark:text-slate-200">
                      Parent & Teacher Oversight
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Your linked parent or teacher can see your chat history and progress logs to
                      help guide you.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/30">
                  <span className="text-xl">🔒</span>
                  <div>
                    <h4 className="font-bold text-slate-850 dark:text-slate-200">Secure Storage</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      All details and chat sessions are stored behind secure databases with limited
                      access.
                    </p>
                  </div>
                </li>
              </ul>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              onClick={() => setActiveModal(null)}
              className="w-full sm:w-auto rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold px-5 py-2.5 cursor-pointer"
            >
              I Understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
