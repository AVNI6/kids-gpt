"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { PencilLine, Upload } from "lucide-react";

import { updateKidProfile } from "@/actions/dashboard.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { KidDashboardStats } from "@/types/dashboard.types";

type Props = {
  profile: KidDashboardStats;
};

function getInitials(firstName: string | null, lastName: string | null) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim();
  return initials || "K";
}

function formatDateInput(dateOfBirth: string | null) {
  if (!dateOfBirth) {
    return "";
  }

  const parsedDate = new Date(dateOfBirth);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateOfBirth;
  }

  return parsedDate.toISOString().slice(0, 10);
}

export default function KidProfileEditorDialog({ profile }: Props) {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.avatar_url);
  const [avatarObjectUrl, setAvatarObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (avatarObjectUrl) {
        URL.revokeObjectURL(avatarObjectUrl);
      }
    };
  }, [avatarObjectUrl]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setPreviewUrl(profile.avatar_url);
      setAvatarObjectUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (avatarObjectUrl) {
      URL.revokeObjectURL(avatarObjectUrl);
    }

    setAvatarObjectUrl(objectUrl);
    setPreviewUrl(objectUrl);
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      setErrorMessage(null);
      await updateKidProfile(formData);
      setOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update profile.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="w-full rounded-full" />}>
        <PencilLine className="mr-2 h-4 w-4" />
        Edit Profile
      </DialogTrigger>

      <DialogContent className="max-w-xl rounded-[28px] p-0">
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-black tracking-tight text-slate-950">
            Edit your profile
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-slate-500">
            Update your avatar, name, and birthday without leaving the dashboard.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-5 px-6 py-5">
          <div className="flex items-center gap-4 rounded-3xl bg-slate-50 p-4">
            <Avatar size="lg" className="h-16 w-16 rounded-3xl border-2 border-sky-100">
              <AvatarImage src={previewUrl ?? undefined} />
              <AvatarFallback className="rounded-3xl bg-sky-100 text-sky-700 font-black">
                {getInitials(profile.first_name, profile.last_name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                Current avatar
              </div>
              <p className="text-sm text-slate-500">
                Upload a new image to replace the current one.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" name="first_name" defaultValue={profile.first_name ?? ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" name="last_name" defaultValue={profile.last_name ?? ""} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of birth</Label>
              <Input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                defaultValue={formatDateInput(profile.date_of_birth)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar image</Label>
              <Input
                id="avatar"
                name="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {errorMessage ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <DialogFooter className="border-t bg-slate-50 px-6 py-4">
            <Button type="submit" className="rounded-full px-6">
              <Upload className="mr-2 h-4 w-4" />
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
