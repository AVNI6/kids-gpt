"use client";

import { useEffect } from "react";
import { DialogPortal, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import { getSessionManager } from "@/lib/ai/session-manager";

interface SearchChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (q: string) => void;
}

export default function SearchChatModal({
  open,
  onOpenChange,
  query,
  onQueryChange,
}: SearchChatModalProps) {
  const sessions = useAppSelector((state) => state.chat.sessions);
  const router = useRouter();

  const handleSelectSession = (sessionId: string) => {
    onOpenChange(false);
    onQueryChange("");
    getSessionManager().abortActiveRequest();
    router.push(`/?id=${sessionId}`);
  };

  // Reset query when closed
  useEffect(() => {
    if (!open) onQueryChange("");
  }, [open, onQueryChange]);

  const filteredSessions = sessions.filter((session: { id: string; title: string }) =>
    session.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] sm:w-full max-w-[calc(100%-2rem)] sm:max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card border border-sidebar-border shadow-2xl overflow-hidden outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <DialogTitle className="sr-only">Search Chats</DialogTitle>

          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-sidebar-border">
            <Search className="w-5 h-5 text-muted-foreground shrink-0 mr-3" />
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search chats..."
              className="border-0 shadow-none focus-visible:ring-0 px-0 h-10 text-base bg-transparent"
              autoFocus
            />
            <DialogPrimitive.Close className="ml-2 text-xs text-muted-foreground px-2 py-1 rounded-lg hover:bg-sidebar-accent transition-colors shrink-0 cursor-pointer">
              Esc
            </DialogPrimitive.Close>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {filteredSessions.length > 0 ? (
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {query ? "Search Results" : "Recent Chats"}
                </div>
                {filteredSessions.map((session: { id: string; title: string }) => (
                  <button
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left transition-colors group"
                  >
                    <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-sky-500" />
                    <span className="font-semibold text-sm truncate text-foreground group-hover:text-sky-600 flex-1">
                      {session.title}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                <Search className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm font-medium">
                  {query ? `No chats matching "${query}"` : "No recent chats"}
                </p>
              </div>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
