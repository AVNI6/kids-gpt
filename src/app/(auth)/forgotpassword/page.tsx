"use client";

import Link from "next/link";
import { Mail, ArrowRight, Lightbulb, ArrowLeft, HelpCircle, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { APP_ROUTES } from "@/lib/constants/common";
import { useState } from "react";
import Logo from "@/components/shared/logo/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { checkIfEmailExists } from "@/lib/services/shared/profile.actions";

const supabase = createClient();

export default function ForgotPasswordPage() {
  type FormValue = {
    email: string;
  };

  const { register, handleSubmit } = useForm<FormValue>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit: SubmitHandler<FormValue> = async (e) => {
    setIsSubmitting(true);
    
    try {
      const exists = await checkIfEmailExists(e.email);
      if (!exists) {
        toast.error("Account does not exist.");
        setIsSubmitting(false);
        return;
      }

      const { data, error } = await supabase.auth.resetPasswordForEmail(e.email, {
        redirectTo: `${window.location.origin}/auth/reset-callback`,
      });

      if (error) {
        toast.error("Reset link failed to send", {
          description: error.message,
        });
        setIsSubmitting(false);
        return;
      }

      if (data) {
        toast.success("Reset link sent!", {
          description: "Please check your email for instructions.",
        });
      }
    } catch (err) {
      toast.error("An error occurred", {
        description: err instanceof Error ? err.message : "Failed to reset password.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-6 py-3 relative overflow-hidden transition-colors duration-300">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 dark:opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[120px]" />
      </div>

      <div className="my-auto w-full flex flex-col items-center relative z-10">
        {/* Brand Header */}
        <header className="mb-3 text-center flex flex-col items-center">
          <Logo size="md" className="justify-center" />
          <p className="text-muted-foreground text-sm mt-1">Your AI Learning Buddy</p>
        </header>

        {/* Main Section */}
        <main className="w-full max-w-lg relative">
          {/* Main Card */}
          <section className="bg-card border-2 border-border/80 rounded-[2rem] p-8 shadow-xl relative overflow-hidden dark:border-slate-800">
            {/* Tip Section */}
            <div className="bg-muted/50 rounded-2xl p-5 mb-8 border-2 border-dashed border-sky-450/40 flex gap-4 items-start">
              <Lightbulb className="w-8 h-8 text-sky-500 shrink-0" />

              <div>
                <h3 className="text-xl font-bold text-sky-600 dark:text-sky-400 mb-2">
                  Forgot your key?
                </h3>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  Don’t worry! Enter your email below, and we’ll send you a special reset link to
                  continue your learning adventure.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                  Enter Your Email
                </Label>

                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/50 w-5 h-5 z-10" />

                  <Input
                    type="email"
                    {...register("email", { required: true })}
                    placeholder="student@learning.com"
                    required
                    className="w-full h-14 pl-14 pr-5 bg-muted/30 border-2 border-border focus-visible:border-sky-500 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-2xl text-base outline-none transition-all text-foreground"
                  />
                </div>
              </div>

              <Button
                type="submit"
                loading={isSubmitting}
                className="w-full h-14 bg-sky-600 hover:bg-sky-700 text-white text-base font-bold rounded-2xl shadow-lg hover:shadow-sky-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                Send Reset Link
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 pt-6 border-t border-border flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground">Remembered your password?</p>

              <Link
                href={APP_ROUTES.Signin}
                className="flex items-center gap-2 font-bold text-sky-600 hover:text-sky-700 transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          </section>
        </main>

        {/* Footer */}
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
