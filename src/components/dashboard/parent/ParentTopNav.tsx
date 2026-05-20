"use client";

import { useState } from "react";
import { Bell, ChevronDown, Menu, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DashboardUserProfile } from "@/types/dashboard.types";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams, useRouter } from "next/navigation";

export const PARENT_NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "children", label: "My Children" },
  { id: "progress", label: "Learning Progress" },
  { id: "reports", label: "Teacher Reports" },
  { id: "activities", label: "Activities" },
  { id: "monitoring", label: "Monitoring" },
];

type Props = {
  profile: DashboardUserProfile;
};

export default function ParentTopNav({ profile }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "home";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim() || "P";
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const setActiveTab = (id: string) => {
    router.push(`?tab=${id}`);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-400 mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {PARENT_NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeTab === item.id
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Section: Notifications & Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950"></span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 p-1 pr-2 md:pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/20">
                <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <AvatarImage src={profile.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-purple-100 text-purple-700 font-bold text-xs">
                    {getInitials(profile.first_name, profile.last_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-bold text-slate-700 dark:text-slate-200">
                  {profile.first_name || "Parent"}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-2xl border-slate-200 dark:border-slate-800"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-bold">My Account</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                <DropdownMenuItem
                  className="cursor-pointer rounded-xl focus:bg-slate-100 dark:focus:bg-slate-800"
                  onClick={() => setActiveTab("monitoring")}
                >
                  <Settings className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer rounded-xl focus:bg-slate-100 dark:focus:bg-slate-800"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4 text-red-500" />
                  <span className="text-red-600 dark:text-red-400 font-medium">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden items-end p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-lg animate-in slide-in-from-top-2">
          <div className="px-4 py-4 space-y-2">
            {PARENT_NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-colors ${
                  activeTab === item.id
                    ? "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
