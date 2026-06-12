import { Users, BookOpen, CheckCircle2, Megaphone, GraduationCap } from "lucide-react";

export function getNotifIcon(type: string) {
  switch (type) {
    case "classroom_request":
      return <Users className="size-4 text-indigo-650 dark:text-indigo-400" />;
    case "assignment_submitted":
      return <BookOpen className="size-4 text-amber-600 dark:text-amber-400" />;
    case "assignment_graded":
      return <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />;
    case "announcement":
      return <Megaphone className="size-4 text-sky-600 dark:text-sky-400" />;
    default:
      return <GraduationCap className="size-4 text-indigo-600 dark:text-indigo-400" />;
  }
}

export function getNotifBg(type: string) {
  switch (type) {
    case "classroom_request":
      return "bg-indigo-50 dark:bg-indigo-950/20";
    case "assignment_submitted":
      return "bg-amber-50 dark:bg-amber-950/20";
    case "assignment_graded":
      return "bg-emerald-50 dark:bg-emerald-950/20";
    case "announcement":
      return "bg-sky-50 dark:bg-sky-950/20";
    default:
      return "bg-indigo-50 dark:bg-indigo-950/20";
  }
}
