"use client";

import { MoreVertical, Edit2, Share2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChatSessionRow } from "@/types/chat.types";

interface RecentChatListProps {
  sessions: ChatSessionRow[];
  currentSessionId: string | null;
  editingSessionId: string | null;
  editTitle: string;
  setEditTitle: (val: string) => void;
  openPopoverId: string | null;
  setOpenPopoverId: (val: string | null) => void;
  pathname: string;
  onSelectSession: (sessionId: string, e?: React.MouseEvent) => void;
  onSaveRename: (e: React.FormEvent | React.FocusEvent, sessionId: string) => void;
  onStartRename: (e: React.MouseEvent, session: ChatSessionRow) => void;
  onSetSessionToShare: (sessionId: string | null) => void;
  onSetSessionToDelete: (sessionId: string | null) => void;
}

export default function RecentChatList({
  sessions,
  currentSessionId,
  editingSessionId,
  editTitle,
  setEditTitle,
  openPopoverId,
  setOpenPopoverId,
  pathname,
  onSelectSession,
  onSaveRename,
  onStartRename,
  onSetSessionToShare,
  onSetSessionToDelete,
}: RecentChatListProps) {
  return (
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
                    onSubmit={(e) => onSaveRename(e, session.id)}
                    className="flex items-center gap-2 p-1"
                  >
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={(e) => onSaveRename(e, session.id)}
                      className="w-full bg-sidebar-accent border border-sky-500 rounded-md px-2 py-1 text-sm focus:outline-none text-foreground"
                      placeholder="Save..."
                    />
                  </form>
                ) : (
                  <div
                    onClick={() => onSelectSession(session.id)}
                    className={cn(
                      "w-full flex items-center justify-between rounded-xl pl-1 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left font-semibold transition-colors cursor-pointer group/chat",
                      (pathname === "/" || pathname.startsWith("/chat/")) &&
                        currentSessionId === session.id
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
                            onClick={(e) => onStartRename(e, session)}
                            className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-sidebar-accent rounded-md transition-colors cursor-pointer text-left text-foreground"
                          >
                            <Edit2 className="w-4 h-4 text-slate-500" /> Rename
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenPopoverId(null);
                              onSetSessionToShare(session.id);
                            }}
                            className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-sidebar-accent rounded-md transition-colors text-sky-500 w-full text-left cursor-pointer"
                          >
                            <Share2 className="w-4 h-4" /> Share
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenPopoverId(null);
                              onSetSessionToDelete(session.id);
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
  );
}
