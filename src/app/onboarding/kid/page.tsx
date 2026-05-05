"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  Loader2,
  Mail,
  PartyPopper,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useFormStatus } from "react-dom";

import {
  setProfileAvatar,
  submitKidOnboarding,
  type AvatarUploadState,
  type KidOnboardingState,
} from "@/actions/profile.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const initialKidState: KidOnboardingState = { error: null };
const initialAvatarState: AvatarUploadState = { avatarUrl: null, error: null };

function AvatarUploadButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      variant="secondary"
      className="h-11 rounded-xl px-4 text-sm font-semibold"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Uploading...
        </>
      ) : (
        <>
          <Camera className="mr-2 h-4 w-4" />
          Upload Avatar
        </>
      )}
    </Button>
  );
}

function KidOnboardingSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-14 w-full rounded-2xl bg-sky-500 text-base font-bold shadow-[0_14px_28px_rgba(2,132,199,0.35)] hover:bg-sky-600"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Saving your profile...
        </>
      ) : (
        <>
          Let&apos;s Go
          <PartyPopper className="ml-2 h-5 w-5" />
        </>
      )}
    </Button>
  );
}

export default function KidOnboardingPage() {
  const [avatarState, avatarAction] = useActionState(setProfileAvatar, initialAvatarState);
  const [kidState, kidAction] = useActionState(submitKidOnboarding, initialKidState);

  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const currentAvatarUrl = useMemo(
    () => avatarState.avatarUrl ?? localPreviewUrl,
    [avatarState.avatarUrl, localPreviewUrl]
  );

  const onAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    setLocalPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <main
      className="min-h-screen px-4 py-8 text-slate-900 sm:px-6 lg:px-8"
      style={{
        background:
          "radial-gradient(circle at 10% 0%, rgba(186,230,253,0.7) 0%, rgba(255,255,255,1) 40%, rgba(220,252,231,0.6) 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 shadow-md shadow-sky-300/40">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              ChatGPT Kid
            </p>
            <h1 className="text-2xl font-black text-sky-900 sm:text-3xl">Create Your Profile</h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[30px] border border-sky-100 bg-white/85 p-6 shadow-[0_20px_60px_rgba(2,132,199,0.12)] backdrop-blur sm:p-8">
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
              <UserRound className="mt-0.5 h-5 w-5 text-sky-600" />
              <p className="text-sm leading-6 text-slate-600">
                Hi there. Let&apos;s make your profile setup quick and fun. Fill these details once
                and your learning dashboard will be ready.
              </p>
            </div>

            <Card className="rounded-3xl border-sky-100 shadow-sm">
              <CardContent className="space-y-5 p-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Profile Picture</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Upload an avatar to personalize your account.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-sky-200 bg-sky-50">
                    {currentAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentAvatarUrl}
                        alt="Avatar preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="h-10 w-10 text-sky-500" />
                    )}
                  </div>

                  <form action={avatarAction} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="avatar">Avatar image</Label>
                      <Input
                        id="avatar"
                        name="avatar"
                        type="file"
                        accept="image/*"
                        onChange={onAvatarFileChange}
                        className="h-11 rounded-xl"
                        required
                      />
                    </div>
                    <AvatarUploadButton />
                  </form>
                </div>

                {avatarState.error && (
                  <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {avatarState.error}
                  </p>
                )}

                {avatarState.avatarUrl && (
                  <p className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Avatar uploaded successfully.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <Badge className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 hover:bg-emerald-100">
                  Step 1 of 1
                </Badge>
                <h2 className="mt-3 text-3xl font-black text-slate-900">Your Info</h2>
              </div>
            </div>

            <form action={kidAction} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Alex"
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Explorer"
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentEmail">Parent&apos;s Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="parentEmail"
                      name="parentEmail"
                      type="email"
                      placeholder="parent@example.com"
                      required
                      className="h-12 rounded-xl pl-10"
                    />
                  </div>
                </div>
              </div>

              {kidState.error && (
                <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {kidState.error}
                </p>
              )}

              <KidOnboardingSubmitButton />
            </form>

            <p className="mt-5 text-center text-xs text-slate-500">
              You can update these details later in your profile settings. Need another account?{" "}
              <Link href="/signin" className="font-semibold text-sky-700 hover:underline">
                Go back to sign in
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
