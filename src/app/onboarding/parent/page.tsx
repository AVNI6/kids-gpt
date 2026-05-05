"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  HeartHandshake,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useFormStatus } from "react-dom";

import {
  setProfileAvatar,
  submitParentOnboarding,
  type AvatarUploadState,
  type ParentOnboardingState,
} from "@/actions/profile.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialAvatarState: AvatarUploadState = { avatarUrl: null, error: null };
const initialParentState: ParentOnboardingState = { error: null };

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
  const [avatarState, avatarAction] = useActionState(setProfileAvatar, initialAvatarState);
  const [parentState, parentAction] = useActionState(submitParentOnboarding, initialParentState);

  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const avatarUrl = useMemo(
    () => avatarState.avatarUrl ?? localPreviewUrl,
    [avatarState.avatarUrl, localPreviewUrl]
  );

  const onAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
          "radial-gradient(circle at 0% 0%, rgba(191,219,254,0.7) 0%, rgba(255,255,255,1) 42%, rgba(224,242,254,0.65) 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 shadow-md shadow-sky-300/50">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              ChatGPT Kid
            </p>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Parent Onboarding</h1>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[30px] border border-sky-100 bg-white/90 p-6 shadow-[0_20px_60px_rgba(2,132,199,0.12)] backdrop-blur sm:p-8">
            <div className="mb-6 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
              <p className="text-sm leading-6 text-slate-600">
                Set up your profile first. You can optionally add your child&apos;s email now, or
                link them later from your dashboard.
              </p>
            </div>

            <Card className="rounded-3xl border-sky-100 shadow-sm">
              <CardContent className="space-y-5 p-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Profile Avatar</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Upload a photo so your family can identify your account quickly.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-sky-200 bg-sky-50">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt="Parent avatar preview"
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
                        onChange={onAvatarChange}
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
            <div className="mb-6">
              <Badge className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 hover:bg-emerald-100">
                Adult setup
              </Badge>
              <h2 className="mt-3 text-3xl font-black text-slate-900">Family Account Details</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                This creates your parent workspace and optionally links your child immediately.
              </p>
            </div>

            <form action={parentAction} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Jamie"
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Anderson"
                    required
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="childEmail">Child&apos;s Email</Label>
                  <Badge
                    variant="secondary"
                    className="rounded-full px-2 py-0 text-[10px] uppercase tracking-[0.14em]"
                  >
                    Optional
                  </Badge>
                </div>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="childEmail"
                    name="childEmail"
                    type="email"
                    placeholder="child@example.com"
                    className="h-12 rounded-xl pl-10"
                  />
                </div>
                <p className="text-xs leading-5 text-slate-500">
                  Leave this empty if you want to link your child later from your dashboard.
                </p>
              </div>

              {parentState.error && (
                <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {parentState.error}
                </p>
              )}

              <ParentSubmitButton />
            </form>

            <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-600">
              <p className="inline-flex items-center gap-2 font-medium text-sky-800">
                <HeartHandshake className="h-4 w-4" />
                You can safely update linked family accounts later.
              </p>
            </div>

            <p className="mt-5 text-center text-xs text-slate-500">
              Need another account?{" "}
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
