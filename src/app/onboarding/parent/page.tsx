"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Loader2, Sparkles, UserRound, Users, ShieldCheck, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useFormStatus } from "react-dom";

import {
  submitParentOnboarding,
  type ParentOnboardingState,
} from "@/lib/services/shared/profile.actions";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { APP_ROUTES } from "@/lib/constants/common";
import { AvatarUpload } from "@/components/shared/ui/avatar-upload";
import { OnboardingLayout } from "@/components/shared/onboarding/onboarding-layout";

const initialParentState: ParentOnboardingState = { error: null };

function ParentSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-14 w-full rounded-2xl bg-sky-600 text-base font-bold shadow-[0_16px_30px_rgba(2,132,199,0.3)] hover:bg-sky-700"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Saving profile...
        </>
      ) : (
        <>
          Finish Parent Setup
          <Sparkles className="ml-2 h-5 w-5" />
        </>
      )}
    </Button>
  );
}

export default function ParentOnboardingPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [parentState, parentAction] = useActionState(submitParentOnboarding, initialParentState);
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (parentState.success && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.success(parentState.message || "Family setup complete!");
      refreshProfile().then(() => {
        router.push("/");
      });
    } else if (parentState.error) {
      toast.error(parentState.error);
    }
  }, [parentState, router, refreshProfile]);

  return (
    <OnboardingLayout
      leftIcon={Users}
      quote="“Welcome to the family! Let’s set up your parent profile so you can manage your child’s learning journey safely and easily.”"
      badges={[
        { text: "Safety First", icon: ShieldCheck },
        { text: "Easy Setup", icon: CheckCircle2 },
      ]}
      title="Parent Profile"
      description="Start your family adventure! 👨‍👩‍👧‍👦"
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
      <form action={parentAction} className="space-y-6">
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
                placeholder="e.g. John"
                required
                className="h-12 rounded-2xl border-2 border-border pl-11 focus:border-sky-500 focus:ring-0 text-base font-medium bg-background text-foreground"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-bold text-foreground ml-1">
              Last Name<span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                required
                id="lastName"
                name="lastName"
                placeholder="e.g. Smith"
                className="h-12 rounded-2xl border-2 border-border pl-11 focus:border-sky-500 focus:ring-0 text-base font-medium bg-background text-foreground"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="childEmail" className="text-sm font-bold text-foreground ml-1">
            Child&apos;s Email <span className="text-muted-foreground">(Optional)</span>
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              id="childEmail"
              name="childEmail"
              type="email"
              placeholder="child@example.com"
              className="h-12 rounded-2xl border-2 border-border pl-11 focus:border-sky-500 focus:ring-0 text-base font-medium bg-background text-foreground"
            />
          </div>
        </div>

        {parentState.error && (
          <div className="animate-in fade-in slide-in-from-top-2 rounded-2xl border-2 border-rose-500/20 bg-rose-500/10 p-3 text-sm font-bold text-rose-500 text-center">
            {parentState.error}
          </div>
        )}

        <ParentSubmitButton />
      </form>
    </OnboardingLayout>
  );
}
