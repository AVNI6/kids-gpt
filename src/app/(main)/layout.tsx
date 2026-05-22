"use client";

import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="w-full h-screen flex bg-white overflow-hidden">
        <Sidebar />
        <SidebarInset className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
          <div className="flex-1 min-w-0 h-full overflow-y-auto bg-background">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
