"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { LinkedChildProfile } from "@/types/dashboard.types";

type ChildSelectorTabsProps = {
  linkedChildren: LinkedChildProfile[];
};

export default function ChildSelectorTabs({ linkedChildren }: ChildSelectorTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentChildId = searchParams?.get("childId") ?? linkedChildren[0]?.user_id ?? "";

  if (linkedChildren.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-white p-4 border border-sky-100 shadow-sm">
        <p className="text-slate-600">No linked children found.</p>
        <Link href="/help" className="text-sky-600 hover:text-sky-700 font-semibold">
          Learn more
        </Link>
      </div>
    );
  }

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (firstName) {
      const first = firstName[0];
      const last = lastName ? lastName[0] : "";
      return (first + last).toUpperCase();
    }
    return "K";
  };

  const handleSelect = (id: string) => {
    if (id === currentChildId) return;
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("childId", id);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-2 border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-x-auto ${isPending ? "opacity-70 pointer-events-none" : ""} transition-opacity`}
    >
      {linkedChildren.map((child) => (
        <button
          key={child.user_id}
          onClick={() => handleSelect(child.user_id)}
          className={`flex items-center gap-2.5 rounded-xl px-3 py-1.5 transition-all shrink-0 ${
            currentChildId === child.user_id
              ? "bg-sky-500 dark:bg-sky-600 text-white shadow-md scale-[1.02]"
              : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Avatar
            className="h-7 w-7 border-2 transition-colors"
            style={{ borderColor: currentChildId === child.user_id ? "white" : "transparent" }}
          >
            <AvatarImage
              src={child.avatar_url ?? undefined}
              alt={child.first_name ?? "Child"}
              className="object-cover"
            />
            <AvatarFallback
              className={`text-[10px] font-bold ${currentChildId === child.user_id ? "text-sky-700 bg-white dark:bg-slate-100 dark:text-sky-900" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
            >
              {getInitials(child.first_name, child.last_name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-bold text-sm tracking-tight">{child.first_name}</span>
        </button>
      ))}
    </div>
  );
}
