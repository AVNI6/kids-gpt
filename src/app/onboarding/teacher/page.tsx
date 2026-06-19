"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
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
import { toast } from "sonner";
import { useFormStatus } from "react-dom";

import {
  submitTeacherOnboarding,
  type TeacherOnboardingState,
} from "@/lib/services/shared/profile.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_ROUTES } from "@/lib/constants/common";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { OnboardingLayout } from "@/components/shared/onboarding/onboarding-layout";

import { AlreadyOnboardedView } from "@/components/shared/onboarding/already-onboarded-view";

const initialTeacherState: TeacherOnboardingState = { error: null };

function TeacherSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      loading={pending}
      loadingText="Preparing workspace..."
      className="h-14 w-full rounded-2xl bg-indigo-600 text-base font-bold shadow-[0_16px_30px_rgba(79,70,229,0.32)] hover:bg-indigo-700"
    >
      Finish Teacher Setup
      <Sparkles className="ml-2 h-5 w-5" />
    </Button>
  );
}

export default function TeacherOnboardingPage() {
  const router = useRouter();
  const { user, userProfile, isLoading, refreshProfile } = useAuth();
  const [teacherState, teacherAction] = useActionState(
    submitTeacherOnboarding,
    initialTeacherState
  );
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/signin");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (teacherState.success && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.success(teacherState.message || "Classroom setup complete!");
      refreshProfile().then(() => {
        router.push("/");
      });
    } else if (teacherState.error) {
      toast.error(teacherState.error);
    }
  }, [teacherState, router, refreshProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (userProfile?.is_onboarded) {
    return <AlreadyOnboardedView />;
  }

  const fullName = user?.user_metadata?.fullname || user?.user_metadata?.full_name || "";
  const parts = fullName.trim().split(/\s+/);
  const defaultFirstName = parts[0] || "";
  const defaultLastName = parts.slice(1).join(" ") || "";

  return (
    <OnboardingLayout
      leftIcon={GraduationCap}
      quote="“Hello Educator! Ready to inspire young minds? Let’s set up your classroom profile so you can start creating magical learning moments.”"
      badges={[
        { text: "Classroom Ready", icon: School },
        { text: "Quick Start", icon: CheckCircle2 },
      ]}
      title="Teacher Profile"
      description="Inspire the next generation!"
      footer={
        <p className="text-center text-xs font-bold text-muted-foreground">
          Need another account?{" "}
          <Link href={APP_ROUTES.Signin} className="text-sky-500 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
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
                defaultValue={defaultFirstName}
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
                defaultValue={defaultLastName}
                placeholder="e.g. Williams"
                className="h-12 rounded-2xl border-2 border-border pl-11 focus:border-sky-500 focus:ring-0 text-base font-medium bg-background text-foreground"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizationName" className="text-sm font-bold text-foreground ml-1">
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
    </OnboardingLayout>
  );
}
