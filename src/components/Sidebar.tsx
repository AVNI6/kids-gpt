"use client";

import { useEffect, useState } from "react";
import { Sparkles, PanelLeftClose, Copy, Check, PanelRightClose } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setSessions,
  setCurrentSessionId,
  updateSessionTitleInList,
} from "@/store/slice/chat.slice";
import { fetchUserSessions, deleteChatSession, updateSessionTitle } from "@/actions/chat.actions";
import { ChatSessionRow } from "@/types/chat.types";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
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
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getSessionManager } from "@/lib/ai/session-manager";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import SearchChatModal from "./SearchChatModal";

// Sub-components
import SidebarNavigation from "./sidebar/SidebarNavigation";
import RecentChatList from "./sidebar/RecentChatList";
import SidebarFooterActions from "./sidebar/SidebarFooterActions";

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname() || "";
  const sessions = useAppSelector((state) => state.chat.sessions);
  const currentSessionId = useAppSelector((state) => state.chat.currentSessionId);
  const { user, userProfile, isUserLoggedIn, isLoading: isLoadingAuth } = useAuth();
  const userRole = userProfile?.role ?? "kid";

  // Dialogs & Inline Action States
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

  // Load chat sessions for authenticated user
  useEffect(() => {
    let active = true;
    let controller = new AbortController();

    const loadSessions = async () => {
      if (isLoadingAuth) {
        return;
      }
      try {
        const userId = user?.id;
        if (userId) {
          controller.abort();
          controller = new AbortController();
          const userSessions = await fetchUserSessions(userId);
          if (active) {
            dispatch(setSessions(userSessions));
          }
        } else {
          if (active) {
            dispatch(setSessions([]));
          }
        }
      } catch (err) {
        if (active) {
          console.error("Failed to load sessions:", err);
        }
      }
    };
    loadSessions();

    return () => {
      active = false;
      controller.abort();
    };
  }, [user?.id, isLoadingAuth, dispatch]);

  const handleNewChat = () => {
    getSessionManager().abortActiveRequest();
    if (isMobile && isOpen) {
      toggleSidebar();
    }
    const chatRoute = userRole === "kid" ? "/" : `/chat/${userRole}`;
    router.push(chatRoute);
  };

  const handleSelectSession = (sessionId: string) => {
    if (editingSessionId === sessionId) return;
    getSessionManager().abortActiveRequest();
    setOpenPopoverId(null);
    if (isMobile && isOpen) {
      toggleSidebar();
    }

    const chatRoute = userRole === "kid" ? "/" : `/chat/${userRole}`;
    const targetUrl = `${chatRoute}?id=${sessionId}`;

    router.push(targetUrl);
  };

  const handleDeleteSession = async (sessionId: string) => {
    const originalSessions = [...sessions];
    const updatedSessions = sessions.filter((s) => s.id !== sessionId);
    dispatch(setSessions(updatedSessions));

    const wasCurrentSession = currentSessionId === sessionId;
    if (wasCurrentSession) {
      handleNewChat();
    }

    try {
      await deleteChatSession(sessionId);
    } catch {
      dispatch(setSessions(originalSessions));
      if (wasCurrentSession) {
        dispatch(setCurrentSessionId(sessionId));
      }
      alert("Failed to delete chat.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    const targetSessionId = sessionToDelete;

    setIsDeleting(true);
    try {
      await handleDeleteSession(targetSessionId);
    } finally {
      setIsDeleting(false);
      setSessionToDelete(null);
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
            {/* Main Action Button */}
            <button
              suppressHydrationWarning
              title={isOpen ? "Go Home" : "Open Sidebar"}
              onClick={() => {
                if (isOpen) {
                  handleNewChat();
                } else {
                  toggleSidebar();
                }
              }}
              className="group/btn h-7 w-7 rounded-2xl bg-sky-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform active:scale-95 cursor-pointer"
            >
              {isOpen ? (
                <Sparkles className="w-4 h-4" />
              ) : (
                <div className="relative w-4 h-4">
                  <Sparkles className="absolute inset-0 w-4 h-4 transition-all duration-200 group-hover/btn:opacity-0 group-hover/btn:scale-75" />

                  <PanelRightClose className="absolute inset-0 w-4 h-4 opacity-0 scale-75 transition-all duration-200 group-hover/btn:opacity-100 group-hover/btn:scale-100" />
                </div>
              )}
            </button>

            {/* Collapse Button */}
            {isOpen && (
              <Button
                title={"Close Sidebar"}
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                suppressHydrationWarning
                className=" text-slate-500 hover:text-slate-700  h-10 w-10 flex items-center justify-center cursor-pointer  "
              >
                <PanelLeftClose className="w-5 h-5" />
              </Button>
            )}
          </div>
        </SidebarHeader>

        {/* Sidebar Navigation and Recent Chats Content */}
        <SidebarContent className="flex flex-col flex-1 min-h-0 py-2 gap-4 px-0">
          <SidebarNavigation
            isOpen={isOpen}
            isUserLoggedIn={isUserLoggedIn}
            userRole={userRole}
            pathname={pathname}
            isMobile={isMobile}
            toggleSidebar={toggleSidebar}
            onNewChat={handleNewChat}
            onSearchOpen={setSearchOpen}
          />

          {isUserLoggedIn && isOpen && (
            <RecentChatList
              sessions={sessions}
              currentSessionId={currentSessionId}
              editingSessionId={editingSessionId}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              openPopoverId={openPopoverId}
              setOpenPopoverId={setOpenPopoverId}
              pathname={pathname}
              onSelectSession={handleSelectSession}
              onSaveRename={handleSaveRename}
              onStartRename={handleStartRename}
              onSetSessionToShare={setSessionToShare}
              onSetSessionToDelete={setSessionToDelete}
            />
          )}
        </SidebarContent>

        {/* Sidebar Footer and Profile Actions */}
        <SidebarFooterActions
          isOpen={isOpen}
          isUserLoggedIn={isUserLoggedIn}
          isLoadingAuth={isLoadingAuth}
          theme={theme}
          setTheme={setTheme}
        />
      </ShadcnSidebar>

      {/* Dialogs rendered outside sidebar tree to prevent unmount conflicts */}
      {isUserLoggedIn && (
        <SearchChatModal
          open={searchOpen}
          onOpenChange={setSearchOpen}
          query={searchQuery}
          onQueryChange={setSearchQuery}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={sessionToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setSessionToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-106.25 rounded-2xl border-border bg-background">
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

      {/* Share link dialog */}
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
