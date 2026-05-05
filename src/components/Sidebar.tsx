"use client";

import { ComponentType, SVGProps } from "react";
import {
  PlusCircle,
  ClipboardList,
  Settings,
  HelpCircle,
  Sparkles,
  X,
  PanelLeftClose,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onToggle}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-[70] md:relative transition-all duration-300 ease-in-out border-r bg-white flex flex-col min-h-0 ${
          isOpen
            ? "w-72 p-4 translate-x-0"
            : "w-72 p-4 -translate-x-full md:w-0 md:p-0 md:overflow-hidden md:border-none"
        }`}
      >
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="h-10 w-10 rounded-2xl bg-sky-500 flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-slate-500 hover:text-slate-700 h-10 w-10 flex items-center justify-center"
          >
            <X className="w-6 h-6 md:hidden block" />
            <PanelLeftClose className="w-5 h-5 hidden md:block" />
          </Button>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto pr-2">
          {(
            [
              ["New Chat", PlusCircle],
              ["Search Chats", Search],
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
          {/* show only if user is logged in */}
          <div>
            <h1 className="font-semibold text-slate-700 text-md mt-4 mb-2 ml-3">Recents</h1>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-sky-50 text-left font-semibold text-slate-700 transition-colors"
                >
                  <span className="whitespace-nowrap">Chat {i + 1}</span>
                </div>
              ))}
          </div>
        </nav>

        <div className="space-y-2 pt-4 border-t">
          <Link href={"/subscription"}>
            <Button className="w-full rounded-xl bg-sky-100 text-sky-700 hover:bg-sky-200">
              Try Premium
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start mt-3 text-slate-700">
            <Settings className="mr-2 w-5 h-5" />
            Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-700">
            <HelpCircle className="mr-2 w-5 h-5" /> Help
          </Button>
        </div>
      </aside>
    </>
  );
}
