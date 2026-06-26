import { APP_ROUTES } from "@/lib/constants/app_routes";
import { BookOpen, Home } from "lucide-react";
import type { NavItemConfig } from "./kid-nav";

export const teacherNavItems: NavItemConfig[] = [
  { label: "Home", href: APP_ROUTES.TeacherDashboard, exact: true, icon: Home },
  { label: "Classrooms", href: APP_ROUTES.TeacherClassrooms, exact: false, icon: BookOpen },
];
