"use client";

import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Logo from "@/components/shared/logo/Logo";
import { Menu } from "lucide-react";

interface ChatHeaderProps {
  openMobile: boolean;
  toggleSidebar: () => void;
  currentSessionId: string | null;
}

export default function ChatHeader({ toggleSidebar }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-background border-b border-border flex items-center px-4 md:px-6 font-bold text-sky-600 justify-between shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          title="Open Chat Sidebar"
          suppressHydrationWarning
          className="lg:hidden h-7 w-7 rounded-lg text-white flex items-center justify-center shrink-0 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer border-none bg-sky-500 hover:bg-sky-600 shadow-sky-500/20"
        >
          <Menu className="w-4 h-4" />
        </button>
        <Link href="/" prefetch={false} className="flex items-center gap-2 shrink-0">
          <Logo size="sm" iconType="none" text="ChatGPT Kids" />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Navbar />
      </div>
    </header>
  );
}
