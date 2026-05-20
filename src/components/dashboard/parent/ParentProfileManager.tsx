"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { Link2, PencilLine, Upload } from "lucide-react";

import { linkByEmail, updateParentProfile } from "@/actions/dashboard.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <div className="space-y-4">
      {/* Visible Profile Card */}
      <Card className="rounded-[24px] border-sky-100 bg-linear-to-br from-sky-50 to-cyan-50 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-3xl border-2 border-sky-200">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="rounded-3xl bg-sky-100 text-sky-700 font-black">
                {getInitials(profile.first_name, profile.last_name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <h2 className="text-lg font-black text-slate-950">{formatDisplayName(profile)}</h2>
              <p className="text-sm text-sky-700 font-semibold">Parent</p>
            </div>
          </div>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger className="inline-flex shrink-0 items-center justify-center border border-slate-200 bg-white rounded-full h-9 w-9 hover:bg-slate-50 transition-colors">
              <PencilLine className="h-4 w-4 text-slate-600" />
            </DialogTrigger>

            <DialogContent className="max-w-md rounded-[24px] p-0">
              <DialogHeader className="border-b px-6 pt-6 pb-4">
                <DialogTitle className="text-lg font-black tracking-tight text-slate-950">
                  Edit Profile
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Update your name and avatar.
                </DialogDescription>
              </DialogHeader>

              <form action={handleProfileSubmit} className="space-y-5 px-6 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      defaultValue={profile.first_name ?? ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last name</Label>
                    <Input id="last_name" name="last_name" defaultValue={profile.last_name ?? ""} />
                  </div>
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

                {profileError ? (
                  <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {profileError}
                  </p>
                ) : null}

                <DialogFooter className="border-t bg-slate-50 px-6 py-4 -mx-6 -mb-6">
                  <Button type="submit" className="rounded-full px-6">
                    <Upload className="mr-2 h-4 w-4" />
                    Save changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Link Child Card */}
      <Card className="rounded-[24px] border-sky-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="h-5 w-5 text-sky-600" />
          <h3 className="text-sm font-black uppercase tracking-wide text-sky-700">Link a Child</h3>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Invite a child by email. If they haven&apos;t signed up yet, we&apos;ll send a pending
          invite.
        </p>

        <form onSubmit={handleLinkSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="childEmail">Child&apos;s Email</Label>
            <Input
              id="childEmail"
              name="childEmail"
              type="email"
              value={linkEmail}
              onChange={(event) => setLinkEmail(event.target.value)}
              placeholder="child@example.com"
              className="h-10 rounded-lg border-sky-100"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-lg bg-sky-600 text-white hover:bg-sky-700"
          >
            Link
          </Button>

          {linkMessage ? (
            <p className="rounded-lg bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 border border-sky-100">
              {linkMessage}
            </p>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
