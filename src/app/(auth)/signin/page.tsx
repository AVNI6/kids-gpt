"use client";
import { Mail, Lock, CheckCircle, BookOpen, Brain } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main
      className="min-h-[calc(100vh-4rem)] flex flex-col px-6 py-10 font-['Lexend']"
      style={{
        background: `radial-gradient(circle at top left, #c6e7ff 0%, #f6fafe 45%, rgb(132 251 66 / 0.08) 100%)`,
      }}
    >
      <div className="my-auto mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* Left Side */}
        <div className="hidden flex-col gap-8 lg:flex">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-bold text-theme-brand">
              ChatGPT Kid
            </h1>
          </div>

          {/* Welcome Card */}
          <div className="relative rounded-[32px] border-2 border-theme-border-light bg-white p-8 shadow-xl">
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-3xl font-bold text-theme-brand">
              Welcome Back!
            </h2>

            <p className="leading-relaxed text-theme-text-secondary">
              Your AI learning buddy is waiting for you 🚀
              <br />
              Continue your learning adventure.
            </p>

            <div className="absolute -bottom-14 right-6">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxDgf-02-AXOs-V48tFjAQajOESWiJjOwgWc5kV1J90hdnwLqvUzFHNgYtZVHxmSl3C0mAUzg5Emwp_wwfdaYtZ9R33Sd2HlPVhWz_W8UrWEkscg-9r9kj3CmDECSyeRVwdDCaWQ8iBH5lqJ9WudeXzVoENYkxd33KnUk_r41pVqHoC_VRof_D9_zUE8N1VbWuXqekSJ9SM0tTGJ7R5zovAzRphvaDvSoWEkjUZnLZp97qZXP_Qds__dLdJ_J5r_r5LaT8jE5_lvI"
                alt="Mascot"
                className="h-32 w-32"
              />
            </div>
          </div>

          {/* Feature Tags */}
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
                  className="flex items-center gap-2 rounded-full border border-theme-border-light bg-white px-4 py-2"
                >
                  <IconComponent size={20} className="text-theme-brand" />
                  <span className="font-semibold">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side Login Card */}
        <div className="rounded-[32px] border-2 border-theme-border-light bg-white p-8 shadow-xl md:p-10">
          <div className="mb-8">
            <h2 className="mb-2 font-['Plus_Jakarta_Sans'] text-4xl font-bold text-theme-brand">
              Sign In
            </h2>
            <p className="text-theme-text-secondary">Access your learning dashboard</p>
          </div>

          <form className="space-y-6">
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold">Parent’s Email</label>

              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />

                <input
                  type="email"
                  placeholder="parent@example.com"
                  className="w-full rounded-full border-2 border-gray-200 py-4 pl-12 pr-4 outline-none transition focus:border-theme-brand"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex justify-between">
                <label className="text-sm font-semibold">Password</label>
                <Link
                  href="/forgotpassword"
                  className="text-sm font-semibold text-theme-brand hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />

                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-full border-2 border-gray-200 py-4 pl-12 pr-4 outline-none transition focus:border-theme-brand"
                />
              </div>
            </div>

            {/* Remember */}
            <div className="flex items-center gap-3">
              <input type="checkbox" className="h-5 w-5 rounded" />
              <span className="text-sm text-theme-text-secondary">Keep me logged in</span>
            </div>

            {/* Button */}
            <button
              type="submit"
              className="w-full rounded-full bg-theme-brand py-4 font-bold  shadow-[0_8px_0_rgb(0_77_109)] transition hover:-translate-y-1"
            >
              Sign In 🚀
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>

            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-gray-400">OR</span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button className="rounded-full border-2 py-3 font-semibold hover:bg-gray-50">
              Google
            </button>

            <button className="rounded-full border-2 py-3 font-semibold hover:bg-gray-50">
              Apple
            </button>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-theme-text-secondary">
            New explorer?{" "}
            <a href="/signup" className="font-semibold text-theme-brand hover:underline">
              Create account
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
