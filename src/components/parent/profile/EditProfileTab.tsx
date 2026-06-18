"use client";

import { useState, useRef, useTransition, useEffect, useMemo } from "react";
import { updateChildProfile, uploadChildAvatar } from "@/lib/services/parent/parent.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Camera } from "lucide-react";
import type { LinkedChildProfile } from "@/types/kid";

interface EditProfileTabProps {
  child: LinkedChildProfile;
  onSuccess: () => void;
}

export default function EditProfileTab({ child, onSuccess }: EditProfileTabProps) {
  const [firstName, setFirstName] = useState(child.first_name || "");
  const [lastName, setLastName] = useState(child.last_name || "");
  const [standard, setStandard] = useState(child.standard || "");
  const [avatarUrl, setAvatarUrl] = useState(child.avatar_url || "");
  const [isPending, setIsPending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, startTransition] = useTransition();
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const displayUrl = useMemo(
    () => avatarUrl || localPreviewUrl || "",
    [avatarUrl, localPreviewUrl]
  );

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setLocalPreviewUrl(preview);

    const formData = new FormData();
    formData.append("avatar", file);

    startTransition(async () => {
      try {
        const result = await uploadChildAvatar(child.user_id, formData);
        if (result.success && result.avatarUrl) {
          setAvatarUrl(result.avatarUrl);
          toast.success("Profile picture updated successfully!");
        } else {
          toast.error("Upload failed", {
            description: result.error || "Could not upload profile picture.",
          });
        }
      } catch (err) {
        toast.error("Upload error", {
          description: err instanceof Error ? err.message : "Failed to upload avatar.",
        });
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      toast.error("Validation error", { description: "First name is required." });
      return;
    }

    setIsPending(true);
    try {
      const response = await updateChildProfile(child.user_id, {
        firstName,
        lastName,
        standard,
        avatarUrl,
      });

      if (response.success) {
        toast.success("Profile updated", {
          description: response.message || "Child details updated successfully.",
        });
        onSuccess();
      } else {
        toast.error("Update failed", {
          description: response.error || "Could not update profile.",
        });
      }
    } catch (err) {
      toast.error("Error occurred", {
        description: err instanceof Error ? err.message : "Failed to execute.",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
          Kid Details
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Modify your child&apos;s display information, standard or classroom settings.
        </p>
      </div>

      <div className="space-y-4">
        {/* Dynamic Profile Picture Selector */}
        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase pt-4 tracking-wider text-slate-500">
            Profile Picture
          </Label>
          <div className="flex flex-col sm:flex-row items-center gap-4.5 bg-slate-50/50 dark:bg-black/20 p-4 rounded-3xl border border-slate-100/50 dark:border-slate-800/40">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`relative group rounded-full p-1 border-2 border-slate-200 dark:border-slate-800 transition-all shrink-0 ${
                  isUploading
                    ? "cursor-not-allowed opacity-80"
                    : "cursor-pointer hover:scale-105 hover:border-sky-500 active:scale-95"
                }`}
              >
                <Avatar className="w-20 h-20 rounded-full cursor-pointer">
                  <AvatarImage src={displayUrl || undefined} className="object-cover" />
                  <AvatarFallback className="text-2xl font-black bg-gradient-to-br from-sky-400 to-sky-600 text-white">
                    {firstName[0] || "C"}
                  </AvatarFallback>
                </Avatar>

                {/* Camera / Change Overlay */}
                <div className="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                  <Camera className="w-4 h-4 text-white mb-0.5" />
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                    Change
                  </span>
                </div>

                {/* Glassmorphic Loading Overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center rounded-full animate-in fade-in duration-200">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </button>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={isUploading}
                className="hidden"
              />
            </div>

            <div className="text-center sm:text-left space-y-1">
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {firstName || "Child"}&apos;s Avatar
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Click on the profile picture above to upload a custom image.
              </p>
            </div>
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="firstName"
              className="text-xs font-bold text-slate-600 dark:text-slate-400"
            >
              First Name *
            </Label>
            <Input
              id="firstName"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/40 focus:bg-white focus:ring-sky-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="lastName"
              className="text-xs font-bold text-slate-600 dark:text-slate-400"
            >
              Last Name
            </Label>
            <Input
              id="lastName"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/40 focus:bg-white focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Grade / Standard Field */}
        <div className="space-y-1.5">
          <Label
            htmlFor="standard"
            className="text-xs font-bold text-slate-600 dark:text-slate-400"
          >
            Standard / Grade
          </Label>
          <Input
            id="standard"
            placeholder="e.g. 5, Pre-K, Grade 3"
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
            className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/40 focus:bg-white focus:ring-sky-500"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/60">
        <Button
          type="submit"
          loading={isPending}
          disabled={isUploading}
          className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold h-11 px-6 text-xs cursor-pointer shadow-md hover:shadow-lg dark:bg-sky-500 dark:hover:bg-sky-600"
        >
          Save Profile
        </Button>
      </div>
    </form>
  );
}
