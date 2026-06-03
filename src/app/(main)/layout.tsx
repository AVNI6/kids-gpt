"use client";

import { ReactNode, useState } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/shared/sidebar/Sidebar";
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/shared/ui/sidebar";
import { Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ScreenTimeTracker from "@/components/shared/screentime/ScreenTimeTracker";
import KidTopNav from "@/components/kid/dashboard/KidTopNav";

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
  const pathname = usePathname() || "";
  const { userProfile, isUserLoggedIn } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )sidebar_state=(true|false)/);
    const nextSidebarOpen = match ? match[1] === "true" : true;
    const timeoutId = window.setTimeout(() => {
      setSidebarOpen(nextSidebarOpen);
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const isKid = mounted && isUserLoggedIn && userProfile?.role === "kid";
  const showKidNav = isKid;

  const isKidPath =
    pathname.startsWith("/dashboard/kid") ||
    pathname.startsWith("/activities") ||
    pathname.startsWith("/chat/kid");

  const hideFloatingTrigger = showKidNav || isKidPath;

  const layoutContent = (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="w-full h-screen flex bg-background text-foreground overflow-hidden">
        <Sidebar />
        <SidebarInset className="flex-1 min-w-0 h-full overflow-hidden flex flex-col relative">
          {!hideFloatingTrigger && <GlobalMobileTrigger />}
          {showKidNav && <KidTopNav />}
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
