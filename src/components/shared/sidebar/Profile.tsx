"use client";
import {
  UserRound,
  Sparkles,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  LogOut,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shared/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shared/ui/avatar";
import Link from "next/link";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/constants/common";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/shared/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shared/ui/alert-dialog";

interface ProfileProps {
  isCollapsed?: boolean;
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "U";
}

export default function Profile({ isCollapsed }: ProfileProps) {
  const { user, userProfile, isUserLoggedIn, logout } = useAuth();
  const { setTheme, theme } = useTheme();
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const isPopoverOpen = openPath === pathname;

  // Wait until mounted on client to prevent theme mismatches or hydration errors
  useState(() => {
    setMounted(true);
  });

  if (!isUserLoggedIn || !user) return null;

  const displayName = userProfile
    ? `${userProfile.first_name} ${userProfile.last_name ?? ""}`.trim()
    : (user.email?.split("@")[0] ?? "User");

  const avatarUrl =
    userProfile?.avatar_url ?? (user.user_metadata?.avatar_url as string | undefined);
  const dashboardRole = userProfile?.role ?? "kid";

  return (
    <div className="w-full">
      <Popover open={isPopoverOpen} onOpenChange={(open) => setOpenPath(open ? pathname : null)}>
        <PopoverTrigger
          className={cn(
            "w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-sidebar-accent transition-all duration-300 group",
            isCollapsed && "justify-center p-0! h-10! w-10! mx-auto"
          )}
        >
          <Avatar size="lg" className="border-2 border-emerald-500/20 shadow-sm shrink-0">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-emerald-500/10 text-emerald-600 font-bold text-base">
              {getInitials(displayName, user.email)}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 text-left flex-1">
              <span className="text-sm font-bold text-sidebar-foreground truncate uppercase tracking-tight">
                {displayName}
              </span>
              <span className="text-xs font-medium text-sidebar-foreground/50">Free</span>
            </div>
          )}
        </PopoverTrigger>

        <PopoverContent
          className="w-64 p-2 rounded-2xl shadow-xl border-sidebar-border bg-popover"
          side={isCollapsed ? "right" : "top"}
          align={isCollapsed ? "end" : "center"}
          sideOffset={12}
        >
          <div className="space-y-1">
            <Link
              href={APP_ROUTES.Subscription}
              onClick={() => setOpenPath(null)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sky-500 hover:bg-sky-50 transition-colors text-sm font-bold"
            >
              <Sparkles className="h-4 w-4" />
              <span>Try Premium</span>
            </Link>

            <Link
              href={`/dashboard/${dashboardRole}`}
              onClick={() => setOpenPath(null)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-popover-foreground/70 hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-semibold"
            >
              <UserRound className="h-4 w-4" />
              <span>View Profile</span>
            </Link>

            <Link
              href={APP_ROUTES.Help}
              onClick={() => setOpenPath(null)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-popover-foreground/70 hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-semibold"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Help</span>
            </Link>

            <div className="py-4 px-3">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 opacity-50" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-50">Theme</span>
              </div>
              <div className="flex bg-accent/50 p-1 rounded-lg gap-1">
                <button
                  onClick={() => {
                    setTheme("light");
                    setOpenPath(null);
                  }}
                  className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${mounted && theme === "light" ? "bg-background shadow-sm text-sky-500" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Sun className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setTheme("dark");
                    setOpenPath(null);
                  }}
                  className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${mounted && theme === "dark" ? "bg-background shadow-sm text-sky-500" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Moon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setTheme("system");
                    setOpenPath(null);
                  }}
                  className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${mounted && theme === "system" ? "bg-background shadow-sm text-sky-500" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Monitor className="h-4 w-4" />
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
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors text-sm font-semibold cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
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
          <AlertDialogFooter className="gap-2 pt-4">
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
