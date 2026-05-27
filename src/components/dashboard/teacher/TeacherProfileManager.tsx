"use client";

import { useState } from "react";
import { Link2, PencilLine, Upload } from "lucide-react";

import { linkByEmail, updateTeacherProfile } from "@/actions/dashboard.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarUpload } from "@/components/ui/avatar-upload";
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
  return initials || "T";
}

function formatDisplayName(profile: DashboardUserProfile) {
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
}

export default function TeacherProfileManager({ profile }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.avatar_url);

  const handleProfileSubmit = async (formData: FormData) => {
    try {
      setProfileError(null);
      const result = await updateTeacherProfile(formData);

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

  const organization = profile.standard || "Organization not set";

  return (
    <div className="space-y-4">
      {/* Visible Profile Card */}
      <Card className="rounded-[24px] border-violet-100 bg-linear-to-br from-violet-50 to-blue-50 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-3xl border-2 border-violet-200">
              <AvatarImage src={previewUrl ?? undefined} />
              <AvatarFallback className="rounded-3xl bg-violet-100 text-violet-700 font-black">
                {getInitials(profile.first_name, profile.last_name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <h2 className="text-lg font-black text-slate-950">{formatDisplayName(profile)}</h2>
              <p className="text-sm text-violet-700 font-semibold">{organization}</p>
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
                  Update your name, organization, and avatar.
                </DialogDescription>
              </DialogHeader>

              <form action={handleProfileSubmit} className="space-y-5 px-6 py-5">
                <div className="flex justify-center p-6 border border-slate-100 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-xs">
                  <AvatarUpload
                    key={previewUrl}
                    initialAvatarUrl={previewUrl}
                    onUploadSuccess={(url) => setPreviewUrl(url)}
                  />
                </div>

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
                  <Label htmlFor="organizationName">Organization</Label>
                  <Input
                    id="organizationName"
                    name="organizationName"
                    defaultValue={profile.standard ?? ""}
                    placeholder="e.g. Bright Future Academy"
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

      {/* Link Student Card */}
      <Card className="rounded-[24px] border-violet-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="h-5 w-5 text-violet-600" />
          <h3 className="text-sm font-black uppercase tracking-wide text-violet-700">
            Link a Student
          </h3>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Link a student using their email. If they don&apos;t have an account yet, we&apos;ll
          notify them.
        </p>

        <form onSubmit={handleLinkSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="studentEmail">Student&apos;s Email</Label>
            <Input
              id="studentEmail"
              name="studentEmail"
              type="email"
              value={linkEmail}
              onChange={(event) => setLinkEmail(event.target.value)}
              placeholder="student@example.com"
              className="h-10 rounded-lg border-violet-100"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-lg bg-violet-600 text-white hover:bg-violet-700"
          >
            Link
          </Button>

          {linkMessage ? (
            <p className="rounded-lg bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700 border border-violet-100">
              {linkMessage}
            </p>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
