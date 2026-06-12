"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, PartyPopper, UserRound, Rocket, ShieldCheck, Brain, Mail } from "lucide-react";
import { toast } from "sonner";
import { useFormStatus } from "react-dom";

import {
  submitKidOnboarding,
  type KidOnboardingState,
} from "@/lib/services/shared/profile.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { OnboardingLayout } from "@/components/shared/onboarding/onboarding-layout";

const initialKidState: KidOnboardingState = { error: null };

function KidSubmitButton() {
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
          Setting up your space...
        </>
      ) : (
        <>
          Start My Adventure!
          <Rocket className="ml-2 h-5 w-5" />
        </>
      )}
    </Button>
  );
}

export default function KidOnboardingPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [kidState, kidAction] = useActionState(submitKidOnboarding, initialKidState);
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (kidState.success && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.success(kidState.message || "Welcome explorer!");
      refreshProfile().then(() => {
        router.push("/");
      });
    } else if (kidState.error) {
      toast.error(kidState.error);
    }
  }, [kidState, router, refreshProfile]);

  return (
    <OnboardingLayout
      leftIcon={PartyPopper}
      quote="“Hi there! I’m so excited to start learning with you. Let’s finish setting up your profile so we can start our first adventure!”"
      badges={[
        { text: "Safe Space", icon: ShieldCheck },
        { text: "Fun Learning", icon: Brain },
      ]}
      title="Hello Explorer!"
      description="Let's create your magic profile 🚀"
      footer={
        <p className="text-center text-xs font-bold text-muted-foreground">
          Need help? Ask your parent or teacher to guide you!
        </p>
      }
    >
      {/* Avatar Section */}
      <AvatarUpload label="Pick a Profile Photo" />

      {/* Info Section */}
      <form action={kidAction} className="space-y-6">
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
                placeholder="e.g. Alex"
                required
                className="h-12 rounded-2xl border-2 border-border pl-11 focus:border-sky-500 focus:ring-0 text-base font-medium bg-background text-foreground"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-bold text-foreground ml-1">
              Last Name <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                id="lastName"
                name="lastName"
                placeholder="e.g. Explorer"
                className="h-12 rounded-2xl border-2 border-border pl-11 focus:border-sky-500 focus:ring-0 text-base font-medium bg-background text-foreground"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className="text-sm font-bold text-foreground ml-1">
              Birthdate<span className="text-red-500">*</span>
            </Label>
            <Input
              required
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              className="h-12 rounded-2xl border-2 border-border px-4 focus:border-sky-500 focus:ring-0 text-base font-medium bg-background text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentEmail" className="text-sm font-bold text-foreground ml-1">
              Parent&apos;s Email <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                id="parentEmail"
                name="parentEmail"
                type="email"
                placeholder="mom@example.com"
                className="h-12 rounded-2xl border-2 border-border pl-11 focus:border-sky-500 focus:ring-0 text-base font-medium bg-background text-foreground"
              />
            </div>
          </div>
        </div>

        {kidState.error && (
          <div className="animate-in fade-in slide-in-from-top-2 rounded-2xl border-2 border-rose-500/20 bg-rose-500/10 p-3 text-sm font-bold text-rose-500 text-center">
            {kidState.error}
          </div>
        )}

        <KidSubmitButton />
      </form>
    </OnboardingLayout>
  );
}
