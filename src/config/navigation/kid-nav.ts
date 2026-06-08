import { Home, School } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItemConfig {
  label: string;
  href: string;
  exact?: boolean;
  hasBadge?: boolean;
  isParameterized?: boolean;
  icon: LucideIcon;
}

export const kidNavItems: NavItemConfig[] = [
  { label: "Home", href: "/dashboard/kid", exact: true, icon: Home },
  {
    label: "Classrooms",
    href: "/dashboard/kid/classrooms",
    exact: false,
    hasBadge: true,
    icon: School,
  },
];
