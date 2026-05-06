"use client";

import { useEffect, useState } from "react";
import { UserRound, PanelLeftClose } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient();

export default function Profile() {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setIsUserLoggedIn(true);
        setUser(user);
      }
    };
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsUserLoggedIn(true);
        setUser(session.user);
      } else {
        setIsUserLoggedIn(false);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
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
    window.location.reload();
  };

  if (!isUserLoggedIn || !user) return null;

  return (
    <div className="w-full pt-4 border-t border-sidebar-border">
      <Popover>
        <PopoverTrigger className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-sidebar-accent transition-all duration-300 group">
          <Avatar size="lg" className="border-2 border-emerald-500/20 shadow-sm shrink-0">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-emerald-500/10 text-emerald-600 font-bold text-base">
              {getInitials(user.user_metadata?.full_name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 text-left flex-1">
            <span className="text-sm font-bold text-sidebar-foreground truncate uppercase tracking-tight">
              {user.user_metadata?.full_name || user.email?.split("@")[0] || "Explorer"}
            </span>
            <span className="text-xs font-medium text-sidebar-foreground/50">Free</span>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-2 rounded-2xl shadow-xl border-sidebar-border bg-popover"
          side="top"
          align="center"
          sideOffset={12}
        >
          <div className="space-y-1">
            <Link href={`/dashboard/${user.user_metadata?.role || "kid"}/profile`}>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-popover-foreground/70 hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-semibold">
                <UserRound className="h-4 w-4" />
                <span>View Profile</span>
              </button>
            </Link>
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
