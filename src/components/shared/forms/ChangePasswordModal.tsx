"use client";

import React, { useState, useTransition } from "react";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePassword } from "@/lib/utils";

interface ChangePasswordModalProps {
  email: string;
  changePasswordAction: (password: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  role: "kid" | "parent" | "teacher";
}

export default function ChangePasswordModal({
  email,
  changePasswordAction,
  role,
}: ChangePasswordModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentTouched, setCurrentTouched] = useState(false);
  const [newTouched, setNewTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const [isPending, startTransition] = useTransition();

  // Reset all states
  const handleReset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setCurrentTouched(false);
    setNewTouched(false);
    setConfirmTouched(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      handleReset();
    }
  };

  // Validation
  const currentError = currentPassword ? "" : "Current password is required.";

  const validationResult = validatePassword(newPassword);
  const newError = validationResult === true ? "" : validationResult;

  const confirmError = !confirmPassword
    ? "Confirm password is required."
    : confirmPassword !== newPassword
    ? "Passwords do not match."
    : "";

  const isFormValid =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    validationResult === true &&
    confirmPassword === newPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isPending) return;

    startTransition(async () => {
      try {
        const supabase = createClient();
        
        // 1. Verify current password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        });

        if (signInError) {
          toast.error("Incorrect current password.");
          return;
        }

        // 2. Call the role-specific update action
        const res = await changePasswordAction(newPassword);
        if (res.success) {
          toast.success(res.message || "Password updated successfully!");
          setIsOpen(false);
          handleReset();
        } else {
          toast.error(res.error || "Failed to change password.");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "An unexpected error occurred.");
      }
    });
  };

  const buttonColor =
    role === "kid"
      ? "bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 focus:ring-sky-500/20"
      : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:ring-indigo-500/20";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            className={`rounded-2xl text-white font-bold h-13 px-8 text-sm cursor-pointer shadow-md hover:shadow-lg transition-all w-full sm:w-auto ${buttonColor}`}
          >
            Change Password
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl">
        <DialogHeader suppressHydrationWarning>
          <DialogTitle className="text-2xl font-black text-foreground">Change Password</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground font-medium mt-1">
            Update your account password to keep your account secure.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-4">
          {/* Current Password */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="currentPassword" className="text-sm font-bold text-foreground ml-1">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setCurrentTouched(true);
                }}
                onBlur={() => setCurrentTouched(true)}
                className="rounded-2xl border-input bg-background focus:bg-card h-13 text-base font-medium pl-11 pr-11"
              />
              <Lock className="absolute left-4 top-4 h-5 w-5 text-muted-foreground shrink-0" />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4 top-4 h-5 w-5 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer flex items-center justify-center"
              >
                {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {currentTouched && currentError && (
              <p className="text-xs font-semibold text-rose-500 mt-1 ml-1 animate-in fade-in duration-200">
                {currentError}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword" className="text-sm font-bold text-foreground ml-1">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setNewTouched(true);
                }}
                onBlur={() => setNewTouched(true)}
                className="rounded-2xl border-input bg-background focus:bg-card h-13 text-base font-medium pl-11 pr-11"
              />
              <Lock className="absolute left-4 top-4 h-5 w-5 text-muted-foreground shrink-0" />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-4 h-5 w-5 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer flex items-center justify-center"
              >
                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {newTouched && newError && (
              <p className="text-xs font-semibold text-rose-500 mt-1 ml-1 animate-in fade-in duration-200">
                {newError}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword" className="text-sm font-bold text-foreground ml-1">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmTouched(true);
                }}
                onBlur={() => setConfirmTouched(true)}
                className="rounded-2xl border-input bg-background focus:bg-card h-13 text-base font-medium pl-11 pr-11"
              />
              <Lock className="absolute left-4 top-4 h-5 w-5 text-muted-foreground shrink-0" />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-4 h-5 w-5 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer flex items-center justify-center"
              >
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {confirmTouched && confirmError && (
              <p className="text-xs font-semibold text-rose-500 mt-1 ml-1 animate-in fade-in duration-200">
                {confirmError}
              </p>
            )}
          </div>

          <DialogFooter className="-mx-6 -mb-6 p-6 rounded-b-3xl flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
              className="rounded-2xl border-border hover:bg-muted font-bold h-13 px-6 text-sm cursor-pointer transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isPending}
              disabled={!isFormValid}
              className={`rounded-2xl text-white font-bold h-13 px-8 text-sm cursor-pointer shadow-md hover:shadow-lg transition-all ${buttonColor} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
