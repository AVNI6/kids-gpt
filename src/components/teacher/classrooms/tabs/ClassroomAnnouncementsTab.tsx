"use client";

import { useState } from "react";
import { PlusCircle, Megaphone, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shared/ui/dialog";
import { toast } from "sonner";
import { createAnnouncement } from "@/lib/services/kid/classroom.actions";
import type { ClassroomAnnouncement } from "@/types/classroom.types";

type Props = {
  classroomId: string;
  announcements: ClassroomAnnouncement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<ClassroomAnnouncement[]>>;
  handleDeleteAnnouncement: (id: string) => Promise<void>;
};

export default function ClassroomAnnouncementsTab({
  classroomId,
  announcements,
  setAnnouncements,
  handleDeleteAnnouncement,
}: Props) {
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Create Announcement inputs
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;

    try {
      setIsLoading(true);
      const result = await createAnnouncement(classroomId, annTitle, annMessage);

      if (result.success && result.announcement) {
        toast.success("Announcement published!");
        setAnnouncements([result.announcement, ...announcements]);
        setAnnouncementOpen(false);
        setAnnTitle("");
        setAnnMessage("");
      } else {
        toast.error(result.error || "Failed to post announcement.");
      }
    } catch {
      toast.error("Failed to post announcement.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-indigo-600" />
            Classroom Announcements
          </h3>
          <p className="text-xs text-slate-500 font-semibold">
            Publish updates and notices directly to the students feed.
          </p>
        </div>

        <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
          <DialogTrigger
            render={
              <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-5 shadow-sm cursor-pointer">
                <PlusCircle className="mr-2 h-4 w-4" />
                Post Announcement
              </Button>
            }
          />
          <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
            <DialogHeader className="border-b border-slate-200 dark:border-slate-800 px-6 pt-6 pb-4">
              <DialogTitle className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
                Post Announcement
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Alert your class about upcoming events, homework or changes.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 px-6 py-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="annTitle"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                >
                  Subject / Title*
                </Label>
                <Input
                  id="annTitle"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  required
                  placeholder="e.g. Science Lab Rescheduled"
                  className="rounded-xl h-11 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="annMessage"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1"
                >
                  Announcement Message*
                </Label>
                <textarea
                  id="annMessage"
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  required
                  placeholder="Write your note to the class here..."
                  className="rounded-xl w-full border border-slate-200 dark:border-slate-800 p-3 bg-background text-xs font-semibold focus:border-indigo-500 focus:ring-0 resize-none h-28"
                />
              </div>

              <DialogFooter className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-4 -mx-6 -mb-6 flex gap-2 rounded-b-[32px]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAnnouncementOpen(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                >
                  Publish
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {announcements.length === 0 ? (
        <Card className="rounded-[32px] border-dashed border-2 border-indigo-150 dark:border-slate-800 bg-indigo-50/5 p-12 text-center">
          <CardContent className="space-y-4 p-0 max-w-sm mx-auto flex flex-col items-center">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-950 dark:text-white">
                No announcements
              </h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                Send updates or alerts to notify kids instantly about classroom activities.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <Card
              key={ann.id}
              className="rounded-[28px] border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/40 shadow-xs relative overflow-hidden"
            >
              <CardContent className="p-6 md:p-7 flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex gap-4 items-start">
                  <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-950 dark:text-white leading-tight">
                      {ann.title}
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {new Date(ann.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed pt-2 whitespace-pre-wrap">
                      {ann.message}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => handleDeleteAnnouncement(ann.id)}
                  className="h-8 w-8 rounded-full p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 self-end sm:self-start shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
