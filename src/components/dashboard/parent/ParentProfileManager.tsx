"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { Link2, PencilLine, Upload } from "lucide-react";

import { linkByEmail, updateParentProfile } from "@/actions/dashboard.actions";
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
import type { DashboardUserProfile } from "@/types/dashboard.types";

type Props = {
  profile: DashboardUserProfile;
};

function getInitials(firstName: string | null, lastName: string | null) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim();
  return initials || "P";
}

function formatDisplayName(profile: DashboardUserProfile) {
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
}

export default function ParentProfileManager({ profile }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState("");
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
      setAvatarObjectUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (avatarObjectUrl) {
      URL.revokeObjectURL(avatarObjectUrl);
    }

    setAvatarObjectUrl(objectUrl);
  };

  const handleProfileSubmit = async (formData: FormData) => {
    try {
      setProfileError(null);
      const result = await updateParentProfile(formData);

      if (result.error) {
        setProfileError(result.error);
        return;
      }

      setEditOpen(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to update profile.");
    }
  };

  const handleLinkSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setLinkMessage(null);
      const target = linkEmail.trim();

      if (!target) {
        setLinkMessage("Please enter an email address.");
        return;
      }

      const result = await linkByEmail(target);
      setLinkMessage(result.message);
      if (result.status === "success" || result.status === "pending") {
        setLinkEmail("");
      }
    } catch (error) {
      setLinkMessage(error instanceof Error ? error.message : "Failed to create link request.");
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Sleek Profile Row */}
      <div className="flex items-center gap-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-1.5 pr-4 rounded-full border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 font-bold text-sm">
            {getInitials(profile.first_name, profile.last_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {formatDisplayName(profile) || "Parent"}
          </h2>
          <p className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            Parent
          </p>
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger className="ml-2 flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            <PencilLine className="h-4 w-4" />
          </DialogTrigger>

          <DialogContent className="max-w-md rounded-[24px] p-0 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <DialogHeader className="border-b border-slate-200 dark:border-slate-800 px-6 pt-6 pb-4">
              <DialogTitle className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
                Edit Profile
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                Update your name and avatar.
              </DialogDescription>
            </DialogHeader>

            <form action={handleProfileSubmit} className="space-y-5 px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="dark:text-slate-300">
                    First name
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    defaultValue={profile.first_name ?? ""}
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="dark:text-slate-300">
                    Last name
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    defaultValue={profile.last_name ?? ""}
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar" className="dark:text-slate-300">
                  Avatar image
                </Label>
                <Input
                  id="avatar"
                  name="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              {profileError ? (
                <p className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">
                  {profileError}
                </p>
              ) : null}

              <DialogFooter className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-4 -mx-6 -mb-6 rounded-b-[24px]">
                <Button
                  type="submit"
                  className="rounded-full px-6 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Link Child Button/Dialog */}
      <Dialog>
        <DialogTrigger
          render={
            <Button
              variant="outline"
              className="rounded-full bg-white/70 dark:bg-slate-900/70 border-slate-200/50 dark:border-slate-800/50 shadow-sm backdrop-blur-md hover:bg-sky-50 dark:hover:bg-slate-800 dark:text-slate-200"
            >
              <Link2 className="mr-2 h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Link Child</span>
            </Button>
          }
        />
        <DialogContent className="max-w-md rounded-[24px] dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
              <Link2 className="h-5 w-5 text-sky-600" /> Link a Child
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Invite a child by email. If they haven&apos;t signed up yet, we&apos;ll send a pending
              invite.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLinkSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="childEmail" className="dark:text-slate-300">
                Child&apos;s Email
              </Label>
              <Input
                id="childEmail"
                name="childEmail"
                type="email"
                value={linkEmail}
                onChange={(event) => setLinkEmail(event.target.value)}
                placeholder="child@example.com"
                className="h-10 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-lg bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
            >
              Send Link Invite
            </Button>

            {linkMessage ? (
              <p className="rounded-lg bg-sky-50 dark:bg-sky-900/30 px-4 py-3 text-sm font-medium text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800/50">
                {linkMessage}
              </p>
            ) : null}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
