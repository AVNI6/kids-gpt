import { Card, CardContent } from "@/components/shared/ui/card";
import { Skeleton } from "@/components/shared/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shared/ui/avatar";
import { Button } from "@/components/shared/ui/button";
import { GraduationCap, Megaphone } from "lucide-react";

export function ClassroomOverviewSkeleton() {
  return (
    <Card className="rounded-[32px] border-sky-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-8 w-48 bg-slate-100 dark:bg-slate-800" />
        <div className="flex gap-4">
          <Skeleton className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-32 bg-slate-100 dark:bg-slate-800" />
            <Skeleton className="h-4 w-48 bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClassroomOverview() {
  // Mocking classroom data since we don't fetch teacher profile yet
  const classroom = {
    name: "Mrs. Smith's 3rd Grade",
    teacher: "Mrs. Smith",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    subject: "All Subjects",
    rank: "Star Student",
    announcement: "Don't forget to complete your spelling bee practice!",
  };

  return (
    <Card className="rounded-[32px] border-sky-100 bg-white shadow-sm h-[400px] flex flex-col overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="p-6 sm:p-7 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight dark:text-slate-50">
              Your Classroom
            </h2>
            <p className="text-sm leading-6 text-slate-500 font-medium dark:text-slate-400">
              Connect with your teacher.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16 rounded-2xl border border-sky-100 shadow-sm dark:border-slate-800">
            <AvatarImage src={classroom.avatar} />
            <AvatarFallback className="rounded-2xl bg-sky-100 text-sky-700 font-bold dark:bg-sky-950/60 dark:text-sky-400">
              MS
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {classroom.name}
            </h3>
            <p className="text-sm font-semibold text-sky-600 flex items-center gap-1 dark:text-sky-400">
              {classroom.teacher} • {classroom.subject}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-sm mb-6 dark:bg-slate-950 dark:border-slate-800/80 dark:shadow-none">
          <div className="flex items-center gap-2 mb-2 text-rose-500 font-bold text-xs uppercase tracking-wider dark:text-rose-400">
            <Megaphone className="w-4 h-4" />
            Latest Announcement
          </div>
          <p className="text-slate-700 font-medium text-sm dark:text-slate-300">
            {classroom.announcement}
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold h-10 shadow-sm dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950">
            View Class
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold h-10 dark:border-slate-850 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
