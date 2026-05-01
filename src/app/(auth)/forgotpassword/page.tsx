"use client";

import Link from "next/link";
import { Mail, ArrowRight, Lightbulb, ArrowLeft, HelpCircle, Shield, Bot } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SubmitHandler, useForm } from "react-hook-form";

const supabase = createClient();
export default function ForgotPasswordPage() {
  type FormValue = {
    email: string;
  };

  const { register, handleSubmit } = useForm<FormValue>();

  const onSubmit: SubmitHandler<FormValue> = async (e) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(e.email, {
      redirectTo: `${window.location.origin}/signin`,
    });
    if (error) {
      console.error(error);
    }
    if (data) {
      alert("Reset link sent! Please check your email.");
    }
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
                <h3 className="text-2xl font-bold text-[#00658d] mb-2">Forgot your key?</h3>

                <p className="text-[#3e484f] leading-relaxed">
                  Don’t worry! Enter your email below, and we’ll send you a special reset link to
                  continue your learning adventure.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-[#3e484f] mb-3 px-2">
                  ENTER YOUR EMAIL
                </label>

                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />

                  <input
                    type="email"
                    {...register("email", { required: true })}
                    placeholder="student@learning.com"
                    required
                    className="w-full h-16 pl-14 pr-5 bg-white border-2 border-gray-300 focus:border-[#00658d] rounded-2xl text-lg outline-none transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full h-16 bg-[#00658d] text-white text-xl font-bold rounded-2xl border-b-8 border-[#004c6b] hover:-translate-y-1 active:translate-y-1 active:border-b-2 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>Send Reset Link</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-4 pt-4 border-t-2 border-gray-200 flex flex-col items-center gap-4">
              <p className="text-[#3e484f]">Remembered your password?</p>

              <Link
                href="/signin"
                className="flex items-center gap-2 font-bold text-[#00658d] hover:text-[#004c6b] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
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
              href="/help"
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
