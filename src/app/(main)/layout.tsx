"use client";

import { ReactNode, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ScreenTimeTracker from "@/components/screentime/ScreenTimeTracker";

function GlobalMobileTrigger() {
  const { toggleSidebar, openMobile } = useSidebar();

  if (openMobile) return null;

  return (
    <button
      onClick={toggleSidebar}
      title="Open Menu"
      suppressHydrationWarning
      className="lg:hidden fixed top-4 left-4 z-55 h-8 w-8 rounded-xl bg-sky-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform active:scale-95 cursor-pointer"
    >
      <Menu className="w-4 h-4" />
    </button>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const { userProfile, isUserLoggedIn } = useAuth();
  const isKid = isUserLoggedIn && userProfile?.role === "kid";

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof document === "undefined") {
      return true;
    }
    const match = document.cookie.match(/(?:^|; )sidebar_state=(true|false)/);
    return match ? match[1] === "true" : true;
  });

  const layoutContent = (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="w-full h-screen flex bg-background text-foreground overflow-hidden">
        <Sidebar />
        <SidebarInset className="flex-1 min-w-0 h-full overflow-hidden flex flex-col relative">
          <GlobalMobileTrigger />
          <div className="flex-1 min-w-0 h-full overflow-y-auto bg-background">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );

  if (isKid) {
    return <ScreenTimeTracker>{layoutContent}</ScreenTimeTracker>;
  }

  return layoutContent;
}
