"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, GraduationCap, Check } from "lucide-react";
import type { LinkedChildProfile } from "@/types/dashboard.types";
import { useChildAge } from "@/hooks/useChildAge";

type ChildSelectorTabsProps = {
  linkedChildren: LinkedChildProfile[];
};

export default function ChildSelectorTabs({ linkedChildren }: ChildSelectorTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { displayAge } = useChildAge();

  const currentChildId = searchParams?.get("childId") ?? linkedChildren[0]?.user_id ?? "";
  const activeChild = linkedChildren.find((c) => c.user_id === currentChildId) || linkedChildren[0];

  // Click outside to close dropdown listener
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Auto-hide completely if parent has only 1 child
  if (linkedChildren.length <= 1) {
    return null;
  }

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (firstName) {
      const first = firstName[0];
      const last = lastName ? lastName[0] : "";
      return (first + last).toUpperCase();
    }
    return "C";
  };

  const handleSelect = (id: string) => {
    setIsOpen(false);
    if (id === currentChildId) return;

    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("childId", id);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      {/* Dropdown Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`flex items-center gap-2.5 rounded-full px-4.5 py-2 bg-white dark:bg-card border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow transition-all text-slate-850 dark:text-slate-100 font-bold text-sm cursor-pointer select-none ${
          isOpen ? "ring-2 ring-sky-500/30 border-sky-400 dark:border-sky-500" : ""
        } ${isPending ? "opacity-75 pointer-events-none" : ""}`}
      >
        <Avatar className="h-6 w-6 border border-slate-200/50 dark:border-slate-700/60 shadow-sm shrink-0">
          <AvatarImage src={activeChild.avatar_url ?? undefined} className="object-cover" />
          <AvatarFallback className="text-[9px] font-bold bg-gradient-to-br from-sky-400 to-sky-600 text-white">
            {getInitials(activeChild.first_name, activeChild.last_name)}
          </AvatarFallback>
        </Avatar>

        <span className="tracking-tight max-w-[100px] truncate leading-none">
          {activeChild.first_name}
        </span>

        <span className="inline-flex items-center text-[10px] bg-sky-50 dark:bg-sky-955/20 text-sky-700 dark:text-sky-300 font-black px-2 py-0.5 rounded-full shrink-0 border border-sky-100/50 dark:border-sky-900/10">
          {displayAge(activeChild.date_of_birth, activeChild.standard)}
        </span>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-sky-600 dark:text-sky-400" : ""
          }`}
        />
      </button>

      {/* Floating Glassmorphic Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 min-w-[240px] max-w-[280px] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md rounded-2xl p-2 border border-slate-200/60 dark:border-slate-800/80 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3.5 py-2 border-b border-slate-100 dark:border-slate-900 mb-1.5 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-sky-500" /> Switch Explorer
          </div>

          <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
            {linkedChildren.map((child) => {
              const isSelected = child.user_id === currentChildId;
              return (
                <button
                  key={child.user_id}
                  onClick={() => handleSelect(child.user_id)}
                  className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl transition-all cursor-pointer text-left ${
                    isSelected
                      ? "bg-sky-50/50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 border border-sky-100/30 dark:border-sky-900/15"
                      : "bg-transparent text-slate-650 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-slate-205 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-7 w-7 border border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
                      <AvatarImage src={child.avatar_url ?? undefined} className="object-cover" />
                      <AvatarFallback className="text-[10px] font-extrabold bg-gradient-to-br from-sky-400 to-sky-600 text-white">
                        {getInitials(child.first_name, child.last_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex flex-col justify-center leading-none">
                      <span className="text-xs font-black truncate text-slate-900 dark:text-white">
                        {child.first_name} {child.last_name}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1">
                        {displayAge(child.date_of_birth, child.standard)}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
