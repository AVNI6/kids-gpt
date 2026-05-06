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
  Sun,
  Moon,
  Monitor,
  MoreVertical,
  Trash2,
  Edit2,
  Share2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setSessions,
  setCurrentSessionId,
  setMessages,
  updateSessionTitleInList,
} from "@/store/slice/chat.slice";
import { fetchUserSessions, deleteChatSession, updateSessionTitle } from "@/actions/chat.actions";
import { ChatSessionRow } from "@/types/chat.types";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Profile from "./Profile";
import { APP_ROUTES } from "@/constant/AppRoutes";
import ShareLink from "./ShareLink";
import DeleteSessionDialog from "./DeleteSessionDialog";

import { useRouter } from "next/navigation";

const supabase = createClient();

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const sessions = useAppSelector((state) => state.chat.sessions);
  const currentSessionId = useAppSelector((state) => state.chat.currentSessionId);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        console.log("Sidebar: checkUser found", user?.id);
        if (user) {
          setIsUserLoggedIn(true);
          const userSessions = await fetchUserSessions();
          dispatch(setSessions(userSessions));
        }
      } catch (err) {
        console.error("Sidebar auth check failed:", err);
      }
    };
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Sidebar: Auth state changed:", event, session?.user?.id);
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

  const handleNewChat = () => {
    router.push("/");
  };

  useEffect(() => {
    const handleActivity = () => {
      if (openPopoverId) setOpenPopoverId(null);
    };

    // Close popover on scroll (using capture to catch it from children like the nav list)
    window.addEventListener("scroll", handleActivity, true);
    window.addEventListener("wheel", handleActivity, true);
    window.addEventListener("touchmove", handleActivity, true);

    return () => {
      window.removeEventListener("scroll", handleActivity, true);
      window.removeEventListener("wheel", handleActivity, true);
      window.removeEventListener("touchmove", handleActivity, true);
    };
  }, [openPopoverId]);

  const handleSelectSession = (sessionId: string) => {
    if (editingSessionId === sessionId) return;
    setOpenPopoverId(null); // Close popover when selecting
    router.push(`/?id=${sessionId}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    console.log("handleDeleteSession called for:", sessionId);

    // Optimistic Update: Remove from UI immediately
    const originalSessions = [...sessions];
    const updatedSessions = sessions.filter((s) => s.id !== sessionId);
    dispatch(setSessions(updatedSessions));

    try {
      console.log("Starting hard delete for:", sessionId);
      await deleteChatSession(sessionId);

      if (currentSessionId === sessionId) {
        router.push("/");
        dispatch(setCurrentSessionId(null));
        dispatch(setMessages([]));
      }
      console.log("Delete successful for:", sessionId);
    } catch (error) {
      console.error("Failed to delete session:", error);
      // Revert on error
      dispatch(setSessions(originalSessions));
      alert("Failed to delete chat. Please try again.");
      throw error; // Rethrow so modal knows it failed
    }
  };

  const handleStartRename = (e: React.MouseEvent, session: ChatSessionRow) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("handleStartRename triggered for:", session.id);
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = async (e: React.FormEvent | React.FocusEvent, sessionId: string) => {
    e.preventDefault();
    // Use a flag or check editingSessionId to prevent double-processing
    if (editingSessionId !== sessionId) return;

    if (!editTitle.trim()) {
      setEditingSessionId(null);
      return;
    }

    try {
      // Optimistic update
      dispatch(updateSessionTitleInList({ id: sessionId, title: editTitle }));
      setEditingSessionId(null);

      await updateSessionTitle(sessionId, editTitle);
    } catch (error) {
      console.error("Failed to rename session:", error);
      // Revert if failed? (Optional, sessions list is usually re-fetched on refresh)
    }
  };

  const navItems = [
    { label: "New Chat", icon: PlusCircle, href: "/", onClick: handleNewChat },
    { label: "Search Chats", icon: Search, href: "/search" },
    { label: "Activities", icon: ClipboardList, href: "/activities" },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
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
            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left font-semibold text-sidebar-foreground transition-colors"
                >
                  <Icon className="w-5 h-5" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            }

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
              <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Recent Chats
              </h3>
              <div className="space-y-1">
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <div key={session.id} className="group relative">
                      {editingSessionId === session.id ? (
                        <form
                          onSubmit={(e) => handleSaveRename(e, session.id)}
                          className="flex items-center gap-2 p-1"
                        >
                          <input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={(e) => handleSaveRename(e, session.id)}
                            className="w-full bg-sidebar-accent border border-sky-500 rounded-md px-2 py-1 text-sm focus:outline-none"
                            placeholder="Press Enter to save..."
                          />
                        </form>
                      ) : (
                        <div
                          onClick={() => handleSelectSession(session.id)}
                          className={`w-full flex items-center justify-between rounded-xl px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left font-semibold transition-colors cursor-pointer ${
                            currentSessionId === session.id
                              ? "bg-sidebar-accent text-sky-500"
                              : "text-sidebar-foreground"
                          }`}
                        >
                          <span className="whitespace-nowrap overflow-hidden text-sm pointer-events-none truncate mr-2">
                            {session.title}
                          </span>

                          <Popover
                            open={openPopoverId === session.id}
                            onOpenChange={(open) => setOpenPopoverId(open ? session.id : null)}
                          >
                            <PopoverTrigger
                              onClick={(e) => e.stopPropagation()}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-opacity cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4 text-slate-400" />
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-1" side="right" align="start">
                              <div className="flex flex-col">
                                <button
                                  onClick={(e) => handleStartRename(e, session)}
                                  className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-sidebar-accent rounded-md transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" /> Rename
                                </button>
                                <ShareLink
                                  sessionId={session.id}
                                  trigger={
                                    <button className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-sidebar-accent rounded-md transition-colors text-sky-500 w-full text-left">
                                      <Share2 className="w-4 h-4" /> Share
                                    </button>
                                  }
                                />
                                <DeleteSessionDialog
                                  sessionId={session.id}
                                  onDelete={handleDeleteSession}
                                  trigger={
                                    <button className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-sidebar-accent rounded-md transition-colors text-red-500 w-full text-left group/del">
                                      <Trash2 className="w-4 h-4 pointer-events-none" /> Delete
                                    </button>
                                  }
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 ml-3 italic">No recent chats</p>
                )}
              </div>
            </div>
          )}
        </nav>

        <div className="space-y-2 pt-4 border-t border-sidebar-border">
          <Link href={APP_ROUTES.Subscription}>
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
          <Link href={APP_ROUTES.Help}>
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
