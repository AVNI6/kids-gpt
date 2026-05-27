"use client";

import MainLayout from "../(main)/layout";
import ScreenTimeTracker from "@/components/screentime/ScreenTimeTracker";

export default function KidLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScreenTimeTracker>
      <MainLayout>{children}</MainLayout>
    </ScreenTimeTracker>
  );
}
