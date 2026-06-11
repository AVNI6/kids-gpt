"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChatSkeleton() {
  return (
    <div className="flex-1 min-h-0 overflow-hidden relative animate-pulse">
      <ScrollArea className="h-full w-full">
        <div className="w-full max-w-3xl mx-auto space-y-6 pb-6 p-3 sm:p-6 md:p-8">
          {/* Skeleton Bubble 1 (User) */}
          <div className="flex justify-end animate-fade-in-up">
            <div className="flex items-end gap-3 max-w-[85%] flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 shrink-0 mb-1" />
              <div className="rounded-2xl sm:rounded-3xl px-3 sm:px-5 py-2.5 sm:py-3.5 bg-sky-500/10 w-48 h-10 rounded-br-sm" />
            </div>
          </div>

          {/* Skeleton Bubble 2 (Assistant) */}
          <div className="flex justify-start animate-fade-in-up delay-100">
            <div className="flex items-end gap-3 max-w-[85%] flex-row">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 mb-1" />
              <div className="rounded-2xl sm:rounded-3xl px-3 sm:px-5 py-2.5 sm:py-3.5 bg-card border border-border w-72 h-24 rounded-bl-sm flex flex-col gap-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-5/6" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3" />
              </div>
            </div>
          </div>

          {/* Skeleton Bubble 3 (User) */}
          <div className="flex justify-end animate-fade-in-up delay-200">
            <div className="flex items-end gap-3 max-w-[85%] flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 shrink-0 mb-1" />
              <div className="rounded-2xl sm:rounded-3xl px-3 sm:px-5 py-2.5 sm:py-3.5 bg-sky-500/10 w-36 h-10 rounded-br-sm" />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
