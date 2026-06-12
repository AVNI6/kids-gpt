import { APP_ROUTES } from "@/lib/constants/common";
import { BookOpen, Settings, Home } from "lucide-react";
import type { NavItemConfig } from "./kid-nav";

export const teacherNavItems: NavItemConfig[] = [
  { label: "Home", href: APP_ROUTES.TeacherDashboard, exact: true, icon: Home },
  { label: "Classrooms", href: APP_ROUTES.TeacherClassrooms, exact: false, icon: BookOpen },
  { label: "Settings", href: APP_ROUTES.TeacherSettings, exact: false, icon: Settings },
];
