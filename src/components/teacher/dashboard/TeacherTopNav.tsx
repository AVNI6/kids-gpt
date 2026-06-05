"use client";

import { useState } from "react";
import { PencilLine, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shared/ui/avatar";
import { AvatarUpload } from "@/components/shared/ui/avatar-upload";
import { Button } from "@/components/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shared/ui/dialog";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { Badge } from "@/components/shared/ui/badge";
import type { DashboardUserProfile } from "@/types/kid";
import { updateTeacherProfile } from "@/lib/services/kid/dashboard.actions";
import { toast } from "sonner";

type Props = {
  profile: DashboardUserProfile;
};

function getInitials(firstName: string | null, lastName: string | null) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim();
  return initials.toUpperCase() || "T";
}

function formatDisplayName(profile: DashboardUserProfile) {
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "Educator";
}

export default function TeacherTopNav({ profile }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.avatar_url);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProfileSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setProfileError(null);
      const result = await updateTeacherProfile(formData);

      if (result.error) {
        setProfileError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("Profile updated successfully!");
      setEditOpen(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to update profile.");
      toast.error("Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const organization = profile.standard || "School / Organization not set";

  return (
    <div className="flex flex-col items-stretch sm:items-center gap-4 w-full sm:w-auto">
      {/* Slim Profile Hub Row */}
      <div className="flex items-center gap-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-1.5 pr-4 rounded-full border border-slate-200/50 dark:border-slate-800/50 shadow-sm w-full sm:w-auto justify-between sm:justify-start">
        <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
          <AvatarImage src={previewUrl ?? undefined} className="object-cover" />
          <AvatarFallback className="bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
            {getInitials(profile.first_name, profile.last_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight truncate max-w-[120px] sm:max-w-none">
              {formatDisplayName(profile)}
            </h2>
            <Badge className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-none font-bold text-[9px] uppercase px-1.5 py-0.5 rounded-full shrink-0">
              Teacher
            </Badge>
          </div>
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[140px] sm:max-w-none">
            {organization}
          </p>
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger className="ml-2 flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0">
            <PencilLine className="h-4 w-4" />
          </DialogTrigger>

          <DialogContent className="max-w-md rounded-[24px] p-0 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
            <DialogHeader className="border-b border-slate-200 dark:border-slate-800 px-6 pt-6 pb-4">
              <DialogTitle className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Edit Profile
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                Update your name, organization/school, and avatar.
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
                <div className="space-y-1.5">
                  <Label
                    htmlFor="first_name"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                  >
                    First name
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    defaultValue={profile.first_name ?? ""}
                    className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-850 dark:text-white h-11 text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="last_name"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                  >
                    Last name
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    defaultValue={profile.last_name ?? ""}
                    className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-850 dark:text-white h-11 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="organizationName"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                >
                  Organization / School
                </Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  defaultValue={profile.standard ?? ""}
                  placeholder="e.g. Bright Future Academy"
                  className="rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-850 dark:text-white h-11 text-sm font-medium"
                />
              </div>

              {profileError && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-bold text-rose-600 dark:border-rose-950/20 dark:bg-rose-950/30 dark:text-rose-400">
                  {profileError}
                </div>
              )}

              <DialogFooter className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-4 -mx-6 -mb-6 flex gap-2 rounded-b-[24px]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
