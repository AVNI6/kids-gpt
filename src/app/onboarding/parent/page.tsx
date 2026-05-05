"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Sparkles,
  UserRound,
  Users,
  ShieldCheck,
  Camera,
  CheckCircle2,
  Mail,
} from "lucide-react";
import Image from "next/image";
import { useFormStatus } from "react-dom";

import {
  setProfileAvatar,
  submitParentOnboarding,
  type AvatarUploadState,
  type ParentOnboardingState,
} from "@/actions/profile.actions";
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
      className="min-h-screen flex flex-col px-6 font-sans"
      style={{
        background: `radial-gradient(circle at top left, #c6e7ff 0%, #f6fafe 45%, rgb(132 251 66 / 0.08) 100%)`,
      }}
    >
      <div className="my-auto mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* Left Side: Creative Content */}
        <div className="hidden flex-col gap-8 lg:flex">
          <Link href="/" className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg">
                <Sparkles className="text-white w-8 h-8" />
              </div>
              <h1 className="text-5xl font-black text-sky-600">ChatGPT Kid</h1>
            </div>
          </Link>

          <Card className="relative border-2 border-slate-100 rounded-[32px] bg-white p-2 shadow-xl overflow-visible">
            <CardContent className="p-8">
              <div className="absolute -top-5 -left-5 w-14 h-14 rounded-full bg-blue-900 flex items-center justify-center shadow-lg">
                <Users className="text-white" />
              </div>

              <p className="text-xl text-slate-600 italic leading-relaxed">
                “Welcome to the family! Let’s set up your parent profile so you can manage your
                child’s learning journey safely and easily.”
              </p>

              <div className="mt-8 flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-2">
                  <ShieldCheck className="w-4 h-4 text-sky-500" />
                  <span className="font-bold text-sm text-slate-700">Safety First</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-sm text-slate-700">Easy Setup</span>
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
        <Card className="rounded-[40px] border-2 border-white bg-white/90 p-8 shadow-[0_40px_80px_-24px_rgba(0,101,141,0.15)] backdrop-blur-xl sm:p-10">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight sm:text-5xl">
              Parent Profile
            </h2>
            <p className="mt-2 text-lg font-medium text-slate-500">
              Start your family adventure! 👨‍👩‍👧‍👦
            </p>
          </div>

          <div className="space-y-8">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="relative group flex-shrink-0">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-sky-50 shadow-xl ring-4 ring-sky-100 transition-transform group-hover:scale-105">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Parent avatar preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-12 w-12 text-sky-500" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg border-2 border-white">
                  <Camera className="h-4 w-4" />
                </div>
              </div>

              <form action={avatarAction} className="flex-1 space-y-3">
                <Label htmlFor="avatar" className="text-sm font-bold text-slate-700 ml-1">
                  Profile Photo
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="avatar"
                    name="avatar"
                    type="file"
                    accept="image/*"
                    onChange={onAvatarChange}
                    className="h-10 rounded-xl border-2 border-slate-100 bg-white px-3 focus:border-sky-400 focus:ring-0 text-xs font-medium cursor-pointer"
                    required
                  />
                  <AvatarUploadButton />
                </div>
                {avatarState.avatarUrl && (
                  <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                    <CheckCircle2 className="h-3 w-3" /> Looking good!
                  </p>
                )}
              </form>
            </div>

            {/* Info Section */}
            <form action={parentAction} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-bold text-slate-700 ml-1">
                    First Name
                  </Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="e.g. John"
                      required
                      className="h-12 rounded-2xl border-2 border-slate-100 pl-11 focus:border-sky-400 focus:ring-0 text-base font-medium bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-bold text-slate-700 ml-1">
                    Last Name (Optional)
                  </Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="e.g. Smith"
                      className="h-12 rounded-2xl border-2 border-slate-100 pl-11 focus:border-sky-400 focus:ring-0 text-base font-medium bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="childEmail" className="text-sm font-bold text-slate-700 ml-1">
                  Child&apos;s Email (Optional)
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="childEmail"
                    name="childEmail"
                    type="email"
                    placeholder="child@example.com"
                    className="h-12 rounded-2xl border-2 border-slate-100 pl-11 focus:border-sky-400 focus:ring-0 text-base font-medium bg-white"
                  />
                </div>
              </div>

              {parentState.error && (
                <div className="animate-in fade-in slide-in-from-top-2 rounded-2xl border-2 border-rose-100 bg-rose-50 p-3 text-sm font-bold text-rose-700 text-center">
                  {parentState.error}
                </div>
              )}

              <ParentSubmitButton />
            </form>

            <p className="text-center text-xs font-bold text-slate-400">
              Need another account?{" "}
              <Link href="/signin" className="text-sky-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
