"use client";

import React, { useState, useTransition, useRef } from "react";
import { UserRound, KeyRound, Loader2, Camera, Mail, Shield } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { DashboardUserProfile } from "@/types/kid";
import {
  updateTeacherProfileSettings,
  changeTeacherPassword,
} from "@/lib/services/teacher/settings.actions";
import { uploadAvatar } from "@/lib/services/shared/profile.actions";

import { useAuth } from "@/hooks/useAuth";
import ChangePasswordModal from "@/components/shared/forms/ChangePasswordModal";

interface TeacherSettingsContainerProps {
  profile: DashboardUserProfile;
}

export default function TeacherSettingsContainer({ profile }: TeacherSettingsContainerProps) {
  const { refreshProfile } = useAuth();
  // Tabs state
  const [activeTab, setActiveTab] = useState("profile");

  // Profile Form state
  const [firstName, setFirstName] = useState(profile.first_name || "");
  const [lastName, setLastName] = useState(profile.last_name || "");
  const [username, setUsername] = useState(profile.username || "");
  const [organization, setOrganization] = useState(profile.standard || "");
  const [mobileNo, setMobileNo] = useState(profile.mobile_no || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const hasChanges = 
    firstName !== (profile.first_name || "") ||
    lastName !== (profile.last_name || "") ||
    username !== (profile.username || "") ||
    organization !== (profile.standard || "") ||
    mobileNo !== (profile.mobile_no || "") ||
    avatarUrl !== (profile.avatar_url || "");

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, startUploadTransition] = useTransition();
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);



  // Initials helper
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim().toUpperCase() || "T";
  const displayUrl = avatarUrl || localPreviewUrl || "";

  // Handle Avatar Change
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

    startUploadTransition(async () => {
      try {
        const result = await uploadAvatar(formData);
        if (result && result.avatarUrl) {
          setAvatarUrl(result.avatarUrl);
          toast.success("Profile avatar uploaded successfully!");
          await refreshProfile();
        } else {
          toast.error("Avatar upload failed");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to upload avatar.");
      }
    });
  };

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error("First name is required.");
      return;
    }

    if (mobileNo.trim()) {
      const cleanPhone = mobileNo.replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        toast.error("Mobile number must be exactly 10 digits.");
        return;
      }
    }

    setIsSavingProfile(true);
    try {
      const res = await updateTeacherProfileSettings({
        firstName,
        lastName,
        organization,
        mobileNo,
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



  return (
    <div className="flex flex-col gap-8">
      {/* Settings Header */}
      <div>
        <h1 className="text-4xl font-black tracking-tight text-foreground">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground font-medium mt-2">
          Manage your educator profile and account security.
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
                Customize your public display profile and contact information.
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
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className={`relative group rounded-full p-1 border-2 border-border transition-all shrink-0 ${isUploading
                            ? "cursor-not-allowed opacity-80"
                            : "cursor-pointer hover:scale-105 hover:border-indigo-500 active:scale-95"
                          }`}
                      >
                        <Avatar className="w-24 h-24 rounded-full cursor-pointer">
                          <AvatarImage src={displayUrl || undefined} className="object-cover" />
                          <AvatarFallback className="text-3xl font-black bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        {/* Camera Overlay */}
                        <div className="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                          <Camera className="w-5 h-5 text-white mb-0.5" />
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                            Change
                          </span>
                        </div>

                        {/* Loading Spinner */}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center rounded-full animate-in fade-in duration-200">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          </div>
                        )}
                      </button>

                      {/* Corner Camera Action Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="absolute bottom-1 right-1 p-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-full shadow-lg border-2 border-card cursor-pointer transition-all hover:scale-110 active:scale-95 flex items-center justify-center shrink-0"
                        title="Upload Avatar"
                      >
                        <Camera className="w-4 h-4" />
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </div>
                    <div className="text-center sm:text-left flex flex-col gap-1">
                      <h4 className="text-base font-extrabold text-foreground">Educator Avatar</h4>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[320px]">
                        Click on your photo to upload a custom profile picture. JPG, PNG, or WebP.
                        Max 5MB.
                      </p>
                    </div>
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
                      placeholder="e.g. educator_jane"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="rounded-2xl border-input bg-background focus:bg-card h-13 text-base font-medium px-4"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="mobileNo" className="text-sm font-bold text-foreground ml-1">
                      Mobile Number
                    </Label>
                    <Input
                      id="mobileNo"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={mobileNo}
                      onChange={(e) => setMobileNo(e.target.value)}
                      className="rounded-2xl border-input bg-background focus:bg-card h-13 text-base font-medium px-4"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="school" className="text-sm font-bold text-foreground ml-1">
                    School / Organization
                  </Label>
                  <Input
                    id="school"
                    placeholder="e.g. Bright Future Academy"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="rounded-2xl border-input bg-background focus:bg-card h-13 text-base font-medium px-4"
                  />
                </div>

                <div className="flex justify-end pt-6 border-t border-border">
                  <Button
                    type="submit"
                    loading={isSavingProfile}
                    disabled={!hasChanges}
                    loadingText="Saving..."
                    className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-13 px-8 text-sm cursor-pointer shadow-md hover:shadow-lg dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all w-full sm:w-auto"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Account & Security */}
        <TabsContent value="security" className="mt-8">
          <div className="flex flex-col gap-8">
            {/* Account Info details (Read-only metadata) */}
            <Card className="rounded-[32px] border border-border bg-card shadow-sm overflow-hidden">
              <CardHeader className="p-5 sm:p-8 lg:p-10 border-b border-border">
                <CardTitle className="text-2xl font-black text-card-foreground">
                  Account Information
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground font-medium">
                  General details and permissions tied to your account authentication credentials.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-8 lg:p-10 flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4 bg-muted/30 p-4 sm:p-6 rounded-3xl border border-border">
                    <Mail className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1 shrink-0" />
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
                    <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Role & Credentials
                      </h4>
                      <p className="text-base font-extrabold text-foreground mt-1.5 capitalize">
                        {profile.role}
                      </p>
                      <Badge className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-none font-bold text-[10px] uppercase px-2 py-1 rounded-md mt-3">
                        Full Educator Permissions
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Password Form */}
            <Card className="rounded-[32px] border border-border bg-card shadow-sm overflow-hidden">
              <CardHeader className="p-5 border-b border-border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                  <div>
                    <CardTitle className="text-2xl font-black text-card-foreground">
                      Update Password
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-medium mt-2">
                      Ensure your account is secure by using a strong password.
                    </p>
                  </div>
                  <ChangePasswordModal
                    email={profile.email || ""}
                    changePasswordAction={changeTeacherPassword}
                    role="teacher"
                  />
                </div>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
