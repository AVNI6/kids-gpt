"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, Camera, CheckCircle2, UserRound } from "lucide-react";
import { uploadAvatar } from "@/lib/services/shared/profile.actions";
import { useAuth } from "@/hooks/useAuth";

interface AvatarUploadProps {
  initialAvatarUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
  label?: string;
  description?: string;
  successMessage?: string;
}

export function AvatarUpload({
  initialAvatarUrl,
  onUploadSuccess,
  onUploadError,
  label = "Profile Photo",
  description = "Click the photo circle to upload or replace your image automatically.",
  successMessage = "Looking good!",
}: AvatarUploadProps) {
  const { refreshProfile } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const displayUrl = useMemo(() => avatarUrl ?? localPreviewUrl, [avatarUrl, localPreviewUrl]);

  const onAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setLocalPreviewUrl(preview);
    setError(null);

    const formData = new FormData();
    formData.append("avatar", file);

    startTransition(async () => {
      try {
        const result = await uploadAvatar(formData);
        if (result.avatarUrl) {
          setAvatarUrl(result.avatarUrl);
          setError(null);
          try {
            await refreshProfile();
          } catch (e) {
            console.error("Failed to refresh profile in auth provider:", e);
          }
          onUploadSuccess?.(result.avatarUrl);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to upload avatar.";
        setError(msg);
        onUploadError?.(msg);
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 w-full text-center sm:text-left">
      <div className="relative group flex-shrink-0">
        <label
          htmlFor="avatar-input"
          className={`relative block h-28 w-28 overflow-hidden rounded-full border-4 border-border bg-muted shadow-xl ring-4 ring-sky-500/10 transition-all duration-300 ${
            isPending
              ? "cursor-not-allowed opacity-80"
              : "cursor-pointer hover:scale-105 hover:border-sky-500"
          }`}
        >
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayUrl} alt="Avatar preview" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <UserRound className="h-12 w-12 text-sky-500" />
            </div>
          )}

          {/* Glassmorphic Loading Overlay */}
          {isPending && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center rounded-full animate-in fade-in duration-200">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
        </label>

        {/* Camera Overlay Icon */}
        <label
          htmlFor="avatar-input"
          className={`absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg border-2 border-border transition-all duration-300 ${
            isPending
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:scale-110 hover:bg-emerald-600"
          }`}
        >
          <Camera className="h-4 w-4" />
        </label>

        {/* Hidden File Input */}
        <input
          id="avatar-input"
          name="avatar-file-upload"
          type="file"
          accept="image/*"
          onChange={onAvatarChange}
          disabled={isPending}
          className="hidden"
        />
      </div>

      <div className="flex-1 space-y-1">
        <span className="text-sm font-bold text-foreground block ml-1">{label}</span>
        <p className="text-xs text-muted-foreground ml-1">{description}</p>
        {avatarUrl && !isPending && !error && (
          <p className="text-xs font-bold text-emerald-500 flex items-center justify-center sm:justify-start gap-1 animate-in fade-in slide-in-from-left-2 mt-2 ml-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> {successMessage}
          </p>
        )}
        {error && !isPending && (
          <p className="text-xs font-bold text-rose-500 flex items-center justify-center sm:justify-start gap-1 animate-in fade-in slide-in-from-left-2 mt-2 ml-1">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
