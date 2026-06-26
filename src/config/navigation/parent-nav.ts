import { APP_ROUTES } from "@/lib/constants/app_routes";
import { Users, BarChart3, ClipboardList, Home } from "lucide-react";
import type { NavItemConfig } from "./kid-nav";

export const parentNavItems: NavItemConfig[] = [
  { label: "Home", href: APP_ROUTES.ParentDashboard, exact: true, icon: Home },
  { label: "My Children", href: APP_ROUTES.ParentChildren, icon: Users },
  {
    label: "Learning Progress",
    href: APP_ROUTES.ParentProgress,
    isParameterized: true,
    icon: BarChart3,
  },
  {
    label: "Activities",
    href: APP_ROUTES.ParentActivities,
    isParameterized: true,
    icon: ClipboardList,
  },
];
