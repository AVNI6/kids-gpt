"use client";

import { useState, type ReactNode } from "react";

import Sidebar from "@/components/Sidebar";

export default function KidLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="fixed inset-0 flex bg-white w-full overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <main className="flex-1 flex flex-col justify-between h-full overflow-hidden relative bg-slate-50 min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
