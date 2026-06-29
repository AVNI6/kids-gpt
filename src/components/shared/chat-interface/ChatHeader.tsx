"use client";

import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Logo from "@/components/shared/logo/Logo";
import { Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "@/types/user";

interface ChatHeaderProps {
  openMobile: boolean;
  toggleSidebar: () => void;
  currentSessionId: string | null;
  sessionOwnerProfile?: UserProfile | null;
  userRole?: string | null;
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  if (lastName) return lastName[0].toUpperCase();
  return "U";
}

export default function ChatHeader({ toggleSidebar, sessionOwnerProfile }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-background border-b border-border flex items-center px-4 md:px-6 font-bold text-sky-600 justify-between shrink-0 gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={toggleSidebar}
          title="Open Chat Sidebar"
          suppressHydrationWarning
          className="lg:hidden h-7 w-7 rounded-lg text-white flex items-center justify-center shrink-0 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer border-none bg-sky-500 hover:bg-sky-600 shadow-sky-500/20"
        >
          <Menu className="w-4 h-4" />
        </button>
        <Link href="/" prefetch={false} className="flex items-center gap-2 shrink-0">
          <Logo
            size="sm"
            iconType="none"
            text="Kidoza"
            textClassName="text-sm xs:text-base sm:text-xl"
          />
        </Link>
      </div>

      {/* Right side controls & info */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {sessionOwnerProfile && sessionOwnerProfile.role === "kid" && (
          <div className="flex items-center gap-1.5 sm:gap-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-slate-800/60 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm max-w-[110px] xs:max-w-[155px] sm:max-w-xs md:max-w-md min-w-0">
            <Avatar
              size="sm"
              className="border border-sky-500/20 shadow-sm shrink-0 w-6 h-6 sm:w-8 sm:h-8"
            >
              {sessionOwnerProfile.avatar_url ? (
                <AvatarImage
                  src={sessionOwnerProfile.avatar_url}
                  alt={sessionOwnerProfile.first_name || "User"}
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <AvatarFallback className="bg-sky-500/10 text-sky-600 font-bold text-[9px] sm:text-[10px]">
                {getInitials(sessionOwnerProfile.first_name, sessionOwnerProfile.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left leading-none min-w-0">
              <span className="text-[10px] sm:text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                {sessionOwnerProfile.first_name} {sessionOwnerProfile.last_name}
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 hidden sm:block truncate">
                Child Account
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <Navbar />
        </div>
      </div>
    </header>
  );
}
