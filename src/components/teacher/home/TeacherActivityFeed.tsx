"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Activity, Send, Award, FileUp, Megaphone, PlusCircle, HelpCircle } from "lucide-react";
import { getRelativeTime } from "@/hooks/shared/timeUtils";
import { ScrollArea } from "@/components/ui/scroll-area";

export type ActivityEvent = {
  id: string;
  event_type: string;
  actor_user_id: string;
  actor_role: string;
  actor_first_name: string | null;
  actor_last_name: string | null;
  actor_avatar_url: string | null;
  target_user_id: string | null;
  target_first_name: string | null;
  target_last_name: string | null;
  target_avatar_url: string | null;
  source_type: string;
  source_id: string;
  metadata: {
    title?: string;
    score?: number;
    total_points?: number;
    classroom_id?: string;
  };
  created_at: string;
  classroom_name: string | null;
  classroom_id: string | null;
};

type Props = {
  activityEvents: ActivityEvent[];
};

export default function TeacherActivityFeed({ activityEvents }: Props) {
  const getEventConfig = (eventType: string) => {
    switch (eventType) {
      case "ASSIGNMENT_CREATED":
      case "ASSIGNMENT_PUBLISHED":
        return {
          icon: PlusCircle,
          color: "text-indigo-500",
          bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
          border: "border-indigo-100 dark:border-indigo-900/30",
        };
      case "ASSIGNMENT_SUBMITTED":
        return {
          icon: Send,
          color: "text-amber-500",
          bgColor: "bg-amber-50 dark:bg-amber-950/40",
          border: "border-amber-100 dark:border-amber-900/30",
        };
      case "ASSIGNMENT_GRADED":
        return {
          icon: Award,
          color: "text-emerald-500",
          bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
          border: "border-emerald-100 dark:border-emerald-900/30",
        };
      case "RESOURCE_UPLOADED":
        return {
          icon: FileUp,
          color: "text-purple-500",
          bgColor: "bg-purple-50 dark:bg-purple-950/40",
          border: "border-purple-100 dark:border-purple-900/30",
        };
      case "ANNOUNCEMENT_POSTED":
        return {
          icon: Megaphone,
          color: "text-sky-500",
          bgColor: "bg-sky-50 dark:bg-sky-950/40",
          border: "border-sky-100 dark:border-sky-900/30",
        };
      default:
        return {
          icon: HelpCircle,
          color: "text-slate-500",
          bgColor: "bg-slate-50 dark:bg-slate-900/40",
          border: "border-slate-100 dark:border-slate-800/40",
        };
    }
  };

  const renderEventMessage = (event: ActivityEvent) => {
    const actorName = event.actor_first_name
      ? `${event.actor_first_name} ${event.actor_last_name || ""}`.trim()
      : event.actor_role === "teacher"
        ? "Teacher"
        : "Student";

    const targetName = event.target_first_name
      ? `${event.target_first_name} ${event.target_last_name || ""}`.trim()
      : "Student";

    const className = event.classroom_name ? `in "${event.classroom_name}"` : "";

    switch (event.event_type) {
      case "ASSIGNMENT_CREATED":
      case "ASSIGNMENT_PUBLISHED":
        return (
          <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
            <span className="font-extrabold text-slate-900 dark:text-white">{actorName}</span>{" "}
            published assignment{" "}
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              &ldquo;{event.metadata.title}&rdquo;
            </span>{" "}
            {className}.
          </p>
        );
      case "ASSIGNMENT_SUBMITTED":
        return (
          <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
            <span className="font-extrabold text-slate-900 dark:text-white">{actorName}</span>{" "}
            submitted assignment{" "}
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              &ldquo;{event.metadata.title}&rdquo;
            </span>{" "}
            {className}.
          </p>
        );
      case "ASSIGNMENT_GRADED":
        return (
          <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
            <span className="font-extrabold text-slate-900 dark:text-white">{actorName}</span>{" "}
            graded{" "}
            <span className="font-extrabold text-slate-950 dark:text-white">{targetName}</span>
            &apos;s assignment{" "}
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              &ldquo;{event.metadata.title}&rdquo;
            </span>
            .
            <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
              Score:{" "}
              {event.metadata.score !== undefined && event.metadata.total_points
                ? `${Math.round((event.metadata.score / event.metadata.total_points) * 100)}%`
                : "N/A"}
            </span>
          </p>
        );
      case "RESOURCE_UPLOADED":
        return (
          <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
            <span className="font-extrabold text-slate-900 dark:text-white">{actorName}</span>{" "}
            uploaded resource{" "}
            <span className="font-bold text-purple-600 dark:text-purple-400">
              &ldquo;{event.metadata.title}&rdquo;
            </span>{" "}
            {className}.
          </p>
        );
      case "ANNOUNCEMENT_POSTED":
        return (
          <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
            <span className="font-extrabold text-slate-900 dark:text-white">{actorName}</span>{" "}
            posted announcement{" "}
            <span className="font-bold text-sky-650 dark:text-sky-400">
              &ldquo;{event.metadata.title}&rdquo;
            </span>{" "}
            {className}.
          </p>
        );
      default:
        return (
          <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
            <span className="font-extrabold text-slate-900 dark:text-white">{actorName}</span>{" "}
            triggered a classroom update {className}.
          </p>
        );
    }
  };

  return (
    <Card className="rounded-[32px] border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-black/30 shadow-sm overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-500 animate-pulse" /> Recent Classroom Activity
        </h3>
      </div>

      <CardContent>
        <ScrollArea className="max-h-[360px] pr-4 -mr-4">
          <div className="divide-slate-100 dark:divide-slate-800/40 pr-2">
            {activityEvents.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-bold text-sm">
                No activity logged yet!
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Classroom activity will appear here once students submit assignments or you post
                  updates.
                </p>
              </div>
            ) : (
              activityEvents.map((event, idx) => {
                const config = getEventConfig(event.event_type);
                const Icon = config.icon;

                // Resolve which avatar to display: actor's avatar
                const avatarUrl = event.actor_avatar_url;
                const initials = event.actor_first_name?.[0] || "?";

                return (
                  <div key={event.id || idx} className="flex gap-4 items-start py-4 px-0 md:px-3">
                    <Avatar className="w-9 h-9 border border-white dark:border-slate-800 rounded-full shrink-0 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800">
                      <AvatarImage src={avatarUrl ?? undefined} className="object-cover" />
                      <AvatarFallback className="text-xs font-black bg-indigo-500 text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                          {event.event_type.replace("_", " ")}
                        </span>
                        <span
                          className="text-[10px] font-bold text-slate-400 shrink-0 ml-2"
                          suppressHydrationWarning
                        >
                          {getRelativeTime(event.created_at)}
                        </span>
                      </div>
                      {renderEventMessage(event)}
                    </div>

                    <div
                      className={`hidden sm:flex w-8 h-8 rounded-full items-center justify-center shrink-0 border ${config.bgColor} ${config.border}`}
                    >
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
