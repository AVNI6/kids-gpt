import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import Logo from "@/components/shared/logo/Logo";
import { LucideIcon } from "lucide-react";

type BadgeItem = {
  text: string;
  icon: LucideIcon;
};

type OnboardingLayoutProps = {
  leftIcon: LucideIcon;
  quote: string;
  badges: BadgeItem[];
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function OnboardingLayout({
  leftIcon: LeftIcon,
  quote,
  badges,
  title,
  description,
  children,
  footer,
}: OnboardingLayoutProps) {
  return (
    <main className="min-h-screen flex flex-col px-6 font-sans bg-gradient-to-br from-sky-100 via-background to-emerald-50/30 dark:from-slate-950 dark:via-background dark:to-slate-950">
      <div className="my-auto mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* Left Side: Creative Content */}
        <div className="hidden flex-col gap-8 lg:flex">
          <Link href="/" className="flex items-center gap-4">
            <Logo />
          </Link>

          <Card className="relative border-2 border-border/50 rounded-[32px] bg-card text-card-foreground p-2 shadow-xl overflow-visible dark:border-slate-800">
            <CardContent className="p-8">
              <div className="absolute -top-5 -left-5 w-14 h-14 rounded-full bg-sky-600 flex items-center justify-center shadow-lg dark:bg-sky-500">
                <LeftIcon className="text-white" />
              </div>

              <p className="text-xl text-muted-foreground italic leading-relaxed">{quote}</p>

              <div className="mt-8 flex gap-3 flex-wrap">
                {badges.map((badge, idx) => {
                  const Icon = badge.icon;
                  const borderBgClass =
                    idx === 0
                      ? "border-sky-500/20 bg-sky-500/10 dark:border-sky-500/30 dark:bg-sky-500/20"
                      : "border-emerald-500/20 bg-emerald-500/10 dark:border-emerald-500/30 dark:bg-emerald-500/20";
                  const textIconClass = idx === 0 ? "text-sky-500" : "text-emerald-500";

                  return (
                    <div
                      key={badge.text}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 ${borderBgClass}`}
                    >
                      <Icon className={`w-4 h-4 ${textIconClass}`} />
                      <span className="font-bold text-sm text-foreground/80">{badge.text}</span>
                    </div>
                  );
                })}
              </div>

              <div className="absolute -bottom-16 -right-8 pointer-events-none">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxDgf-02-AXOs-V48tFjAQajOESWiJjOwgWc5kV1J90hdnwLqvUzFHNgYtZVHxmSl3C0mAUzg5Emwp_wwfdaYtZ9R33Sd2HlPVhWz_W8UrWEkscg-9r9kj3CmDECSyeRVwdDCaWQ8iBH5lqJ9WudeXzVoENYkxd33KnUk_r41pVqHoC_VRof_D9_zUE8N1VbWuXqekSJ9SM0tTGJ7R5zovAzRphvaDvSoWEkjUZnLZp97qZXP_Qds__dLdJ_J5r_r5LaT8jE5_lvI"
                  alt="Mascot"
                  width={140}
                  height={140}
                  loading="eager"
                  className="h-32 w-32 object-contain"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Onboarding Card */}
        <Card className="rounded-[40px] border-2 border-border/50 bg-card/90 text-card-foreground p-8 shadow-[0_40px_80px_-24px_rgba(0,101,141,0.15)] backdrop-blur-xl sm:p-10 dark:border-slate-800">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-4xl font-black text-foreground tracking-tight">{title}</h2>
            <p className="mt-2 text-lg font-medium text-muted-foreground">{description}</p>
          </div>

          <div className="space-y-8">
            {children}
            {footer}
          </div>
        </Card>
      </div>
    </main>
  );
}
