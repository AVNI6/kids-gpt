"use client";

import Link from "next/link";
import { Settings, Sparkles, HelpCircle, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarFooter } from "@/components/ui/sidebar";
import { APP_ROUTES } from "@/constant/AppRoutes";
import Profile from "../Profile";

interface SidebarFooterActionsProps {
  isOpen: boolean;
  isUserLoggedIn: boolean;
  isLoadingAuth: boolean;
  theme: string | undefined;
  setTheme: (theme: string) => void;
}

export default function SidebarFooterActions({
  isOpen,
  isUserLoggedIn,
  isLoadingAuth,
  theme,
  setTheme,
}: SidebarFooterActionsProps) {
  return (
    <SidebarFooter className="p-4 flex flex-col shrink-0 gap-2 border-t border-sidebar-border bg-sidebar">
      {!isLoadingAuth && !isUserLoggedIn && (
        <>
          <Link
            href={APP_ROUTES.Subscription}
            className={cn(
              buttonVariants({ variant: "default" }),
              "rounded-xl bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/20 cursor-pointer flex items-center justify-center",
              isOpen ? "w-full h-10" : "h-10! w-10! p-0! mx-auto",
              !isOpen && "flex justify-center"
            )}
          >
            {isOpen ? "Try Premium" : <Sparkles className="w-5 h-5" />}
          </Link>
          <Popover>
            <PopoverTrigger
              suppressHydrationWarning={true}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "w-full justify-start mt-1 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-xl cursor-pointer",
                !isOpen && "justify-center p-0! h-10! w-10! mx-auto"
              )}
            >
              <Settings className={cn("w-5 h-5", isOpen && "mr-2")} />
              {isOpen && "Settings"}
            </PopoverTrigger>
            <PopoverContent
              className="w-56 p-2 rounded-2xl shadow-xl border-sidebar-border bg-popover"
              side={isOpen ? "top" : "right"}
              align="center"
              sideOffset={10}
            >
              <div className="space-y-1">
                <h4 className="font-bold text-popover-foreground px-2 py-1.5 text-sm uppercase tracking-wider opacity-50">
                  Theme
                </h4>
                {[
                  { name: "light", label: "Light", icon: Sun },
                  { name: "dark", label: "Dark", icon: Moon },
                  { name: "system", label: "System", icon: Monitor },
                ].map(({ name, label, icon: Icon }) => (
                  <button
                    key={name}
                    onClick={() => setTheme(name)}
                    suppressHydrationWarning={true}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-colors cursor-pointer ${
                      theme === name
                        ? "bg-sky-500/10 text-sky-500 font-bold"
                        : "text-popover-foreground/70 hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Link
            href={APP_ROUTES.Help}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-xl cursor-pointer flex items-center h-10",
              !isOpen && "justify-center p-0! h-10! w-10! mx-auto"
            )}
          >
            <HelpCircle className={cn("w-5 h-5", isOpen && "mr-2")} /> {isOpen && "Help"}
          </Link>
        </>
      )}
      <Profile isCollapsed={!isOpen} />
    </SidebarFooter>
  );
}
