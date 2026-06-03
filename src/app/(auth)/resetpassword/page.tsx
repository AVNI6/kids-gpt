"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { ArrowRight, Lightbulb, HelpCircle, Shield, Lock } from "lucide-react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";

import { createClient } from "@/lib/supabase/client";
import { APP_ROUTES } from "@/lib/constants/common";
import Logo from "@/components/shared/ui/Logo";

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
    const initRecoverySession = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        let sessionReady = false;

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            sessionReady = true;
          }
        }

        if (!sessionReady) {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          const type = hashParams.get("type");

          if (type === "recovery" && accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!error) {
              sessionReady = true;
            }
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session && !sessionReady) {
          setLinkError("This reset link is invalid or expired. Please request a new one.");
        } else {
          setLinkError("");
          window.history.replaceState({}, "", "/resetpassword");
        }
      } catch {
        setLinkError("Unable to verify reset link. Please request a new one.");
      } finally {
        setLinkChecked(true);
      }
    };

    initRecoverySession();
  }, []);

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
    <div className="min-h-screen bg-[#f6fafe] flex flex-col items-center px-6 py-3 relative overflow-hidden">
      <div className="my-auto w-full flex flex-col items-center">
        <header className="mb-3 text-center">
          <Logo size="md" iconType="bot" className="justify-center" />

          <p className="text-[#3e484f] text-lg">Your AI Learning Buddy</p>
        </header>

        <main className="w-full max-w-140 relative">
          <section className="bg-white border-2 border-[#4cc2ff] rounded-[2rem] p-8 shadow-[12px_12px_0px_0px_#c6e7ff] relative overflow-hidden">
            <div className="bg-[#f0f4f8] rounded-2xl p-5 mb-8 border-2 border-dashed border-[#4cc2ff] flex gap-4 items-start">
              <Lightbulb className="w-8 h-8 text-[#00658d] shrink-0" />

              <div>
                <h3 className="text-2xl font-bold text-[#00658d] mb-2">Reset Your Password</h3>
                <p className="text-[#3e484f] leading-relaxed">
                  {linkChecked
                    ? linkError
                      ? linkError
                      : "Enter a new password to finish updating your account."
                    : "Verifying your secure reset link..."}
                </p>
              </div>
            </div>

            {message && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{message}</div>
            )}

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
                    {...register("password", {
                      required: true,
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
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

                {errors.password && (
                  <p className="mt-2 px-2 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !linkChecked || !!linkError}
                className="w-full h-16 bg-[#00658d] text-white text-xl font-bold rounded-2xl border-b-8 border-[#004c6b] hover:-translate-y-1 active:translate-y-1 active:border-b-2 transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <span>{isSubmitting ? "Resetting..." : "Reset password"}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            <div className="mt-4 pt-4 border-t-2 border-gray-200 flex flex-col items-center gap-4">
              <p className="text-[#3e484f]">Remembered your password?</p>

              <Link
                href={APP_ROUTES.Signin}
                className="flex items-center gap-2 font-bold text-[#00658d] hover:text-[#004c6b] transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          </section>

          <div className="absolute -bottom-6 -left-6 -z-10 w-24 h-24 bg-orange-300 rounded-full opacity-20 blur-2xl" />
          <div className="absolute -top-12 -left-12 -z-10 w-32 h-32 bg-green-300 rounded-full opacity-20 blur-2xl" />
        </main>

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
