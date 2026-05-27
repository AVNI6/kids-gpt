"use client";

import { useActionState, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { updateUserProfile, type ProfileUpdateState } from "@/actions/profile.actions";
import type { UserProfile } from "@/types/auth";

const initialUpdateState: ProfileUpdateState = { error: null };

export function EditProfileForm() {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <EditProfileFormInner userProfile={userProfile} />;
}

interface EditProfileFormInnerProps {
  userProfile: UserProfile;
}

function EditProfileFormInner({ userProfile }: EditProfileFormInnerProps) {
  const [updateState, updateAction, isPending] = useActionState(
    updateUserProfile,
    initialUpdateState
  );
  const [firstName, setFirstName] = useState(userProfile.first_name ?? "");
  const [lastName, setLastName] = useState(userProfile.last_name ?? "");

  useEffect(() => {
    if (updateState.success) {
      toast.success(updateState.message || "Profile updated successfully!");
    } else if (updateState.error) {
      toast.error(updateState.error);
    }
  }, [updateState]);

  return (
    <div className="space-y-6">
      <div className="p-4 border-2 border-border/40 rounded-3xl bg-background/50 backdrop-blur-xs">
        <AvatarUpload key={userProfile.avatar_url} initialAvatarUrl={userProfile.avatar_url} />
      </div>

      <form action={updateAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-bold ml-1">
              First Name
            </Label>
            <Input
              id="firstName"
              name="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. John"
              required
              className="h-12 rounded-2xl border-2 border-border bg-background px-4 focus:border-sky-500 focus:ring-0 text-base font-medium text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-bold ml-1">
              Last Name (Optional)
            </Label>
            <Input
              id="lastName"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Smith"
              className="h-12 rounded-2xl border-2 border-border bg-background px-4 focus:border-sky-500 focus:ring-0 text-base font-medium text-foreground"
            />
          </div>
        </div>

        {updateState.error && (
          <div className="rounded-2xl border-2 border-rose-500/20 bg-rose-500/10 p-3 text-sm font-bold text-rose-500 text-center animate-in fade-in">
            {updateState.error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="h-12 w-full rounded-2xl bg-sky-600 hover:bg-sky-700 text-base font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              Save Changes
              <Sparkles className="h-5 w-5" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
