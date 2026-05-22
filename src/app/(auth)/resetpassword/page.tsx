"use client";

import Link from "next/link";
import { ArrowRight, Lightbulb, HelpCircle, Shield, Bot, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { APP_ROUTES } from "@/constant/AppRoutes";
import { useEffect, useState } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";

const supabase = createClient();
export default function ForgotPasswordPage() {
  type FormValue = {
    password: string;
  };

  const { register, handleSubmit } = useForm<FormValue>();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (isMounted) {
        setIsSessionReady(Boolean(data.session));
      }
    };

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setIsSessionReady(Boolean(session));
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const onSubmit: SubmitHandler<FormValue> = async (e) => {
    if (!isSessionReady) {
      toast.error("Your reset link is still being verified. Please wait and try again.");
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase.auth.updateUser({
      password: e.password,
    });

    if (error) {
      console.error(error);
      toast.error("Password reset failed.", {
        description: error.message,
      });
      setIsSubmitting(false);
      return;
    }

    if (data?.user) {
      toast.success("Password reset successful!", {
        description: "You can now log in with your new password.",
      });
      setMessage("Password updated successfully! Redirecting to sign in...");
      await supabase.auth.signOut();
      setTimeout(() => {
        router.replace(APP_ROUTES.Signin);
      }, 2000);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#f6fafe] flex flex-col items-center px-6 py-3 relative overflow-hidden">
      <div className="my-auto w-full flex flex-col items-center">
        {/* Brand Header */}
        <header className="mb-3  text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#4cc2ff] rounded-2xl flex items-center justify-center border-b-4 border-[#004c6b] shadow-sm">
              <Bot className="w-7 h-7 text-white" />
            </div>

            <h1 className="text-4xl font-extrabold text-[#00658d] tracking-tight">ChatGPT Kid</h1>
          </div>

          <p className="text-[#3e484f] text-lg">Your AI Learning Buddy</p>
        </header>

        {/* Main Section */}
        <main className="w-full max-w-140 relative">
          {/* Main Card */}
          <section className="bg-white border-2 border-[#4cc2ff] rounded-[2rem] p-8 shadow-[12px_12px_0px_0px_#c6e7ff] relative overflow-hidden">
            {/* Tip Section */}
            <div className="bg-[#f0f4f8] rounded-2xl p-5 mb-8 border-2 border-dashed border-[#4cc2ff] flex gap-4 items-start">
              <Lightbulb className="w-8 h-8 text-[#00658d] shrink-0" />

              <div>
                <h3 className="text-2xl font-bold text-[#00658d] mb-2">Reset Your Password</h3>
                <p className="text-[#3e484f] leading-relaxed">
                  {isSessionReady
                    ? "Enter a new password to finish updating your account."
                    : "Verifying your secure reset link..."}
                </p>
              </div>
              {message && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{message}</div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-[#3e484f] mb-3 px-2">
                  ENTER YOUR PASSWORD
                </label>

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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isSessionReady || isSubmitting}
                className="w-full h-16 bg-[#00658d] text-white text-xl font-bold rounded-2xl border-b-8 border-[#004c6b] hover:-translate-y-1 active:translate-y-1 active:border-b-2 transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <span>{isSubmitting ? "Resetting..." : "Reset password"}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-4 pt-4 border-t-2 border-gray-200 flex flex-col items-center gap-4">
              <p className="text-[#3e484f]">Remembered your password?</p>
            </div>
          </section>

          {/* Decorative Blobs */}
          <div className="absolute -bottom-6 -left-6 -z-10 w-24 h-24 bg-orange-300 rounded-full opacity-20 blur-2xl" />
          <div className="absolute -top-12 -left-12 -z-10 w-32 h-32 bg-green-300 rounded-full opacity-20 blur-2xl" />
        </main>

        {/* Footer */}
        <footer className="mt-6 text-center">
          <div className="flex items-center justify-center gap-6">
            <Link
              href={APP_ROUTES.Help}
              className="flex items-center gap-2 text-gray-500 hover:text-[#00658d] font-semibold"
            >
              <HelpCircle className="w-4 h-4" />
              Help Center
            </Link>

            <span className="text-gray-300">•</span>

            <Link
              href="/safety"
              className="flex items-center gap-2 text-gray-500 hover:text-[#00658d] font-semibold"
            >
              <Shield className="w-4 h-4" />
              Safety First
            </Link>
          </div>

          <p className="mt-5 text-sm text-gray-400">© 2026 ChatGPT Kid AI Learning Buddy</p>
        </footer>
      </div>
    </div>
  );
}
