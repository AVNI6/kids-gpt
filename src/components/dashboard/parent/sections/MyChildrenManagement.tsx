"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Settings2,
  GraduationCap,
  School,
  Mail,
  Target,
  BarChart2,
  Link2,
} from "lucide-react";
import type { LinkedChildProfile } from "@/types/dashboard.types";
import { linkByEmail } from "@/actions/dashboard.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getAge(dob: string | null): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  return new Date().getFullYear() - birthDate.getFullYear();
}

function getGradeFromAge(age: number | null): string {
  if (age === null) return "N/A";
  if (age < 5) return "Pre-K";
  if (age > 18) return "Graduated";
  return `Grade ${age - 5}`;
}

export default function MyChildrenManagement({
  linkedChildren,
}: {
  linkedChildren: LinkedChildProfile[];
}) {
  const [linkEmail, setLinkEmail] = useState("");
  const [linkMessage, setLinkMessage] = useState<string | null>(null);

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            My Children
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Manage your children&apos;s profiles and learning settings.
          </p>
        </div>
        <Dialog>
          <DialogTrigger
            render={
              <Button className="rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-sm h-11 px-6 font-bold">
                <Plus className="w-5 h-5 mr-2" /> Add Child
              </Button>
            }
          />
          <DialogContent className="max-w-md rounded-[24px] dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-lg font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
                <Link2 className="h-5 w-5 text-sky-600" /> Link a Child
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                Invite a child by email. If they haven&apos;t signed up yet, we&apos;ll send a
                pending invite.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleLinkSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="childEmail" className="dark:text-slate-300">
                  Child&apos;s Email
                </Label>
                <Input
                  id="childEmail"
                  name="childEmail"
                  type="email"
                  value={linkEmail}
                  onChange={(event) => setLinkEmail(event.target.value)}
                  placeholder="child@example.com"
                  className="h-10 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-lg bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
              >
                Send Link Invite
              </Button>

              {linkMessage ? (
                <p className="rounded-lg bg-sky-50 dark:bg-sky-900/30 px-4 py-3 text-sm font-medium text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800/50">
                  {linkMessage}
                </p>
              ) : null}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {linkedChildren.map((child) => {
          const age = getAge(child.date_of_birth);
          const gradeStr = getGradeFromAge(age);
          const ageStr = age !== null ? `Age ${age}` : "Age N/A";

          return (
            <Card
              key={child.user_id}
              className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/60 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <CardContent className="p-8 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <Avatar className="w-20 h-20 border-4 border-white dark:border-slate-800 shadow-sm ring-2 ring-slate-100 dark:ring-slate-800">
                    <AvatarImage src={child.avatar_url ?? undefined} className="object-cover" />
                    <AvatarFallback className="text-2xl font-black bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                      {child.first_name?.[0] || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full"
                  >
                    <Settings2 className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-1 mb-6">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    {child.first_name} {child.last_name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4" /> {gradeStr}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span>{ageStr}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm">
                      <School className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                        Classroom
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        Science Explorers (Mr. Smith)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm">
                      <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                        Learning Level
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        Intermediate
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 font-bold h-11"
                  >
                    <BarChart2 className="w-4 h-4 mr-2" /> Reports
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 font-bold h-11"
                  >
                    <Mail className="w-4 h-4 mr-2" /> Teacher
                  </Button>
                  <Button className="w-full col-span-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold h-11">
                    Manage Learning
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
