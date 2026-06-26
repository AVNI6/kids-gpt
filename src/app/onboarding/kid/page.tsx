"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader2,
  PartyPopper,
  UserRound,
  Rocket,
  ShieldCheck,
  Brain,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useFormStatus } from "react-dom";

import {
  submitKidOnboarding,
  type KidOnboardingState,
} from "@/lib/services/shared/profile.actions";
import { getParentDetailsByInviteToken } from "@/lib/services/shared/invitations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { OnboardingLayout } from "@/components/shared/onboarding/onboarding-layout";
import KidDobInput from "@/components/shared/forms/KidDobInput";

import { AlreadyOnboardedView } from "@/components/shared/onboarding/already-onboarded-view";

const initialKidState: KidOnboardingState = { error: null };

function KidSubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      loading={pending}
      loadingText="Setting up your space..."
      disabled={disabled}
      className="h-14 w-full rounded-2xl bg-sky-600 text-base font-bold shadow-[0_16px_30px_rgba(2,132,199,0.3)] hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Start My Adventure!
      <Rocket className="ml-2 h-5 w-5" />
    </Button>
  );
}

export default function KidOnboardingPage() {
  const router = useRouter();
  const { user, userProfile, isLoading, refreshProfile } = useAuth();
  const [kidState, kidAction] = useActionState(submitKidOnboarding, initialKidState);
  const toastShownRef = useRef(false);

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [localAgeError, setLocalAgeError] = useState<string | null>(null);
  const [prefillParentEmail, setPrefillParentEmail] = useState<string | null>(null);
  const [isResolvingEmail, setIsResolvingEmail] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/signin");
    }
  }, [isLoading, user, router]);

  // Resolve parent details from invite token stored in user metadata
  useEffect(() => {
    if (isLoading || !user) return;

    const inviteToken = user.user_metadata?.invite_token;
    if (!inviteToken) {
      return; // Flow A: Normal onboarding (no token, no checks)
    }

    const resolveInvite = async () => {
      setIsResolvingEmail(true);
      setInviteError(null);
      try {
        const res = await getParentDetailsByInviteToken(inviteToken);
        if (res.error) {
          setInviteError(res.error);
        } else if (res.parentEmail) {
          setPrefillParentEmail(res.parentEmail);
        } else {
          setInviteError("Invalid invitation.");
        }
      } catch (err) {
        console.error("Error resolving invite:", err);
        setInviteError("Failed to verify invitation. Please try again.");
      } finally {
        setIsResolvingEmail(false);
      }
    };

    const timer = setTimeout(() => {
      resolveInvite();
    }, 0);

    return () => clearTimeout(timer);
  }, [user, isLoading]);

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

  if (isLoading || isResolvingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (userProfile?.is_onboarded) {
    if (kidState.success) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
        </div>
      );
    }
    return <AlreadyOnboardedView />;
  }

  if (inviteError) {
    return (
      <OnboardingLayout
        leftIcon={ShieldAlert}
        quote="“Oops! It looks like there's an issue with your invitation. Let's get that sorted out so we can start our adventure.”"
        badges={[{ text: "Security Verification", icon: ShieldAlert }]}
        title="Verification Required"
        description="We couldn't verify your invitation"
        footer={
          <p className="text-center text-xs font-bold text-muted-foreground">
            Ask your parent to send you a new invitation link!
          </p>
        }
      >
        <div className="flex flex-col items-center justify-center p-6 space-y-6 border-2 border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/10 rounded-3xl text-center">
          <div className="rounded-full bg-rose-100 dark:bg-rose-900/30 p-4 text-rose-500">
            <ShieldAlert className="h-10 w-10 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground">Invalid Invitation Link</h3>
            <p className="text-sm font-semibold text-muted-foreground max-w-sm">{inviteError}</p>
          </div>
          <Button
            type="button"
            onClick={() => router.push("/signin")}
            className="w-full h-12 rounded-2xl bg-sky-600 hover:bg-sky-700 text-base font-bold shadow-[0_16px_30px_rgba(2,132,199,0.3)]"
          >
            Go to Sign In
          </Button>
        </div>
      </OnboardingLayout>
    );
  }

  const fullName = user?.user_metadata?.fullname || user?.user_metadata?.full_name || "";
  const parts = fullName.trim().split(/\s+/);
  const defaultFirstName = parts[0] || "";
  const defaultLastName = parts.slice(1).join(" ") || "";

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
      <AvatarUpload label="Pick a Profile Photo" initialAvatarUrl={userProfile?.avatar_url} />

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
                defaultValue={defaultFirstName}
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
                defaultValue={defaultLastName}
                placeholder="e.g. Explorer"
                className="h-12 rounded-2xl border-2 border-border pl-11 focus:border-sky-500 focus:ring-0 text-base font-medium bg-background text-foreground"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className={`space-y-2 ${user?.user_metadata?.invite_token ? "" : "sm:col-span-2"}`}>
            <KidDobInput
              date={date}
              onDateChange={(selectedDate, error) => {
                setDate(selectedDate);
                setLocalAgeError(error);
              }}
              localAgeError={localAgeError}
              variant="onboarding"
            />
          </div>
          {user?.user_metadata?.invite_token && (
            <div className="space-y-2">
              <Label htmlFor="parentEmail" className="text-sm font-bold text-foreground ml-1">
                Parent&apos;s Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  id="parentEmail"
                  name="parentEmail"
                  type="email"
                  value={prefillParentEmail ?? ""}
                  readOnly
                  className="h-12 rounded-2xl border-2 border-sky-500/30 pl-11 text-base font-medium bg-sky-50/30 dark:bg-sky-900/10 text-sky-600 dark:text-sky-400 cursor-not-allowed focus:ring-0"
                />
              </div>
              <p className="text-xs text-muted-foreground ml-1">
                Your account is automatically linked to your parent.
              </p>
            </div>
          )}
        </div>

        {kidState.error && (
          <div className="animate-in fade-in slide-in-from-top-2 rounded-2xl border-2 border-rose-500/20 bg-rose-500/10 p-3 text-sm font-bold text-rose-500 text-center">
            {kidState.error}
          </div>
        )}

        <KidSubmitButton disabled={!date || !!localAgeError} />
      </form>
    </OnboardingLayout>
  );
}
