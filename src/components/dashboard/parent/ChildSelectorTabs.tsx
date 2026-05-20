"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { LinkedChildProfile } from "@/types/dashboard.types";

type ChildSelectorTabsProps = {
  linkedChildren: LinkedChildProfile[];
};

export default function ChildSelectorTabs({ linkedChildren }: ChildSelectorTabsProps) {
  const [selectedChildId, setSelectedChildId] = useState<string>(linkedChildren[0]?.user_id ?? "");

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

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-3 border border-sky-100 shadow-sm overflow-x-auto">
      {linkedChildren.map((child) => (
        <button
          key={child.user_id}
          onClick={() => setSelectedChildId(child.user_id)}
          className={`flex items-center gap-3 rounded-lg px-4 py-2 transition-all shrink-0 ${
            selectedChildId === child.user_id
              ? "bg-sky-500 text-white shadow-md"
              : "bg-slate-50 text-slate-700 hover:bg-sky-50"
          }`}
        >
          <Avatar
            className="h-8 w-8 border-2"
            style={{ borderColor: selectedChildId === child.user_id ? "white" : undefined }}
          >
            <AvatarImage src={child.avatar_url ?? undefined} alt={child.first_name ?? "Child"} />
            <AvatarFallback className="text-xs font-bold">
              {getInitials(child.first_name, child.last_name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm">{child.first_name}</span>
        </button>
      ))}
    </div>
  );
}
