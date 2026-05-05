"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Lightbulb,
  ShieldCheck,
  School,
  User,
  Mail,
  Lock,
  Rocket,
  Users,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import { SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const supabase = createClient();

export default function ChatGPTKidSignupPage() {
  const router = useRouter();
  const [signupState, setSignupState] = useState<"idle" | "loading" | "check-email">("idle");

  type FormValue = {
    name: string;
    email: string;
    password: string;
  };

  const { register, handleSubmit } = useForm<FormValue>();

  const onSubmit: SubmitHandler<FormValue> = async (e) => {
    setSignupState("loading");

    const { data, error } = await supabase.auth.signUp({
      email: e.email,
      password: e.password,
      options: {
        data: {
          fullname: e.name,
        },
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });

    if (error) {
      console.error(error);
      setSignupState("idle");

      // Handle the common Supabase 500 error (SMTP/Redirect URL configuration)
      const isConfirmationError = error.message.toLowerCase().includes("confirmation email");
      const errorMessage = isConfirmationError
        ? "Signup server error: Please ensure your Supabase SMTP and Redirect URLs are configured."
        : error.message;

      toast.error("Signup failed", { description: errorMessage });
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

      setSignupState("check-email");
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col px-6 font-sans"
      style={{
        background: `radial-gradient(circle at top left, #c6e7ff 0%, #f6fafe 45%, rgb(132 251 66 / 0.08) 100%)`,
      }}
    >
      <div className="my-auto mx-auto max-w-6xl w-full grid lg:grid-cols-2 gap-10 items-center">
        <div className="hidden lg:flex flex-col gap-8 relative">
          <Link href="/" className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg">
                <Sparkles className="text-white w-8 h-8" />
              </div>
              <h1 className="text-5xl font-black text-sky-600">ChatGPT Kid</h1>
            </div>
          </Link>

          <Card className="relative border-2 border-theme-border-light rounded-[32px] bg-white p-2 shadow-xl overflow-visible">
            <CardContent className="p-8">
              <div className="absolute -top-5 -left-5 w-14 h-14 rounded-full bg-blue-900 flex items-center justify-center shadow-lg">
                <Lightbulb className="text-white" />
              </div>

              <p className="text-xl text-slate-600 italic leading-relaxed">
                “Hi there! I’m your AI learning buddy. Let’s create your account and start exploring
                fun adventures together!”
              </p>

              <div className="mt-8 flex gap-3 flex-wrap">
                <Button
                  variant="outline"
                  className="rounded-full px-4 py-2 flex items-center gap-2 pointer-events-none"
                >
                  <ShieldCheck className="w-4 h-4 text-sky-500" />
                  <span className="font-semibold text-sm">Kid-Safe AI</span>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full px-4 py-2 flex items-center gap-2 pointer-events-none"
                >
                  <School className="w-4 h-4 text-green-500" />
                  <span className="font-semibold text-sm">Teacher Approved</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[32px] border-2 border-theme-border-light bg-white shadow-xl overflow-hidden">
          <CardContent className="p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-2 text-theme-brand">Create Account</h2>
              <p className="text-slate-500">
                Fill in the bubbles to start your learning journey 🚀
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="font-semibold">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                  <Input
                    {...register("name", { required: true })}
                    className="pl-12 h-14 rounded-4xl focus-visible:ring-sky-500"
                    placeholder="Alex Explorer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                  <Input
                    {...register("email", { required: true })}
                    type="email"
                    className="pl-12 h-14 rounded-4xl focus-visible:ring-sky-500"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                  <Input
                    {...register("password", { required: true })}
                    type="password"
                    className="pl-12 h-14 rounded-4xl focus-visible:ring-sky-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox required />
                <p className="text-sm text-slate-500 leading-relaxed">
                  I agree to the{" "}
                  <Link href="#" className="text-sky-600 font-semibold hover:underline">
                    Safety Rules
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="text-sky-600 font-semibold hover:underline">
                    Privacy Terms
                  </Link>
                </p>
              </div>

              <Button
                type="submit"
                disabled={signupState === "loading"}
                className="w-full h-14 rounded-2xl text-lg font-bold flex items-center gap-2 bg-theme-brand text-black shadow-[0_8px_0_rgb(0_77_109)] transition active:translate-y-1 active:shadow-none"
              >
                {signupState === "loading" ? "Creating Account..." : "Create Account"}
                <Rocket className="w-5 h-5" />
              </Button>

              {signupState === "check-email" && (
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-slate-700 animate-in fade-in slide-in-from-top-2">
                  Check your email to confirm your account. Once confirmed, you can sign in and
                  continue to your onboarding flow.
                </div>
              )}

              <p className="text-center text-slate-500">
                Already an explorer?{" "}
                <Link href="/signin" className="font-semibold text-theme-brand hover:underline">
                  Log in here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
