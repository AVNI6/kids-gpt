"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Loader2,
  Sparkles,
  UserRound,
  Building2,
  GraduationCap,
  School,
  CheckCircle2,
  Mail,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useFormStatus } from "react-dom";

import { submitTeacherOnboarding, type TeacherOnboardingState } from "@/actions/profile.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_ROUTES } from "@/constant/AppRoutes";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import Logo from "@/components/common/logo/Logo";

const initialTeacherState: TeacherOnboardingState = { error: null };

function TeacherSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-14 w-full rounded-2xl bg-indigo-600 text-base font-bold shadow-[0_16px_30px_rgba(79,70,229,0.32)] hover:bg-indigo-700"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Preparing workspace...
        </>
      ) : (
        <>
          Finish Teacher Setup
          <Sparkles className="ml-2 h-5 w-5" />
        </>
      )}
    </Button>
  );
}

export default function TeacherOnboardingPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [teacherState, teacherAction] = useActionState(
    submitTeacherOnboarding,
    initialTeacherState
  );

  useEffect(() => {
    if (teacherState.success) {
      toast.success(teacherState.message || "Classroom setup complete!");
      refreshProfile().then(() => {
        router.push("/");
      });
    } else if (teacherState.error) {
      toast.error(teacherState.error);
    }
  }, [teacherState, router, refreshProfile]);

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
                <GraduationCap className="text-white" />
              </div>

              <p className="text-xl text-muted-foreground italic leading-relaxed">
                “Hello Educator! Ready to inspire young minds? Let’s set up your classroom profile
                so you can start creating magical learning moments.”
              </p>

              <div className="mt-8 flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 dark:border-sky-500/30 dark:bg-sky-500/20">
                  <School className="w-4 h-4 text-sky-500" />
                  <span className="font-bold text-sm text-foreground/80">Classroom Ready</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 dark:border-emerald-500/30 dark:bg-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-sm text-foreground/80">Quick Start</span>
                </div>
              </div>

              <div className="absolute -bottom-16 -right-8 pointer-events-none">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxDgf-02-AXOs-V48tFjAQajOESWiJjOwgWc5kV1J90hdnwLqvUzFHNgYtZVHxmSl3C0mAUzg5Emwp_wwfdaYtZ9R33Sd2HlPVhWz_W8UrWEkscg-9r9kj3CmDECSyeRVwdDCaWQ8iBH5lqJ9WudeXzVoENYkxd33KnUk_r41pVqHoC_VRof_D9_zUE8N1VbWuXqekSJ9SM0tTGJ7R5zovAzRphvaDvSoWEkjUZnLZp97qZXP_Qds__dLdJ_J5r_r5LaT8jE5_lvI"
                  alt="Mascot"
                  width={140}
                  height={140}
                  className="h-32 w-32 object-contain"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Onboarding Card */}
        <Card className="rounded-[40px] border-2 border-border/50 bg-card/90 text-card-foreground p-8 shadow-[0_40px_80px_-24px_rgba(0,101,141,0.15)] backdrop-blur-xl sm:p-10 dark:border-slate-800">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-4xl font-black text-foreground tracking-tight sm:text-5xl">
              Teacher Profile
            </h2>
            <p className="mt-2 text-lg font-medium text-muted-foreground">
              Inspire the next generation! 🎓
            </p>
          </div>

          <div className="space-y-8">
            {/* Avatar Section */}
            <AvatarUpload />

            {/* Info Section */}
            <form action={teacherAction} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-bold text-foreground ml-1">
                    First Name<span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/50" />
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="e.g. Jordan"
                      required
                      className="h-12 rounded-2xl border-2 border-border pl-11 focus:border-sky-500 focus:ring-0 text-base font-medium bg-background text-foreground"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-bold text-foreground ml-1">
                    Last Name
                  </Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/50" />
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="e.g. Williams"
                      className="h-12 rounded-2xl border-2 border-border pl-11 focus:border-sky-500 focus:ring-0 text-base font-medium bg-background text-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="organizationName"
                  className="text-sm font-bold text-foreground ml-1"
                >
                  School <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    id="organizationName"
                    name="organizationName"
                    placeholder="e.g. Bright Future Academy"
                    className="h-12 rounded-2xl border-2 border-border pl-11 focus:border-sky-500 focus:ring-0 text-base font-medium bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentEmail" className="text-sm font-bold text-foreground ml-1">
                  Student&apos;s Email <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    id="studentEmail"
                    name="studentEmail"
                    type="email"
                    placeholder="student@example.com"
                    className="h-12 rounded-2xl border-2 border-border pl-11 focus:border-sky-500 focus:ring-0 text-base font-medium bg-background text-foreground"
                  />
                </div>
              </div>

              {teacherState.error && (
                <div className="animate-in fade-in slide-in-from-top-2 rounded-2xl border-2 border-rose-500/20 bg-rose-500/10 p-3 text-sm font-bold text-rose-500 text-center">
                  {teacherState.error}
                </div>
              )}

              <TeacherSubmitButton />
            </form>

            <p className="text-center text-xs font-bold text-muted-foreground">
              Need another account?{" "}
              <Link href={APP_ROUTES.Signin} className="text-sky-500 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
