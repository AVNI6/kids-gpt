"use client";
import { UserRound, Settings, HelpCircle, Sun, Moon, Monitor, LogOut } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/constants/app_routes";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { ProfileSkeleton } from "@/components/shared/skeletonLoading";
import { useSidebar } from "@/components/ui/sidebar";

interface ProfileProps {
  isCollapsed?: boolean;
}

function getInitials(name?: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  return "U";
}

export default function Profile({ isCollapsed }: ProfileProps) {
  const { user, userProfile, isUserLoggedIn, logout, isLoading, isInitializing } = useAuth();
  const { setTheme, theme } = useTheme();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const isPopoverOpen = openPath === pathname;

  // Wait until mounted on client to prevent theme mismatches or hydration errors
  useState(() => {
    setMounted(true);
  });

  const isProfileLoading = isInitializing || (isUserLoggedIn && isLoading && !userProfile);

  if (isProfileLoading) {
    return <ProfileSkeleton isCollapsed={isCollapsed} />;
  }

  if (!isUserLoggedIn || !user || !userProfile) return null;

  const displayName =
    `${userProfile.first_name ?? ""} ${userProfile.last_name ?? ""}`.trim() ||
    user.email?.split("@")[0] ||
    "User";
  const avatarUrl = userProfile.avatar_url;
  const dashboardRole = userProfile.role ?? "kid";

  const handleLinkClick = () => {
    setOpenPath(null);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <div className="w-full">
      <Popover open={isPopoverOpen} onOpenChange={(open) => setOpenPath(open ? pathname : null)}>
        <PopoverTrigger
          className={cn(
            "w-full flex items-center gap-3 sm:p-2 rounded-2xl hover:bg-sidebar-accent transition-all duration-300 group",
            isCollapsed && "justify-center p-0! h-10! w-10! mx-auto"
          )}
        >
          <Avatar size="lg" className="border-2 border-emerald-500/20 shadow-sm shrink-0">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-emerald-500/10 text-emerald-600 font-bold text-base">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 text-left flex-1">
              <span className="text-body-sm font-bold text-sidebar-foreground truncate uppercase tracking-tight">
                {displayName}
              </span>
              <span className="text-body-xs font-medium text-sidebar-foreground/50">Free</span>
            </div>
          )}
        </PopoverTrigger>

        <PopoverContent
          className="w-56 sm:w-64 p-1 sm:p-2 rounded-2xl shadow-xl border-sidebar-border bg-popover"
          side={isCollapsed ? "right" : "top"}
          align={isCollapsed ? "end" : "center"}
          sideOffset={12}
        >
          <div>
            {/* <Link
              href={APP_ROUTES.Subscription}
              onClick={() => setOpenPath(null)}
              className="w-full flex items-center gap-3 px-2 py-2 sm:px-3 sm:py-2.5 rounded-xl text-sky-500 hover:bg-sky-50 transition-colors text-xs sm:text-sm font-bold"
            >
              <Sparkles className="h-4 w-4" />
              <span>Try Premium</span>
            </Link> */}

            <Link
              href={`/dashboard/${dashboardRole}`}
              onClick={handleLinkClick}
              prefetch={false}
              className="w-full flex items-center gap-3 px-2 py-2 sm:px-3 rounded-xl text-popover-foreground/70 hover:bg-accent hover:text-accent-foreground transition-colors text-body-sm font-semibold"
            >
              <UserRound className="icon-sm" />
              <span>View Profile</span>
            </Link>

            <Link
              href={`/dashboard/${dashboardRole}/settings`}
              onClick={handleLinkClick}
              prefetch={false}
              className="w-full flex items-center gap-3 px-2 py-2 sm:px-3 rounded-xl text-popover-foreground/70 hover:bg-accent hover:text-accent-foreground transition-colors text-body-sm font-semibold"
            >
              <Settings className="icon-sm" />
              <span>Settings</span>
            </Link>

            <Link
              href={APP_ROUTES.Help}
              onClick={handleLinkClick}
              prefetch={false}
              className="w-full flex items-center gap-3 px-2 py-2 sm:px-3 rounded-xl text-popover-foreground/70 hover:bg-accent hover:text-accent-foreground transition-colors text-body-sm font-semibold"
            >
              <HelpCircle className="icon-sm" />
              <span>Help</span>
            </Link>

            <div className="py-2 sm:py-4 px-2 sm:px-3">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="icon-sm md:w-4 md:h-4 opacity-50" />
                <span className="text-body-xs font-bold uppercase tracking-wider opacity-50">
                  Theme
                </span>
              </div>
              <div className="flex bg-accent/50 p-0.5 sm:p-1 rounded-lg gap-1">
                <button
                  onClick={() => {
                    setTheme("light");
                    setOpenPath(null);
                  }}
                  className={`flex-1 flex justify-center py-1 sm:py-1.5 rounded-md transition-all ${mounted && theme === "light" ? "bg-background shadow-sm text-sky-500" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Sun className="icon-sm md:w-4 md:h-4" />
                </button>
                <button
                  onClick={() => {
                    setTheme("dark");
                    setOpenPath(null);
                  }}
                  className={`flex-1 flex justify-center py-1 sm:py-1.5 rounded-md transition-all ${mounted && theme === "dark" ? "bg-background shadow-sm text-sky-500" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Moon className="icon-sm md:w-4 md:h-4" />
                </button>
                <button
                  onClick={() => {
                    setTheme("system");
                    setOpenPath(null);
                  }}
                  className={`flex-1 flex justify-center py-1 sm:py-1.5 rounded-md transition-all ${mounted && theme === "system" ? "bg-background shadow-sm text-sky-500" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Monitor className="icon-sm md:w-4 md:h-4" />
                </button>
              </div>
            </div>

            <div className="border-t border-border/50 my-1" />

            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenPath(null);
                setShowLogoutConfirm(true);
              }}
              className="w-full flex items-center gap-3 px-2 py-2 sm:px-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors text-body-sm font-semibold cursor-pointer"
            >
              <LogOut className="icon-sm" />
              <span>Log Out</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="sm:max-w-[400px] rounded-2xl border-border bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-foreground">
              Log Out?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground pt-2">
              Are you sure you want to log out of your session? You will need to sign in again to
              access your learning adventure.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={async () => {
                setShowLogoutConfirm(false);
                await logout();
              }}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm cursor-pointer"
            >
              Log Out
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
