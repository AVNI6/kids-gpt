"use client";

import React, { useState } from "react";
import { UserRound, KeyRound, Mail, Shield } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarUpload } from "@/components/ui/avatar-upload";

import type { DashboardUserProfile } from "@/types/parent";
import {
  updateParentProfileSettings,
  changeParentPassword,
} from "@/lib/services/parent/settings.actions";

import { useAuth } from "@/hooks/useAuth";
import ChangePasswordModal from "@/components/shared/forms/ChangePasswordModal";

interface ParentSettingsContainerProps {
  profile: DashboardUserProfile;
}

export default function ParentSettingsContainer({ profile }: ParentSettingsContainerProps) {
  const { refreshProfile } = useAuth();
  // Tabs state
  const [activeTab, setActiveTab] = useState("profile");

  // Profile Form state
  const [firstName, setFirstName] = useState(profile.first_name || "");
  const [lastName, setLastName] = useState(profile.last_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const hasChanges = 
    firstName !== (profile.first_name || "") ||
    lastName !== (profile.last_name || "") ||
    avatarUrl !== (profile.avatar_url || "");

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error("First name is required.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateParentProfileSettings({
        firstName,
        lastName,
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
          Manage your guardian profile and account security settings.
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
                Customize your display profile settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-8 lg:p-10 flex flex-col gap-8">
              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-8">
                {/* Responsive grid for photo on the left, name fields on the right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
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
                  <div className="flex flex-col gap-4">
                    {/* Spacer label to align horizontally with the Profile Photo label on desktop */}
                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1 lg:block">
                      Personal Details
                    </Label>
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
                    </div>
                  </div>
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
                        Guardian Account
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
                    changePasswordAction={changeParentPassword}
                    role="parent"
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
