"use client";

import React, { useState } from "react";
import { UserRound, KeyRound, Loader2, Mail, Lock, Shield } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarUpload } from "@/components/ui/avatar-upload";

import type { DashboardUserProfile } from "@/types/kid";
import { updateKidProfileSettings, changeKidPassword } from "@/lib/services/kid/settings.actions";

import { useAuth } from "@/context/AuthContext";

interface KidSettingsContainerProps {
  profile: DashboardUserProfile;
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

export default function KidSettingsContainer({ profile }: KidSettingsContainerProps) {
  const { refreshProfile } = useAuth();
  // Tabs state
  const [activeTab, setActiveTab] = useState("profile");

  // Profile Form state
  const [firstName, setFirstName] = useState(profile.first_name || "");
  const [lastName, setLastName] = useState(profile.last_name || "");
  const [username, setUsername] = useState(profile.username || "");
  const [dateOfBirth, setDateOfBirth] = useState(formatDateInput(profile.date_of_birth));
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security Form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error("First name is required.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateKidProfileSettings({
        firstName,
        lastName,
        dateOfBirth,
        username,
        avatarUrl,
      });

      if (res.success) {
        toast.success(res.message || "Profile settings saved!");
        await refreshProfile();
      } else {
        toast.error(res.error || "Failed to update settings.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Change Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error("New password is required.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changeKidPassword(newPassword);
      if (res.success) {
        toast.success(res.message || "Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.error || "Failed to change password.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Settings Header */}
      <div>
        <h1 className="text-4xl font-black tracking-tight text-foreground">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground font-medium mt-2">
          Manage your student profile and learning account security.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto p-1 pb-2 -mb-2 w-full">
          <TabsList className="flex !h-auto p-1 bg-muted dark:bg-slate-900 rounded-full w-full">
            <TabsTrigger
              value="profile"
              className="flex-1 rounded-full font-bold text-xs sm:text-base flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 cursor-pointer py-2.5 sm:py-3.5 data-active:bg-background data-active:text-foreground dark:data-active:bg-input/50 whitespace-nowrap shrink-0"
            >
              <UserRound className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span>
                Profile<span className="hidden sm:inline"> Details</span>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex-1 rounded-full font-bold text-xs sm:text-base flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 cursor-pointer py-2.5 sm:py-3.5 data-active:bg-background data-active:text-foreground dark:data-active:bg-input/50 whitespace-nowrap shrink-0"
            >
              <KeyRound className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span>
                <span className="hidden sm:inline">Account & </span>Security
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Profile Details */}
        <TabsContent value="profile" className="mt-8">
          <Card className="rounded-[32px] border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="p-5 sm:p-8 lg:p-10 border-b border-border">
              <CardTitle className="text-2xl font-black text-card-foreground">
                Profile Details
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground font-medium">
                Customize your display profile and settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-8 lg:p-10 flex flex-col gap-8">
              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-8">
                {/* Profile Picture Upload Container */}
                <div className="flex flex-col gap-4">
                  <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Profile Photo
                  </Label>
                  <div className="flex flex-col sm:flex-row items-center gap-6 bg-muted/30 p-4 sm:p-6 rounded-3xl border border-border">
                    <AvatarUpload
                      initialAvatarUrl={avatarUrl}
                      onUploadSuccess={(url) => setAvatarUrl(url)}
                      label="Pick a Profile Photo"
                      description="Click the photo circle to upload or replace your image automatically."
                    />
                  </div>
                </div>

                {/* Profile Grid Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="firstName" className="text-sm font-bold text-foreground ml-1">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="rounded-2xl border-input bg-background focus:bg-card h-13 text-base font-medium px-4"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="lastName" className="text-sm font-bold text-foreground ml-1">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="rounded-2xl border-input bg-background focus:bg-card h-13 text-base font-medium px-4"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="username" className="text-sm font-bold text-foreground ml-1">
                      Username
                    </Label>
                    <Input
                      id="username"
                      placeholder="e.g. kid_adventurer"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="rounded-2xl border-input bg-background focus:bg-card h-13 text-base font-medium px-4"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="dateOfBirth" className="text-sm font-bold text-foreground ml-1">
                      Date of Birth
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="rounded-2xl border-input bg-background focus:bg-card h-13 text-base font-medium px-4"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-border">
                  <Button
                    type="submit"
                    disabled={isSavingProfile}
                    className="rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold h-13 px-8 text-sm cursor-pointer shadow-md hover:shadow-lg dark:bg-sky-500 dark:hover:bg-sky-600 transition-all w-full sm:w-auto"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Account & Security */}
        <TabsContent value="security" className="mt-8">
          <div className="flex flex-col gap-8">
            {/* Account Info details */}
            <Card className="rounded-[32px] border border-border bg-card shadow-sm overflow-hidden">
              <CardHeader className="p-5 sm:p-8 lg:p-10 border-b border-border">
                <CardTitle className="text-2xl font-black text-card-foreground">
                  Account Information
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground font-medium">
                  General details tied to your account authentication credentials.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-8 lg:p-10 flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4 bg-muted/30 p-4 sm:p-6 rounded-3xl border border-border">
                    <Mail className="w-6 h-6 text-sky-600 dark:text-sky-400 mt-1 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Email Address
                      </h4>
                      <p className="text-base font-extrabold text-foreground mt-1.5 break-all">
                        {profile.email}
                      </p>
                      <Badge className="bg-muted text-muted-foreground border border-border font-bold text-[10px] uppercase px-2 py-1 rounded-md mt-3">
                        Primary Auth
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 bg-muted/30 p-4 sm:p-6 rounded-3xl border border-border">
                    <Shield className="w-6 h-6 text-sky-600 dark:text-sky-400 mt-1 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Role & Credentials
                      </h4>
                      <p className="text-base font-extrabold text-foreground mt-1.5 capitalize">
                        {profile.role}
                      </p>
                      <Badge className="bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border-none font-bold text-[10px] uppercase px-2 py-1 rounded-md mt-3">
                        Learning Account
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Password Form */}
            <Card className="rounded-[32px] border border-border bg-card shadow-sm overflow-hidden">
              <CardHeader className="p-5 sm:p-8 lg:p-10 border-b border-border">
                <CardTitle className="text-2xl font-black text-card-foreground">
                  Update Password
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground font-medium">
                  Ensure your learning account is secure by using a strong password.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-8 lg:p-10">
                <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="newPassword"
                        className="text-sm font-bold text-foreground ml-1"
                      >
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="rounded-2xl border-input bg-background focus:bg-card h-13 text-base font-medium pl-11"
                        />
                        <Lock className="absolute left-4 top-4 h-5 w-5 text-muted-foreground shrink-0" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-sm font-bold text-foreground ml-1"
                      >
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="rounded-2xl border-input bg-background focus:bg-card h-13 text-base font-medium pl-11"
                        />
                        <Lock className="absolute left-4 top-4 h-5 w-5 text-muted-foreground shrink-0" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-border mt-6">
                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      className="rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold h-13 px-8 text-sm cursor-pointer shadow-md hover:shadow-lg dark:bg-sky-500 dark:hover:bg-sky-600 transition-all w-full sm:w-auto"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
