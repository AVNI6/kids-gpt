"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItemConfig } from "@/config/navigation/kid-nav";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  role: "kid" | "parent" | "teacher";
  navItems: NavItemConfig[];
  getNavItemHref: (item: NavItemConfig) => string;
  isLinkActive: (item: NavItemConfig) => boolean;
  dueCount?: number;
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
  role,
  navItems,
  getNavItemHref,
  isLinkActive,
  dueCount = 0,
}: MobileNavDrawerProps) {
  const brandTitle =
    role === "teacher" ? "Teacher Hub" : role === "parent" ? "Parent Hub" : "Explorer Hub";

  const activeLinkClass =
    role === "teacher"
      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 border-indigo-100/20 dark:border-indigo-500/20"
      : "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 border-sky-100/20 dark:border-sky-500/20";

  const footerText =
    role === "teacher"
      ? "Teacher Mode Active"
      : role === "parent"
        ? "Parent Mode Enforced"
        : "Student Mode";

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-80 max-w-xs h-screen bg-white dark:bg-slate-900 p-6 flex flex-col shadow-2xl border-l border-slate-200 dark:border-slate-800 z-50 outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800/60 mb-6 shrink-0">
          <span className="font-black text-lg bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">
            {brandTitle}
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:text-white dark:hover:bg-slate-900 transition-colors cursor-pointer border-0 bg-transparent"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation links inside drawer */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 py-1">
          {navItems.map((item) => {
            const active = isLinkActive(item);
            const isClassrooms = item.label === "Classrooms";
            return (
              <Link
                key={item.href}
                href={getNavItemHref(item)}
                onClick={onClose}
                prefetch={false}
                className={cn(
                  "w-full flex items-center justify-between px-4.5 py-3 rounded-2xl font-black transition-all cursor-pointer text-sm border border-transparent",
                  active
                    ? activeLinkClass
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <span>{item.label}</span>
                {isClassrooms && dueCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-1 ring-white dark:ring-slate-950">
                    {dueCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 text-center shrink-0">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            {footerText}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
