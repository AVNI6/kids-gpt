"use client";

import { ReactNode, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function MainLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof document === "undefined") {
      return true;
    }
    const match = document.cookie.match(/(?:^|; )sidebar_state=(true|false)/);
    return match ? match[1] === "true" : true;
  });

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="w-full h-screen flex bg-background text-foreground overflow-hidden">
        <Sidebar />
        <SidebarInset className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
          <div className="flex-1 min-w-0 h-full overflow-y-auto bg-background">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
