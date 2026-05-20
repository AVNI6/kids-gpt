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
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Profile from "./Profile";
import { APP_ROUTES } from "@/constant/AppRoutes";
import ShareLink from "./ShareLink";
import DeleteSessionDialog from "./DeleteSessionDialog";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const sessions = useAppSelector((state) => state.chat.sessions);
  const currentSessionId = useAppSelector((state) => state.chat.currentSessionId);
  const { user, isUserLoggedIn, isLoading: isLoadingAuth } = useAuth();
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const loadSessions = async () => {
      if (user) {
        const userSessions = await fetchUserSessions(user.id);
        dispatch(setSessions(userSessions));
      } else {
        dispatch(setSessions([]));
      }
    };
    loadSessions();
  }, [user, dispatch]);

  const handleNewChat = () => {
    dispatch(setCurrentSessionId(null));
    dispatch(setMessages([]));
    router.push("/");
  };

  const handleSelectSession = (sessionId: string) => {
    if (editingSessionId === sessionId) return;
    setOpenPopoverId(null);
    router.push(`/?id=${sessionId}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    const originalSessions = [...sessions];
    const updatedSessions = sessions.filter((s) => s.id !== sessionId);
    dispatch(setSessions(updatedSessions));

    try {
      await deleteChatSession(sessionId);
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
    } catch {
      dispatch(setSessions(originalSessions));
      alert("Failed to delete chat.");
    }
  };

  const handleStartRename = (e: React.MouseEvent, session: ChatSessionRow) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenPopoverId(null);
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = async (e: React.FormEvent | React.FocusEvent, sessionId: string) => {
    e.preventDefault();
    if (editingSessionId !== sessionId) return;
    if (!editTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    try {
      dispatch(updateSessionTitleInList({ id: sessionId, title: editTitle }));
      setEditingSessionId(null);
      await updateSessionTitle(sessionId, editTitle);
    } catch {
      console.error("Rename failed");
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
        className={cn(
          "fixed inset-y-0 left-0 z-[70] md:static md:z-auto md:relative transition-all duration-300 ease-in-out border-r border-sidebar-border bg-sidebar flex flex-col min-h-0 h-screen md:h-auto",
          isOpen ? "w-72 p-4 translate-x-0" : "w-72 md:w-20 p-4 -translate-x-full md:translate-x-0"
        )}
      >
        <div
          className={cn(
            "flex items-center mb-8 shrink-0",
            isOpen ? "justify-between" : "justify-center"
          )}
        >
          <button
            onClick={onToggle}
            title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            className="h-10 w-10 rounded-2xl bg-sky-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform active:scale-95"
          >
            <Sparkles className="w-5 h-5" />
          </button>
          {isOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="text-slate-500 hover:text-slate-700 h-10 w-10 flex items-center justify-center"
            >
              <X className="w-6 h-6 md:hidden block" />
              <PanelLeftClose className="w-5 h-5 hidden md:block" />
            </Button>
          )}
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={item.onClick}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left font-semibold text-sidebar-foreground transition-colors group",
                    !isOpen && "justify-center px-0 h-10 w-10 mx-auto"
                  )}
                  title={!isOpen ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {isOpen && <span className="whitespace-nowrap truncate">{item.label}</span>}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                onClick={item.onClick}
                title={!isOpen ? item.label : undefined}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left font-semibold text-sidebar-foreground transition-colors group",
                  !isOpen && "justify-center px-0 h-10 w-10 mx-auto"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {isOpen && <span className="whitespace-nowrap truncate">{item.label}</span>}
              </button>
            );
          })}

          {isUserLoggedIn && (
            <div
              className={cn("mt-6 transition-all", !isOpen && "mt-4 flex flex-col items-center")}
            >
              {isOpen ? (
                <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 truncate">
                  Recent Chats
                </h3>
              ) : (
                <div className="h-px w-8 bg-sidebar-border mb-4" />
              )}
              <div className="space-y-1 w-full">
                {sessions.length > 0
                  ? sessions.map((session) => (
                      <div key={session.id} className="group relative">
                        {editingSessionId === session.id && isOpen ? (
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
                              placeholder="Save..."
                            />
                          </form>
                        ) : (
                          <div
                            onClick={() => handleSelectSession(session.id)}
                            className={cn(
                              "w-full flex items-center justify-between rounded-xl px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left font-semibold transition-colors cursor-pointer group",
                              currentSessionId === session.id
                                ? "bg-sidebar-accent text-sky-500"
                                : "text-sidebar-foreground",
                              !isOpen && "justify-center px-0"
                            )}
                          >
                            {isOpen && (
                              <span className="whitespace-nowrap overflow-hidden text-sm pointer-events-none truncate mr-2">
                                {session.title}
                              </span>
                            )}

                            {isOpen && (
                              <Popover
                                open={openPopoverId === session.id}
                                onOpenChange={(open) => setOpenPopoverId(open ? session.id : null)}
                              >
                                <PopoverTrigger
                                  onClick={(e) => e.stopPropagation()}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-opacity cursor-pointer shrink-0"
                                >
                                  <MoreVertical className="w-4 h-4 text-slate-400" />
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-40 p-1"
                                  side="right"
                                  align="start"
                                  onClick={(e) => e.stopPropagation()}
                                >
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
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  : isOpen && <p className="text-xs text-slate-400 ml-3 italic">No recent chats</p>}
              </div>
            </div>
          )}
        </nav>

        <div
          className={cn(
            "space-y-2 pt-4 border-t border-sidebar-border",
            !isOpen && "flex flex-col items-center justify-center"
          )}
        >
          {!isLoadingAuth && !isUserLoggedIn && (
            <>
              <Link
                href={APP_ROUTES.Subscription}
                className={cn("w-full", !isOpen && "flex justify-center")}
              >
                <Button
                  className={cn(
                    "rounded-xl bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/20",
                    isOpen ? "w-full" : "h-10 w-10 p-0"
                  )}
                >
                  {isOpen ? "Try Premium" : <Sparkles className="w-5 h-5" />}
                </Button>
              </Link>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "w-full justify-start mt-1 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-xl",
                    !isOpen && "justify-center p-0 h-10 w-10"
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
              <Link href={APP_ROUTES.Help} className="w-full">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-xl",
                    !isOpen && "justify-center px-0"
                  )}
                >
                  <HelpCircle className={cn("w-5 h-5", isOpen && "mr-2")} /> {isOpen && "Help"}
                </Button>
              </Link>
            </>
          )}
          <Profile isCollapsed={!isOpen} />
        </div>
      </aside>
    </>
  );
}
