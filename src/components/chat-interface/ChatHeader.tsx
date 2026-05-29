"use client";

import React from "react";
import Link from "next/link";
import ShareLink from "../ShareLink";
import Navbar from "../Navbar";

interface ChatHeaderProps {
  openMobile: boolean;
  toggleSidebar: () => void;
  currentSessionId: string | null;
}

export default function ChatHeader({ currentSessionId }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-background border-b border-border flex items-center px-4 md:px-6 font-bold text-sky-600 justify-between shrink-0">
      <div className="flex items-center gap-3 pl-12 lg:pl-0">
        <Link href="/" prefetch={false} className="flex items-center gap-2 shrink-0">
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
