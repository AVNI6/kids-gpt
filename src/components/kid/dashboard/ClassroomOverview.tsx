"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  Clock,
  LogOut,
  BookOpen,
  FolderOpen,
  FileSpreadsheet,
  Megaphone,
  School,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { joinClassroomByCode, leaveClassroom } from "@/lib/services/kid/classroom.actions";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import type { KidClassroomMembership } from "@/types/classroom.types";

type TeacherProfile = {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

type Props = {
  memberships: KidClassroomMembership[];
};

export default function ClassroomOverview({ memberships }: Props) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Group memberships
  const approvedClasses = memberships.filter((m) => m.status === "APPROVED");
  const pendingRequests = memberships.filter((m) => m.status === "PENDING");

  // Aggregate stats
  const joinedCount = approvedClasses.length;
  const pendingCount = pendingRequests.length;

  // Unique teachers count
  const teacherIds = new Set(
    approvedClasses.map((m) => m.classrooms.teacher_user_id).filter(Boolean)
  );
  const teacherCount = teacherIds.size;

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Please enter a class code.");
      return;
    }

    try {
      setIsLoading(true);
      const result = await joinClassroomByCode(cleanCode);
      if (result.success) {
        toast.success(result.message || "Join request submitted! Awaiting teacher approval.");
        setCode("");
      } else {
        toast.error(result.error || "Failed to join classroom.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveClass = async (classroomId: string, className: string) => {
    if (!confirm(`Are you sure you want to leave classroom "${className}"?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await leaveClassroom(classroomId);
      if (result.success) {
        toast.success(`You left the classroom "${className}".`);
      } else {
        toast.error(result.error || "Failed to leave classroom.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (firstName) {
      return `${firstName[0]}${lastName?.[0] ?? ""}`.toUpperCase();
    }
    return "T";
  };

  const formatTeacherName = (teacher?: TeacherProfile | null) => {
    if (!teacher) return "Educator";
    return `Mr/Ms. ${teacher.first_name || ""} ${teacher.last_name || ""}`.trim();
  };

  return (
    <div className="space-y-8 w-full">
      {/* 1. Learning Community Hero Section */}
      <Card className="rounded-[32px] overflow-hidden border-0 relative shadow-md bg-white dark:bg-slate-900 transition-colors duration-300">
        {/* Sky-Blue / Purple Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-sky-100/40 via-violet-50/20 to-sky-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pointer-events-none" />

        {/* Decorative Spheres */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="p-8 md:p-10 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-4 text-center lg:text-left">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Learning Community
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Welcome to your Classroom Hub!
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base font-semibold max-w-2xl leading-relaxed">
                Connect with teachers, track your active classrooms, and unlock educational quests
                together!
              </p>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="shrink-0 grid grid-cols-3 gap-4 w-full lg:w-auto bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 p-5 rounded-[28px] shadow-sm backdrop-blur-md">
            <div className="text-center px-2">
              <p className="text-2xl font-black text-slate-900 dark:text-white">{joinedCount}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                Joined
              </p>
            </div>
            <div className="text-center px-2 border-x border-slate-200 dark:border-slate-800">
              <p className="text-2xl font-black text-slate-900 dark:text-white">{pendingCount}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                Pending
              </p>
            </div>
            <div className="text-center px-2">
              <p className="text-2xl font-black text-slate-900 dark:text-white">{teacherCount}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                Teachers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Main Dashboard Layout (Grid) */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column (2/3) - Classrooms and Pending Cards */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Classrooms */}
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <School className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Active Classrooms
            </h3>

            {approvedClasses.length === 0 ? (
              <Card className="rounded-[32px] border-dashed border-2 border-indigo-100 bg-indigo-50/10 dark:border-indigo-950/20 dark:bg-indigo-950/5 p-8 text-center relative overflow-hidden">
                <CardContent className="space-y-3 p-0 max-w-sm mx-auto flex flex-col items-center">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      Not in any classrooms yet
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                      Enter a classroom code in the portal on the right to connect with your
                      teacher.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {approvedClasses.map((member) => {
                  const cls = member.classrooms;
                  return (
                    <Link
                      key={member.id}
                      href={`/dashboard/kid/classrooms/${cls.id}`}
                      className="block group"
                    >
                      <Card className="h-full rounded-[32px] border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/40 shadow-sm hover:shadow-md hover:border-indigo-150 transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 to-indigo-500" />

                        <CardContent className="p-6 pt-8 space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1.5">
                              <div className="flex gap-1.5 flex-wrap">
                                {cls.grade && (
                                  <Badge className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-none font-bold text-[9px] uppercase px-2 py-0.5 rounded-md">
                                    {cls.grade}
                                  </Badge>
                                )}
                                {cls.subject && (
                                  <Badge className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-none font-bold text-[9px] uppercase px-2 py-0.5 rounded-md">
                                    {cls.subject}
                                  </Badge>
                                )}
                                <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-none font-bold text-[9px] uppercase px-2 py-0.5 rounded-md">
                                  Enrolled
                                </Badge>
                              </div>
                              <h4 className="text-base font-extrabold text-slate-950 dark:text-white leading-tight">
                                {cls.name}
                              </h4>
                            </div>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleLeaveClass(cls.id, cls.name);
                              }}
                              className="h-8 w-8 rounded-full p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0"
                            >
                              <LogOut className="h-4 w-4" />
                            </Button>
                          </div>

                          {cls.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed line-clamp-2">
                              {cls.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 pt-2">
                            <Avatar className="h-9 w-9 border border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
                              <AvatarImage src={cls.teacher?.avatar_url ?? undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-indigo-600 text-white font-bold text-xs">
                                {getInitials(cls.teacher?.first_name, cls.teacher?.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                Teacher
                              </p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {formatTeacherName(cls.teacher)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Approval Requests */}
          {pendingRequests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                Awaiting Approval ({pendingRequests.length})
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                {pendingRequests.map((member) => {
                  const cls = member.classrooms;
                  return (
                    <Card
                      key={member.id}
                      className="rounded-[32px] border-amber-200/50 bg-amber-50/10 dark:border-amber-950/20 dark:bg-amber-950/5 relative overflow-hidden"
                    >
                      <CardContent className="p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-700 dark:text-amber-400">
                            <Clock className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-950 dark:text-white leading-tight">
                              {cls.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                              Teacher: {formatTeacherName(cls.teacher)}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border-none font-bold text-[10px] px-2.5 py-0.5 rounded-full shrink-0">
                          Pending
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Future Modules Placeholders */}
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <HelpCircle className="h-5 w-5 text-slate-400" />
              Classroom Modules
            </h3>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              {[
                { name: "Assignments", icon: BookOpen, color: "from-sky-500 to-indigo-500" },
                { name: "Resources", icon: FolderOpen, color: "from-emerald-500 to-teal-500" },
                { name: "Tests", icon: FileSpreadsheet, color: "from-amber-500 to-orange-500" },
                { name: "Announcements", icon: Megaphone, color: "from-rose-500 to-pink-500" },
              ].map((mod) => {
                const Icon = mod.icon;
                return (
                  <Card
                    key={mod.name}
                    className="rounded-[24px] border-slate-200/40 bg-slate-50/50 dark:border-slate-800/40 dark:bg-slate-900/10 opacity-75 shadow-none select-none relative overflow-hidden"
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center justify-center gap-2.5">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-400 shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-350">
                          {mod.name}
                        </p>
                        <Badge className="bg-slate-200 dark:bg-slate-850 text-[8px] text-slate-500 dark:text-slate-400 border-none font-extrabold uppercase scale-90 px-1.5 py-0">
                          Soon
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1/3) - Join Classroom Portal */}
        <div className="space-y-8">
          <Card className="rounded-[32px] border-slate-200/60 bg-white dark:bg-slate-900/40 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-950 dark:text-white tracking-tight">
                  Join a Classroom
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Enter your teacher&apos;s code to gain instant access to interactive courses and
                  classroom activities.
                </p>
              </div>

              <form onSubmit={handleJoinSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="ENTER CODE"
                    maxLength={6}
                    disabled={isLoading}
                    className="rounded-[20px] border-slate-200 dark:border-slate-800 uppercase font-mono font-black text-2xl text-center tracking-[0.2em] placeholder:tracking-normal placeholder:font-sans placeholder:font-bold placeholder:text-sm placeholder:text-slate-400 bg-slate-50/50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 h-16 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[10px] font-semibold text-slate-400 text-center">
                    Codes are 6 characters long (e.g. MATH12)
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || code.trim().length < 2}
                  className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Connect to Class</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              {/* Status Help Box */}
              <div className="rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20 p-4 space-y-2.5">
                <h4 className="text-xs font-black text-indigo-750 dark:text-indigo-300">
                  How it works:
                </h4>
                <ol className="list-decimal list-inside text-[11px] text-slate-500 dark:text-slate-400 font-semibold space-y-1.5">
                  <li>Ask your teacher for their classroom code</li>
                  <li>Enter the code above and submit your request</li>
                  <li>Once your teacher approves, your dashboard will activate!</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function ClassroomOverviewSkeleton() {
  return (
    <div className="space-y-8 w-full animate-pulse">
      <Card className="rounded-[32px] border-0 bg-slate-100/50 p-8 shadow-sm">
        <CardContent className="p-0 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-6 w-48 bg-slate-200" />
            <Skeleton className="h-8 w-96 bg-slate-200" />
            <Skeleton className="h-4 w-64 bg-slate-200" />
          </div>
          <Skeleton className="h-20 w-64 rounded-[28px] bg-slate-200" />
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-6 w-48 bg-slate-200" />
          <div className="grid gap-6 sm:grid-cols-2">
            <Skeleton className="h-32 rounded-[32px] bg-slate-100" />
            <Skeleton className="h-32 rounded-[32px] bg-slate-100" />
          </div>
        </div>
        <div>
          <Skeleton className="h-6 w-48 bg-slate-200" />
          <Skeleton className="h-64 rounded-[32px] bg-slate-100 mt-4" />
        </div>
      </div>
    </div>
  );
}
