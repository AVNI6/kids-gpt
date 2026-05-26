"use client";

import React from "react";
import { Menu } from "lucide-react";
import Link from "next/link";
import ShareLink from "../ShareLink";
import Navbar from "../Navbar";

interface ChatHeaderProps {
  openMobile: boolean;
  toggleSidebar: () => void;
  currentSessionId: string | null;
}

export default function ChatHeader({
  openMobile,
  toggleSidebar,
  currentSessionId,
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-background border-b border-border flex items-center px-4 md:px-6 font-bold text-sky-600 justify-between shrink-0">
      <div className="flex items-center gap-3">
        {!openMobile && (
          <button
            onClick={toggleSidebar}
            title="Open Menu"
            suppressHydrationWarning={true}
            className="md:hidden h-8 w-8 rounded-xl bg-sky-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform active:scale-95 cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="text-sky-600 font-black text-xl whitespace-nowrap">ChatGPT Kids</div>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {currentSessionId && <ShareLink sessionId={currentSessionId} />}
        <Navbar />
      </div>
    </header>
  );
}
