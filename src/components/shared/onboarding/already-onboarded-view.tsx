"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, LogIn } from "lucide-react";
import Image from "next/image";
import Logo from "@/components/shared/logo/Logo";

export function AlreadyOnboardedView() {
  return (
    <main className="min-h-screen flex flex-col px-6 font-sans bg-gradient-to-br from-sky-100 via-background to-emerald-50/30 dark:from-slate-950 dark:via-background dark:to-slate-950 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[120px]" />
      </div>

      <div className="my-auto mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2 relative z-10">
        {/* Left Side: Creative Content */}
        <div className="hidden flex-col gap-8 lg:flex">
          <Link href="/" className="flex items-center gap-4">
            <Logo />
          </Link>

          <Card className="relative border-2 border-border/50 rounded-[32px] bg-card text-card-foreground p-2 shadow-xl overflow-visible dark:border-slate-800">
            <CardContent className="p-8">
              <div className="absolute -top-5 -left-5 w-14 h-14 rounded-full bg-sky-600 flex items-center justify-center shadow-lg dark:bg-sky-500">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>

              <p className="text-xl text-muted-foreground italic leading-relaxed">
                {
                  '"Looks like you\'re already set up for adventures! Head to the sign-in page to access your learning space."'
                }
              </p>

              <div className="absolute -bottom-16 -right-8 pointer-events-none">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxDgf-02-AXOs-V48tFjAQajOESWiJjOwgWc5kV1J90hdnwLqvUzFHNgYtZVHxmSl3C0mAUzg5Emwp_wwfdaYtZ9R33Sd2HlPVhWz_W8UrWEkscg-9r9kj3CmDECSyeRVwdDCaWQ8iBH5lqJ9WudeXzVoENYkxd33KnUk_r41pVqHoC_VRof_D9_zUE8N1VbWuXqekSJ9SM0tTGJ7R5zovAzRphvaDvSoWEkjUZnLZp97qZXP_Qds__dLdJ_J5r_r5LaT8jE5_lvI"
                  alt="Mascot"
                  width={140}
                  height={140}
                  loading="lazy"
                  className="h-32 w-32 object-contain"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Message Card */}
        <Card className="rounded-[40px] border-2 border-border/50 bg-card/90 text-card-foreground p-8 shadow-[0_40px_80px_-24px_rgba(0,101,141,0.15)] backdrop-blur-xl sm:p-10 dark:border-slate-800">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-black text-foreground tracking-tight">
              Onboarding Completed
            </h2>
            <p className="mt-2 text-base font-medium text-muted-foreground">
              You have already completed onboarding. Please sign in.
            </p>
          </div>

          <div className="space-y-6">
            <Link href="/signin" className="block w-full">
              <Button className="h-14 w-full rounded-2xl bg-sky-600 hover:bg-sky-700 text-base font-bold shadow-[0_16px_30px_rgba(2,132,199,0.3)] transition hover:-translate-y-0.5 text-white flex items-center justify-center gap-2">
                Go to Sign In
                <LogIn className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
