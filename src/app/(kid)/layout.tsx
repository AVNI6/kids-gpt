"use client";

// ScreenTimeTracker is already conditionally added inside MainLayout when role === "kid".
// Do NOT wrap with ScreenTimeTracker here — that would create two concurrent tracker
// instances (double setInterval, double server action calls every 15 seconds).
import MainLayout from "../(main)/layout";

export default function KidLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
