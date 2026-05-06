"use client";
import { useEffect, useState } from "react";
import {
  PlusCircle,
  ClipboardList,
  Settings,
  HelpCircle,
  Sparkles,
  X,
  PanelLeftClose,
  Search,
  MessageSquare,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSessions, setCurrentSessionId, setMessages } from "@/store/slice/chat.slice";
import { fetchUserSessions, createChatSession } from "@/lib/supabase/chat";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Profile from "./Profile";

const supabase = createClient();

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const dispatch = useAppDispatch();
  const sessions = useAppSelector((state) => state.chat.sessions);
  const currentSessionId = useAppSelector((state) => state.chat.currentSessionId);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setIsUserLoggedIn(true);
        const userSessions = await fetchUserSessions();
        dispatch(setSessions(userSessions));
      }
    };
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsUserLoggedIn(true);
        const userSessions = await fetchUserSessions();
        dispatch(setSessions(userSessions));
      } else {
        setIsUserLoggedIn(false);
        dispatch(setSessions([]));
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  const handleNewChat = async () => {
    if (!isUserLoggedIn) return;
    try {
      const newSession = await createChatSession();
      dispatch(setSessions([newSession, ...sessions]));
      dispatch(setCurrentSessionId(newSession.id));
      dispatch(setMessages([]));
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    dispatch(setCurrentSessionId(sessionId));
  };

  const navItems = [
    { label: "New Chat", icon: PlusCircle, onClick: handleNewChat },
    { label: "Search Chats", icon: Search },
    { label: "Activities", icon: ClipboardList },
  ];

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
        className={`fixed inset-y-0 left-0 z-[70] md:relative transition-all duration-300 ease-in-out border-r border-sidebar-border bg-sidebar flex flex-col min-h-0 ${
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

        <nav className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left font-semibold text-sidebar-foreground transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}

          {isUserLoggedIn && (
            <div className="mt-6">
              <h1 className="font-semibold text-slate-700 text-md mb-2 ml-3">Recent Chats</h1>
              <div className="space-y-1">
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left font-semibold transition-colors group ${
                        currentSessionId === session.id
                          ? "bg-sidebar-accent text-sky-500"
                          : "text-sidebar-foreground"
                      }`}
                    >
                      <MessageSquare
                        className={`w-4 h-4 ${currentSessionId === session.id ? "text-sky-500" : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground"}`}
                      />
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis text-sm">
                        {session.title}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 ml-3 italic">No recent chats</p>
                )}
              </div>
            </div>
          )}
        </nav>

        <div className="space-y-2 pt-4 border-t border-sidebar-border">
          <Link href={"/subscription"}>
            <Button className="w-full rounded-xl bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/20">
              Try Premium
            </Button>
          </Link>
          <Popover>
            <PopoverTrigger
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "w-full justify-start mt-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Settings className="mr-2 w-5 h-5" />
              Settings
            </PopoverTrigger>
            <PopoverContent
              className="w-56 p-2 rounded-2xl shadow-xl border-sidebar-border bg-popover"
              side="top"
              align="center"
              sideOffset={10}
            >
              <div className="space-y-1">
                <h4 className="font-bold text-popover-foreground px-2 py-1.5 text-sm uppercase tracking-wider opacity-50">
                  Theme
                </h4>
                <button
                  onClick={() => setTheme("light")}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-colors ${theme === "light" ? "bg-sky-500/10 text-sky-500 font-bold" : "text-popover-foreground/70 hover:bg-accent hover:text-accent-foreground"}`}
                >
                  <Sun className="h-4 w-4" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-colors ${theme === "dark" ? "bg-sky-500/10 text-sky-500 font-bold" : "text-popover-foreground/70 hover:bg-accent hover:text-accent-foreground"}`}
                >
                  <Moon className="h-4 w-4" />
                  <span>Dark</span>
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-colors ${theme === "system" ? "bg-sky-500/10 text-sky-500 font-bold" : "text-popover-foreground/70 hover:bg-accent hover:text-accent-foreground"}`}
                >
                  <Monitor className="h-4 w-4" />
                  <span>System</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
          <Link href="/help">
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <HelpCircle className="mr-2 w-5 h-5" /> Help
            </Button>
          </Link>

          <Profile />
        </div>
      </aside>
    </>
  );
}
