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
  Copy,
  Check,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Profile from "./Profile";
import { APP_ROUTES } from "@/constant/AppRoutes";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getSessionManager } from "@/lib/ai/session-manager";

import SearchChatModal from "./SearchChatModal";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname() || "";
  const sessions = useAppSelector((state) => state.chat.sessions);
  const currentSessionId = useAppSelector((state) => state.chat.currentSessionId);
  const { user, userProfile, isUserLoggedIn, isLoading: isLoadingAuth } = useAuth();
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Lifted delete confirmation state — dialog lives OUTSIDE the popover tree
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Lifted share dialog state — same reason: avoids Base UI popover unmount race condition
  const [sessionToShare, setSessionToShare] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const { setTheme, theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
    getSessionManager().abortActiveRequest();
    dispatch(setCurrentSessionId(null));
    dispatch(setMessages([]));
    if (isMobile && isOpen) {
      onToggle();
    }
    router.push("/");
  };

  const handleSelectSession = (sessionId: string) => {
    if (editingSessionId === sessionId) return;
    getSessionManager().abortActiveRequest();
    setOpenPopoverId(null);
    if (isMobile && isOpen) {
      onToggle();
    }
    if (pathname.startsWith("/chat/")) {
      router.push(`${pathname}?id=${sessionId}`);
    } else {
      router.push(`/?id=${sessionId}`);
    }
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

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await handleDeleteSession(sessionToDelete);
      setSessionToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyShareLink = async (sessionId: string) => {
    const shareUrl = `${window.location.origin}/share/${sessionId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy share link:", err);
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

  const userRole = userProfile?.role ?? "kid";

  const navItems = [
    { label: "New Chat", icon: PlusCircle, href: "/", onClick: handleNewChat },
    { label: "Search Chats", icon: Search },
    ...(userRole === "kid"
      ? [{ label: "Activities", icon: ClipboardList, href: "/activities" }]
      : []),
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
          isOpen
            ? "w-72 pt-4 pb-4 pl-4 pr-0 translate-x-0"
            : "w-72 md:w-20 p-4 -translate-x-full md:translate-x-0"
        )}
      >
        <div
          className={cn(
            "flex items-center mb-3 shrink-0",
            isOpen ? "justify-between pr-4" : "justify-center"
          )}
        >
          <button
            onClick={onToggle}
            title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            className="h-7 w-7 rounded-2xl bg-sky-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
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

        <nav className="flex flex-col flex-1 overflow-hidden pr-0">
          <div className={cn("space-y-2 shrink-0", isOpen && "pr-4")}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : item.href
                    ? pathname.startsWith(item.href)
                    : false;
              const showActiveStyle = item.label !== "New Chat" && isActive;

              const isSearch = item.label === "Search Chats";
              const isActivities = item.label === "Activities";
              const renderItemContent = () => (
                <>
                  <Icon className="w-5 h-5 shrink-0" />
                  {isOpen && <span className="whitespace-nowrap truncate">{item.label}</span>}
                </>
              );

              const commonClasses = cn(
                "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left font-semibold transition-colors group",
                showActiveStyle
                  ? "bg-sidebar-accent text-sky-500 font-bold"
                  : "text-sidebar-foreground",
                !isOpen && "justify-center px-0 h-10 w-10 mx-auto"
              );

              // Handle Activities Popover if not logged in
              if (isActivities && !isUserLoggedIn) {
                return (
                  <Popover key={item.label}>
                    <PopoverTrigger
                      title={!isOpen ? item.label : undefined}
                      className={commonClasses}
                    >
                      {renderItemContent()}
                    </PopoverTrigger>
                    <PopoverContent
                      side={isMobile ? "bottom" : isOpen ? "right" : "right"}
                      align={isMobile ? "center" : "start"}
                      sideOffset={isMobile ? 8 : 15}
                      className="w-64 p-4 rounded-2xl shadow-xl border-sidebar-border bg-popover text-sm"
                    >
                      <div className="flex flex-col gap-3 text-center items-center">
                        <div className="p-2 bg-sky-500/10 rounded-full text-sky-500">
                          <ClipboardList className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-popover-foreground">
                          Interactive Activities
                        </h4>
                        <p className="text-muted-foreground text-xs">
                          Sign in or sign up to play custom games, complete quiz challenges, and
                          practice vocabulary!
                        </p>
                        <Link href={APP_ROUTES.Signin} className="w-full mt-2">
                          <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-xl">
                            Sign In
                          </Button>
                        </Link>
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              }

              // Handle Search
              if (isSearch) {
                if (!isUserLoggedIn) {
                  return (
                    <Popover key={item.label}>
                      <PopoverTrigger
                        title={!isOpen ? item.label : undefined}
                        className={commonClasses}
                      >
                        {renderItemContent()}
                      </PopoverTrigger>
                      <PopoverContent
                        side={isMobile ? "bottom" : isOpen ? "right" : "right"}
                        align={isMobile ? "center" : "start"}
                        sideOffset={isMobile ? 8 : 15}
                        className="w-64 p-4 rounded-2xl shadow-xl border-sidebar-border bg-popover text-sm"
                      >
                        <div className="flex flex-col gap-3 text-center items-center">
                          <div className="p-2 bg-sky-500/10 rounded-full text-sky-500">
                            <Search className="w-6 h-6" />
                          </div>
                          <h4 className="font-bold text-popover-foreground">Search Chats</h4>
                          <p className="text-muted-foreground text-xs">
                            Sign in or sign up to search your chat history and pick up right where
                            you left off!
                          </p>
                          <Link href={APP_ROUTES.Signin} className="w-full mt-2">
                            <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-xl">
                              Sign In
                            </Button>
                          </Link>
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                }

                return (
                  <button
                    key={item.label}
                    title={!isOpen ? item.label : undefined}
                    className={cn(commonClasses, "text-sidebar-foreground")}
                    onClick={() => {
                      if (isMobile && isOpen) {
                        onToggle();
                      }
                      setSearchOpen(true);
                    }}
                  >
                    {renderItemContent()}
                  </button>
                );
              }

              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={item.onClick}
                    className={commonClasses}
                    title={!isOpen ? item.label : undefined}
                  >
                    {renderItemContent()}
                  </Link>
                );
              }

              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  title={!isOpen ? item.label : undefined}
                  className={cn(commonClasses, "text-sidebar-foreground")}
                >
                  {renderItemContent()}
                </button>
              );
            })}
          </div>

          {isUserLoggedIn && (
            <div
              className={cn(
                "mt-6 flex flex-col flex-1 min-h-0 transition-all",
                !isOpen && "mt-4 items-center"
              )}
            >
              {isOpen ? (
                <h3 className="px-3 shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 truncate">
                  Recent Chats
                </h3>
              ) : (
                <div className="h-px w-8 bg-sidebar-border mb-4 shrink-0" />
              )}
              <div
                className={cn(
                  "space-y-1 w-full flex-1 overflow-y-auto min-h-0 custom-scrollbar",
                  isOpen ? "pr-0" : "pr-1"
                )}
              >
                {sessions.length > 0
                  ? sessions.map((session) => (
                      <div key={session.id} className={cn("group relative", isOpen && "pr-4")}>
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
                              pathname === "/" && currentSessionId === session.id
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
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenPopoverId(null);
                                        setSessionToShare(session.id);
                                      }}
                                      className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-sidebar-accent rounded-md transition-colors text-sky-500 w-full text-left"
                                    >
                                      <Share2 className="w-4 h-4" /> Share
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenPopoverId(null);
                                        setSessionToDelete(session.id);
                                      }}
                                      className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-sidebar-accent rounded-md transition-colors text-red-500 w-full text-left"
                                    >
                                      <Trash2 className="w-4 h-4 pointer-events-none" /> Delete
                                    </button>
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
            isOpen ? "pr-4" : "flex flex-col items-center justify-center"
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

      {/* Search modal - rendered outside sidebar to avoid nesting issues */}
      {isUserLoggedIn && (
        <SearchChatModal
          open={searchOpen}
          onOpenChange={setSearchOpen}
          query={searchQuery}
          onQueryChange={setSearchQuery}
        />
      )}

      {/* Delete confirmation dialog - outside Popover tree (Base UI unmount race condition fix) */}
      <Dialog
        open={sessionToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setSessionToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-border bg-background">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Delete Chat?</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              This will permanently delete this chat session and all its messages. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setSessionToDelete(null)}
              disabled={isDeleting}
              className="rounded-xl border-border hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share dialog - outside Popover tree (same Base UI unmount race condition fix) */}
      <Dialog
        open={sessionToShare !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSessionToShare(null);
            setShareCopied(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-background">
          <DialogHeader>
            <DialogTitle className="text-foreground">Share this chat</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Anyone with this link will be able to view all messages in this session.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 pt-4">
            <div className="grid flex-1 gap-2">
              <label htmlFor="share-link" className="sr-only">
                Link
              </label>
              <Input
                id="share-link"
                readOnly
                className="h-9"
                value={
                  typeof window !== "undefined" && sessionToShare
                    ? `${window.location.origin}/share/${sessionToShare}`
                    : ""
                }
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="px-3"
              onClick={() => sessionToShare && handleCopyShareLink(sessionToShare)}
              variant={shareCopied ? "outline" : "default"}
            >
              <span className="sr-only">Copy</span>
              {shareCopied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
