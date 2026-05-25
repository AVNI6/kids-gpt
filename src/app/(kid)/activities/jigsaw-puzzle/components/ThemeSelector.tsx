"use client";

import React from "react";
import { Image as ImageIcon } from "lucide-react";
import { JIGSAW_THEMES } from "@/constant/JigsawThemes";

interface ThemeSelectorProps {
  selectedUrl: string;
  onThemeSelect: (url: string) => void;
  isLoading?: boolean;
}

export default function ThemeSelector({
  selectedUrl,
  onThemeSelect,
  isLoading,
}: ThemeSelectorProps) {
  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 backdrop-blur-md p-6 rounded-3xl shadow-xl select-none flex flex-col gap-3">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
        <ImageIcon className="size-4 text-sky-400" />
        Choose Adventure Theme
      </h3>

      {/* Scrollable Container with fixed height and custom scrollbar classes */}
      <div
        className="w-full max-h-[260px] overflow-y-auto pr-2 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#334155 transparent",
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          {JIGSAW_THEMES.map((theme) => {
            const isActive = selectedUrl === theme.url;
            return (
              <button
                key={theme.id}
                disabled={isLoading}
                onClick={() => onThemeSelect(theme.url)}
                className={`relative group rounded-2xl overflow-hidden aspect-video border transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "border-sky-500 ring-2 ring-sky-400/50 scale-[1.03] shadow-md"
                    : "border-slate-800 hover:border-sky-400/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={theme.url}
                  alt={theme.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/70 py-1.5 px-2 text-center backdrop-blur-xs">
                  <p className="text-[10px] font-black text-white truncate">
                    {theme.emoji} {theme.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
