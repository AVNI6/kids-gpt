"use client";

import { ReactNode, useState } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/shared/sidebar/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import ScreenTimeTracker from "@/components/shared/screentime/ScreenTimeTracker";
import DashboardNavbar from "@/components/shared/dashboard/DashboardNavbar";

export default function MainLayout({ children }: { children: ReactNode }) {
  const { userProfile, isUserLoggedIn } = useAuth();
  const pathname = usePathname() || "";

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
  const isActivityPage = pathname.startsWith("/activities/") && pathname !== "/activities";

  const layoutContent = (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="w-full h-screen flex bg-background text-foreground overflow-hidden">
        <Sidebar />
        <SidebarInset className="flex-1 min-w-0 h-full overflow-hidden flex flex-col relative">
          {showKidNav && <DashboardNavbar role="kid" />}
          <div
            className={`flex-1 min-w-0 h-full bg-background ${
              isActivityPage ? "overflow-hidden flex flex-col" : "overflow-y-auto"
            }`}
          >
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );

  if (isKid) {
    return <ScreenTimeTracker>{layoutContent}</ScreenTimeTracker>;
  }

  return layoutContent;
}
