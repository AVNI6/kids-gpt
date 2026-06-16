"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, GraduationCap, Check } from "lucide-react";
import type { LinkedChildProfile } from "@/types/parent";
import { useParentDashboard } from "@/hooks/parent/useParentDashboard";
import { getInitials } from "@/lib/utils/parent/dashboard.utils";
import { displayAge } from "@/lib/utils/kid/childAge";
import { displayGrade } from "@/lib/utils/kid/childGrade";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChildSelectorTabsProps = {
  linkedChildren: LinkedChildProfile[];
};

export default function ChildSelectorTabs({ linkedChildren }: ChildSelectorTabsProps) {
  const { activeChildId, setActiveChildId, activeChild } = useParentDashboard();

  // Auto-hide completely if parent has only 1 child
  if (linkedChildren.length <= 1) {
    return null;
  }

  const handleSelect = (id: string) => {
    if (id === activeChildId) return;
    setActiveChildId(id);
  };

  if (!activeChild) return null;

  return (
    <div className="relative shrink-0">
      <DropdownMenu>
        {/* Dropdown Trigger Button */}
        <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full px-4.5 py-2 bg-white dark:bg-card border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow transition-all text-slate-800 dark:text-slate-100 font-bold text-sm cursor-pointer select-none focus:outline-none data-[state=open]:ring-2 data-[state=open]:ring-sky-500/30 data-[state=open]:border-sky-400 dark:data-[state=open]:border-sky-500">
          <Avatar className="h-6 w-6 border border-slate-200/50 dark:border-slate-700/60 shadow-sm shrink-0">
            <AvatarImage src={activeChild.avatar_url ?? undefined} className="object-cover" />
            <AvatarFallback className="text-[9px] font-bold bg-gradient-to-br from-sky-400 to-sky-600 text-white">
              {getInitials(activeChild.first_name, activeChild.last_name)}
            </AvatarFallback>
          </Avatar>

          <span className="tracking-tight max-w-[100px] truncate leading-none">
            {activeChild.first_name}
          </span>

          <span className="inline-flex items-center text-[10px] bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300 font-black px-2 py-0.5 rounded-full shrink-0 border border-sky-100/50 dark:border-sky-900/10">
            {displayAge(activeChild.date_of_birth)}
          </span>

          <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 data-[state=open]:rotate-180 data-[state=open]:text-sky-600 dark:data-[state=open]:text-sky-400" />
        </DropdownMenuTrigger>

        {/* Floating Glassmorphic Dropdown Panel */}
        <DropdownMenuContent
          align="end"
          className="z-50 min-w-[240px] max-w-[280px] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md rounded-2xl p-2 border border-slate-200/60 dark:border-slate-800/80 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3.5 py-2 border-b border-slate-100 dark:border-slate-900 mb-1.5 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-sky-500" /> Switch Explorer
          </div>

          <ScrollArea className="h-[220px] pr-2">
            <div className="space-y-1 pr-1">
              {linkedChildren.map((child) => {
                const isSelected = child.user_id === activeChildId;
                return (
                  <DropdownMenuItem
                    key={child.user_id}
                    className="p-0 bg-transparent hover:bg-transparent focus:bg-transparent"
                  >
                    <button
                      onClick={() => handleSelect(child.user_id)}
                      className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl transition-all cursor-pointer text-left focus:outline-none ${
                        isSelected
                          ? "bg-sky-50/50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 border border-sky-100/30 dark:border-sky-900/15"
                          : "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-slate-200 border border-transparent"
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
                            {displayGrade(child.standard)} • {displayAge(child.date_of_birth)}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                      )}
                    </button>
                  </DropdownMenuItem>
                );
              })}
            </div>
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
