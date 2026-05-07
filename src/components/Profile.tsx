"use client";

import { useEffect, useState, useRef } from "react";
import {
  UserRound,
  PanelLeftClose,
  Sparkles,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/constant/AppRoutes";

const supabase = createClient();

interface ProfileProps {
  isCollapsed?: boolean;
}

export default function Profile({ isCollapsed }: ProfileProps) {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const inFlightRef = useRef(false);
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    let mounted = true;
    // prevent concurrent in-flight checks from colliding under React Strict Mode
    const inFlight = inFlightRef;

    const checkUser = async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        // getSession checks local cache first and avoids triggering network locks
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          setIsUserLoggedIn(true);
          setUser(session.user);
        } else {
          setIsUserLoggedIn(false);
          setUser(null);
        }
      } catch (err) {
        console.error("Profile: failed to get session", err);
      } finally {
        inFlight.current = false;
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setIsUserLoggedIn(true);
        setUser(session.user);
      } else {
        setIsUserLoggedIn(false);
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      try {
        subscription.unsubscribe();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.split(" ");
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return parts[0][0].toUpperCase();
    }
    if (email) return email[0].toUpperCase();
    return "U";
  };

  const handleLogOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
    }
    setIsUserLoggedIn(false);
    setUser(null);
    window.location.href = "/";
  };

  if (!isUserLoggedIn || !user) return null;

  return (
    <div className="w-full pt-4">
      <Popover>
        <PopoverTrigger
          className={cn(
            "w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-sidebar-accent transition-all duration-300 group",
            isCollapsed && "justify-center p-0 h-10 w-10 mx-auto"
          )}
        >
          <Avatar size="lg" className="border-2 border-emerald-500/20 shadow-sm shrink-0">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-emerald-500/10 text-emerald-600 font-bold text-base">
              {getInitials(user.user_metadata?.full_name, user.email)}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 text-left flex-1">
              <span className="text-sm font-bold text-sidebar-foreground truncate uppercase tracking-tight">
                {user.user_metadata?.full_name || user.email?.split("@")[0] || "Explorer"}
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
            <Link href={APP_ROUTES.Subscription}>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sky-500 hover:bg-sky-50 transition-colors text-sm font-bold">
                <Sparkles className="h-4 w-4" />
                <span>Try Premium</span>
              </button>
            </Link>
            <Link href={`/dashboard/${user.user_metadata?.role || "kid"}`}>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-popover-foreground/70 hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-semibold">
                <UserRound className="h-4 w-4" />
                <span>View Profile</span>
              </button>
            </Link>

            <Link href={APP_ROUTES.Help}>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-popover-foreground/70 hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-semibold">
                <HelpCircle className="h-4 w-4" />
                <span>Help</span>
              </button>
            </Link>

            <div className="py-4 px-3">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 opacity-50" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-50">Theme</span>
              </div>
              <div className="flex bg-accent/50 p-1 rounded-lg gap-1">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${theme === "light" ? "bg-background shadow-sm text-sky-500" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Sun className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${theme === "dark" ? "bg-background shadow-sm text-sky-500" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Moon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${theme === "system" ? "bg-background shadow-sm text-sky-500" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="border-t border-border/50 my-1" />

            <button
              onClick={handleLogOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors text-sm font-semibold"
            >
              <PanelLeftClose className="h-4 w-4 rotate-180" />
              <span>Log Out</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
