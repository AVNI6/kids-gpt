"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/shared/ui/sidebar";

export default function KidTopNav() {
  const pathname = usePathname() || "";
  const { toggleSidebar } = useSidebar();

  const isDashboard = pathname === "/dashboard/kid";
  const brandText = isDashboard ? "Explorer Hub" : "ChatGPT Kids";

  return (
    <nav className="sticky top-0 z-40 w-full h-16 bg-background border-b border-border flex items-center shrink-0">
      <div className="max-w-400 mx-auto px-4 md:px-6 lg:px-8 w-full">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left Section: Mobile Hamburger Trigger & Brand */}
          <div className="flex items-center shrink-0 gap-3">
            <button
              onClick={toggleSidebar}
              title="Open Menu"
              suppressHydrationWarning
              className="lg:hidden h-10 w-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/20 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center shrink-0 ">
              <span className="font-extrabold text-xl tracking-tight bg-linear-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent drop-shadow-xs">
                {brandText}
              </span>
            </div>
          </div>

          {/* Right Section: Empty Spacer */}
          <div className="flex items-center shrink-0" />
        </div>
      </div>
    </nav>
  );
}
