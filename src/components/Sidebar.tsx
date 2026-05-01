"use client";

import { ComponentType, SVGProps } from "react";
import {
  PlusCircle,
  History,
  BookOpen,
  ClipboardList,
  Settings,
  HelpCircle,
  Sparkles,
  PanelLeftClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <aside
      className={`transition-all duration-300 ease-in-out border-r bg-white flex flex-col min-h-0 ${
        isOpen ? "w-72 p-4" : "w-0 p-0 overflow-hidden border-none"
      }`}
    >
      <div className="flex items-center justify-between mb-8 min-w-[240px]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-sky-500 flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-slate-500 hover:text-slate-700"
        >
          <PanelLeftClose className="w-5 h-5" />
        </Button>
      </div>

      <nav className="space-y-2 flex-1 min-w-[240px] overflow-y-auto pr-2">
        {(
          [
            ["New Chat", PlusCircle],
            ["History", History],
            ["Subjects", BookOpen],
            ["Activities", ClipboardList],
          ] as Array<[string, ComponentType<SVGProps<SVGSVGElement>>]>
        ).map(([label, Icon]) => (
          <button
            key={label}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-sky-50 text-left font-semibold text-slate-700 transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        ))}
      </nav>

      <div className="space-y-2 min-w-[240px] pt-4 border-t">
        <Button className="w-full rounded-xl bg-sky-100 text-sky-700 hover:bg-sky-200">
          <Link href={"/subscription"}>Try Premium</Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start text-slate-700">
          <Settings className="mr-2 w-5 h-5" />
          Settings
        </Button>
        <Button variant="ghost" className="w-full justify-start text-slate-700">
          <HelpCircle className="mr-2 w-5 h-5" /> Help
        </Button>
      </div>
    </aside>
  );
}
