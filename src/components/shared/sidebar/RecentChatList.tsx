"use client";

import React, { useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatSessionRow } from "@/types/common";
import RecentChatItem from "./RecentChatItem";

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
  onLoadMoreSessions: () => void;
  hasMoreSessions: boolean;
  isLoadingMoreSessions: boolean;
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
  onLoadMoreSessions,
  hasMoreSessions,
  isLoadingMoreSessions,
}: RecentChatListProps) {
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      if (target.scrollHeight - target.scrollTop - target.clientHeight < 20) {
        if (hasMoreSessions && !isLoadingMoreSessions) {
          onLoadMoreSessions();
        }
      }
    },
    [hasMoreSessions, isLoadingMoreSessions, onLoadMoreSessions]
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 transition-all">
      <h3 className="px-4 shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 truncate">
        Recent Chats
      </h3>
      <ScrollArea onScroll={handleScroll} className="w-full flex-1 min-h-0">
        <div className="space-y-1 w-full pl-1 pr-3 py-1">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <RecentChatItem
                key={session.id}
                session={session}
                isActive={
                  (pathname === "/" || pathname.startsWith("/chat/")) &&
                  currentSessionId === session.id
                }
                isEditing={editingSessionId === session.id}
                isPopoverOpen={openPopoverId === session.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                setOpenPopoverId={setOpenPopoverId}
                onSelectSession={onSelectSession}
                onSaveRename={onSaveRename}
                onStartRename={onStartRename}
                onSetSessionToShare={onSetSessionToShare}
                onSetSessionToDelete={onSetSessionToDelete}
              />
            ))
          ) : (
            <p className="text-xs text-slate-400 ml-3 italic">No recent chats</p>
          )}
          {isLoadingMoreSessions && (
            <div className="flex justify-center py-2 text-xs font-semibold text-muted-foreground gap-2 items-center">
              <span className="w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>Loading...</span>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
