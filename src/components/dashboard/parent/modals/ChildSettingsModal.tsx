"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { User, Clock, Trash2, Settings, ShieldAlert } from "lucide-react";
import type { LinkedChildProfile } from "@/types/dashboard.types";
import EditProfileTab from "./EditProfileTab";
import ScreenTimeTab from "./ScreenTimeTab";
import DeleteAccountTab from "./DeleteAccountTab";

type SettingsTab = "profile" | "screentime" | "delete";

interface ChildSettingsModalProps {
  child: LinkedChildProfile;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChildSettingsModal({
  child,
  isOpen,
  onOpenChange,
}: ChildSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const handleClose = () => {
    onOpenChange(false);
  };

  const tabs = [
    {
      id: "profile" as SettingsTab,
      label: "General Profile",
      icon: <User className="w-4 h-4" />,
    },
    {
      id: "screentime" as SettingsTab,
      label: "Screen Time",
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: "delete" as SettingsTab,
      label: "Delete Child",
      icon: <Trash2 className="w-4 h-4 text-rose-500" />,
      extraClass: "text-rose-650 hover:bg-rose-50/50 dark:hover:bg-rose-950/20",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-212.5 p-0 overflow-hidden rounded-[32px] border border-slate-200 dark:border-background bg-white dark:bg-slate-900 shadow-2xl h-150 sm:h-140 flex flex-col sm:flex-row">
        {/* Left Side Tab Navigation Panel */}
        <div className="w-full sm:w-60 bg-slate-50/70 dark:bg-black/20 border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-slate-800/80 p-5 flex flex-col shrink-0">
          <div className="flex items-center gap-2 mb-6 px-1">
            <Settings className="w-5 h-5 text-sky-650 dark:text-sky-400 animate-spin-slow" />
            <h2 className="text-base font-black tracking-tight text-slate-800 dark:text-slate-100">
              Settings Hub
            </h2>
          </div>

          <nav className="flex flex-row sm:flex-col gap-1.5 sm:space-y-1.5 flex-1 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 sm:w-full rounded-2xl text-xs font-bold transition-all text-left cursor-pointer shrink-0 sm:shrink ${
                    isActive
                      ? "bg-slate-200/80 dark:bg-slate-800/80 text-sky-600 dark:text-white shadow-sm"
                      : tab.extraClass ||
                        "text-slate-500 hover:bg-slate-100/50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 hidden sm:block">
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center shrink-0 border border-sky-100/10">
                <ShieldAlert className="w-3.5 h-3.5 text-sky-500" />
              </div>
              <div className="min-w-0 leading-none">
                <span className="text-[10px] font-black text-slate-700 dark:text-slate-350 block">
                  Parent Mode
                </span>
                <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wide">
                  Enforced
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Content Panel */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto flex flex-col justify-between bg-white dark:bg-slate-900">
          <div className="flex-1">
            {activeTab === "profile" && <EditProfileTab child={child} onSuccess={handleClose} />}
            {activeTab === "screentime" && <ScreenTimeTab child={child} />}
            {activeTab === "delete" && <DeleteAccountTab child={child} onSuccess={handleClose} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
