"use client";
import { useEffect, useState } from "react";
import {
  PlusCircle,
  ClipboardList,
  Settings,
  HelpCircle,
  Sparkles,
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import Profile from "./Profile";
import { APP_ROUTES } from "@/constant/AppRoutes";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getSessionManager } from "@/lib/ai/session-manager";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import SearchChatModal from "./SearchChatModal";

function AuthPromptPopoverContent({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col gap-3 text-center items-center">
      <div className="p-2 bg-sky-500/10 rounded-full text-sky-500">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="font-bold text-popover-foreground">{title}</h4>
      <p className="text-muted-foreground text-xs">{description}</p>
      <Link
        href={APP_ROUTES.Signin}
        className={cn(
          buttonVariants({ variant: "default" }),
          "w-full mt-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl cursor-pointer flex items-center justify-center h-10 text-sm font-semibold"
        )}
      >
        Sign In
      </Link>
    </div>
  );
}

export default function Sidebar() {
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
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sessionToShare, setSessionToShare] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const { setTheme, theme } = useTheme();

  const { state, toggleSidebar, isMobile } = useSidebar();
  const isOpen = state === "expanded";

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
      toggleSidebar();
    }
    router.push("/");
  };

  const handleSelectSession = (sessionId: string) => {
    if (editingSessionId === sessionId) return;
    getSessionManager().abortActiveRequest();
    setOpenPopoverId(null);
    if (isMobile && isOpen) {
      toggleSidebar();
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
      <ShadcnSidebar
        collapsible="icon"
        className="border-r border-sidebar-border bg-sidebar h-screen shrink-0"
      >
        <SidebarHeader className="p-4 flex flex-col shrink-0 gap-3">
          <div
            className={cn(
              "flex items-center w-full",
              isOpen ? "justify-between" : "justify-center"
            )}
          >
            <button
              onClick={toggleSidebar}
              title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
              suppressHydrationWarning={true}
              className="h-7 w-7 rounded-2xl bg-sky-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            {isOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                suppressHydrationWarning={true}
                className="text-slate-500 hover:text-slate-700 h-10 w-10 flex items-center justify-center cursor-pointer"
              >
                <PanelLeftClose className="w-5 h-5" />
              </Button>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="flex flex-col flex-1 min-h-0 py-2 gap-4 px-0">
          {isOpen ? (
            // --- OPEN SIDEBAR STATE ---
            // Render plain standard buttons and links to bypass Shadcn list styling overrides and maintain generous original sizing
            <div className="space-y-2 shrink-0 px-4">
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

                const buttonClass = cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left font-semibold transition-colors group/nav cursor-pointer",
                  showActiveStyle
                    ? "bg-sidebar-accent text-sky-500 font-bold"
                    : "text-sidebar-foreground"
                );

                const itemContent = (
                  <>
                    <Icon className="w-5 h-5 shrink-0 text-slate-500 group-hover/nav:text-slate-700 dark:text-slate-400 dark:group-hover/nav:text-slate-200 transition-colors" />
                    <span className="whitespace-nowrap truncate">{item.label}</span>
                  </>
                );

                if (isActivities && !isUserLoggedIn) {
                  return (
                    <Popover key={item.label}>
                      <PopoverTrigger className={buttonClass} suppressHydrationWarning={true}>
                        {itemContent}
                      </PopoverTrigger>
                      <PopoverContent
                        side={isMobile ? "bottom" : "right"}
                        align={isMobile ? "center" : "start"}
                        sideOffset={isMobile ? 8 : 15}
                        className="w-64 p-4 rounded-2xl shadow-xl border-sidebar-border bg-popover text-sm"
                      >
                        <AuthPromptPopoverContent
                          title="Interactive Activities"
                          description="Sign in or sign up to play custom games, complete quiz challenges, and practice vocabulary!"
                          icon={ClipboardList}
                        />
                      </PopoverContent>
                    </Popover>
                  );
                }

                if (isSearch) {
                  if (!isUserLoggedIn) {
                    return (
                      <Popover key={item.label}>
                        <PopoverTrigger className={buttonClass} suppressHydrationWarning={true}>
                          {itemContent}
                        </PopoverTrigger>
                        <PopoverContent
                          side={isMobile ? "bottom" : "right"}
                          align={isMobile ? "center" : "start"}
                          sideOffset={isMobile ? 8 : 15}
                          className="w-64 p-4 rounded-2xl shadow-xl border-sidebar-border bg-popover text-sm"
                        >
                          <AuthPromptPopoverContent
                            title="Search Chats"
                            description="Sign in or sign up to search your chat history and pick up right where you left off!"
                            icon={Search}
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  }

                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (isMobile && isOpen) {
                          toggleSidebar();
                        }
                        setSearchOpen(true);
                      }}
                      suppressHydrationWarning={true}
                      className={buttonClass}
                    >
                      {itemContent}
                    </button>
                  );
                }

                if (item.href) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={item.onClick}
                      className={buttonClass}
                    >
                      {itemContent}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    suppressHydrationWarning={true}
                    className={buttonClass}
                  >
                    {itemContent}
                  </button>
                );
              })}
            </div>
          ) : (
            // --- CLOSED SIDEBAR STATE ---
            // Render compact icons with perfect centering, tooltips, and correct icon sizing. Bypasses px-4 layout constraints.
            <div className="space-y-3 shrink-0 px-0 flex flex-col items-center justify-center w-full">
              <SidebarMenu className="w-full flex flex-col items-center gap-3">
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

                  // Perfect 40px circular buttons with size-6! (24px) icons so they are clearly visible and match original premium custom sidebar
                  const collapsedButtonEl = (
                    <SidebarMenuButton
                      isActive={showActiveStyle}
                      tooltip={item.label}
                      className={cn(
                        "flex items-center justify-center rounded-xl transition-colors cursor-pointer w-10 h-10 mx-auto p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        showActiveStyle
                          ? "bg-sidebar-accent text-sky-500 font-bold"
                          : "text-sidebar-foreground"
                      )}
                    >
                      <Icon className="w-6 h-6 !w-6 !h-6 size-6! shrink-0 text-slate-500 group-hover/menu-button:text-slate-700 dark:text-slate-400 dark:group-hover/menu-button:text-slate-200 transition-colors" />
                    </SidebarMenuButton>
                  );

                  if (isActivities && !isUserLoggedIn) {
                    return (
                      <SidebarMenuItem key={item.label} className="w-full flex justify-center">
                        <Popover>
                          <PopoverTrigger render={collapsedButtonEl} />
                          <PopoverContent
                            side="right"
                            align="start"
                            sideOffset={15}
                            className="w-64 p-4 rounded-2xl shadow-xl border-sidebar-border bg-popover text-sm"
                          >
                            <AuthPromptPopoverContent
                              title="Interactive Activities"
                              description="Sign in or sign up to play custom games, complete quiz challenges, and practice vocabulary!"
                              icon={ClipboardList}
                            />
                          </PopoverContent>
                        </Popover>
                      </SidebarMenuItem>
                    );
                  }

                  if (isSearch) {
                    if (!isUserLoggedIn) {
                      return (
                        <SidebarMenuItem key={item.label} className="w-full flex justify-center">
                          <Popover>
                            <PopoverTrigger render={collapsedButtonEl} />
                            <PopoverContent
                              side="right"
                              align="start"
                              sideOffset={15}
                              className="w-64 p-4 rounded-2xl shadow-xl border-sidebar-border bg-popover text-sm"
                            >
                              <AuthPromptPopoverContent
                                title="Search Chats"
                                description="Sign in or sign up to search your chat history and pick up right where you left off!"
                                icon={Search}
                              />
                            </PopoverContent>
                          </Popover>
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.label} className="w-full flex justify-center">
                        <SidebarMenuButton
                          onClick={() => setSearchOpen(true)}
                          tooltip={item.label}
                          className={cn(
                            "flex items-center justify-center rounded-xl transition-colors cursor-pointer w-10 h-10 mx-auto p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            showActiveStyle
                              ? "bg-sidebar-accent text-sky-500 font-bold"
                              : "text-sidebar-foreground"
                          )}
                        >
                          <Icon className="w-6 h-6 !w-6 !h-6 size-6! shrink-0 text-slate-500 group-hover/menu-button:text-slate-700 dark:text-slate-400 dark:group-hover/menu-button:text-slate-200 transition-colors" />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

                  if (item.href) {
                    return (
                      <SidebarMenuItem key={item.label} className="w-full flex justify-center">
                        <SidebarMenuButton
                          isActive={showActiveStyle}
                          tooltip={item.label}
                          render={<Link href={item.href} onClick={item.onClick} />}
                          className={cn(
                            "flex items-center justify-center rounded-xl transition-colors cursor-pointer w-10 h-10 mx-auto p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            showActiveStyle
                              ? "bg-sidebar-accent text-sky-500 font-bold"
                              : "text-sidebar-foreground"
                          )}
                        >
                          <Icon className="w-6 h-6 !w-6 !h-6 size-6! shrink-0 text-slate-500 group-hover/menu-button:text-slate-700 dark:text-slate-400 dark:group-hover/menu-button:text-slate-200 transition-colors" />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.label} className="w-full flex justify-center">
                      <SidebarMenuButton
                        onClick={item.onClick}
                        tooltip={item.label}
                        className={cn(
                          "flex items-center justify-center rounded-xl transition-colors cursor-pointer w-10 h-10 mx-auto p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          showActiveStyle
                            ? "bg-sidebar-accent text-sky-500 font-bold"
                            : "text-sidebar-foreground"
                        )}
                      >
                        <Icon className="w-6 h-6 !w-6 !h-6 size-6! shrink-0 text-slate-500 group-hover/menu-button:text-slate-700 dark:text-slate-400 dark:group-hover/menu-button:text-slate-200 transition-colors" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          )}

          {/* Recent chats is strictly gated under isOpen - completely absent in closed sidebar */}
          {isUserLoggedIn && isOpen && (
            <div className="flex flex-col flex-1 min-h-0 transition-all">
              <h3 className="px-4 shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 truncate">
                Recent Chats
              </h3>
              <ScrollArea className="w-full flex-1 min-h-0">
                <div className="space-y-1 w-full pl-4 pr-3 py-1">
                  {sessions.length > 0 ? (
                    sessions.map((session) => (
                      <div key={session.id}>
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
                              placeholder="Save..."
                            />
                          </form>
                        ) : (
                          <div
                            onClick={() => handleSelectSession(session.id)}
                            className={cn(
                              "w-full flex items-center justify-between rounded-xl px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left font-semibold transition-colors cursor-pointer group/chat",
                              pathname === "/" && currentSessionId === session.id
                                ? "bg-sidebar-accent text-sky-500"
                                : "text-sidebar-foreground"
                            )}
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
                                suppressHydrationWarning={true}
                                className={cn(
                                  "p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-opacity cursor-pointer shrink-0",
                                  openPopoverId === session.id
                                    ? "opacity-100"
                                    : "opacity-0 group-hover/chat:opacity-100"
                                )}
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
                                    className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-sidebar-accent rounded-md transition-colors cursor-pointer text-left"
                                  >
                                    <Edit2 className="w-4 h-4" /> Rename
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenPopoverId(null);
                                      setSessionToShare(session.id);
                                    }}
                                    className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-sidebar-accent rounded-md transition-colors text-sky-500 w-full text-left cursor-pointer"
                                  >
                                    <Share2 className="w-4 h-4" /> Share
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenPopoverId(null);
                                      setSessionToDelete(session.id);
                                    }}
                                    className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-sidebar-accent rounded-md transition-colors text-red-500 w-full text-left cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4 pointer-events-none" /> Delete
                                  </button>
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
              </ScrollArea>
            </div>
          )}
        </SidebarContent>

        <SidebarFooter className="p-4 flex flex-col shrink-0 gap-2 border-t border-sidebar-border">
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
                        className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-colors cursor-pointer ${theme === name ? "bg-sky-500/10 text-sky-500 font-bold" : "text-popover-foreground/70 hover:bg-accent hover:text-accent-foreground"}`}
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
      </ShadcnSidebar>

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
              className="rounded-xl border-border hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm cursor-pointer"
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
            <DialogTitle className="text-foreground">Share link</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Anyone who has this link will be able to view this.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 pt-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input
                id="link"
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
              className="px-3 cursor-pointer"
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
          <DialogFooter className="sm:justify-start pt-4">
            <DialogClose
              render={
                <button className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")} />
              }
            >
              Close
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
