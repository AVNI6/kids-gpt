"use client";

import React from "react";
import { MoreVertical, Edit2, Share2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ChatSessionRow } from "@/types/common";

interface RecentChatItemProps {
  session: ChatSessionRow;
  isActive: boolean;
  isEditing: boolean;
  isPopoverOpen: boolean;
  editTitle: string;
  setEditTitle: (val: string) => void;
  setOpenPopoverId: (val: string | null) => void;
  onSelectSession: (sessionId: string, e?: React.MouseEvent) => void;
  onSaveRename: (e: React.FormEvent | React.FocusEvent, sessionId: string) => void;
  onStartRename: (e: React.MouseEvent, session: ChatSessionRow) => void;
  onSetSessionToShare: (sessionId: string | null) => void;
  onSetSessionToDelete: (sessionId: string | null) => void;
}

const RecentChatItem = React.memo(
  function RecentChatItem({
    session,
    isActive,
    isEditing,
    isPopoverOpen,
    editTitle,
    setEditTitle,
    setOpenPopoverId,
    onSelectSession,
    onSaveRename,
    onStartRename,
    onSetSessionToShare,
    onSetSessionToDelete,
  }: RecentChatItemProps) {
    return (
      <div>
        {isEditing ? (
          <form
            onSubmit={(e) => onSaveRename(e, session.id)}
            className="flex items-center gap-2 p-1"
          >
            <Input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={(e) => onSaveRename(e, session.id)}
              className="w-full bg-sidebar-accent border border-sky-500 rounded-md px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground"
              placeholder="Save..."
            />
          </form>
        ) : (
          <div
            onClick={(e) => onSelectSession(session.id, e)}
            className={cn(
              "w-full flex items-center justify-between rounded-xl pl-1 py-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left font-semibold transition-colors cursor-pointer group/chat",
              isActive ? "bg-sidebar-accent text-sky-500" : "text-sidebar-foreground"
            )}
          >
            <span className="whitespace-nowrap overflow-hidden text-sm pointer-events-none truncate mr-2">
              {session.title}
            </span>

            <Popover
              open={isPopoverOpen}
              onOpenChange={(open) => setOpenPopoverId(open ? session.id : null)}
            >
              <PopoverTrigger
                onClick={(e) => e.stopPropagation()}
                suppressHydrationWarning={true}
                className={cn(
                  "p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-all cursor-pointer shrink-0",
                  isPopoverOpen
                    ? "opacity-100"
                    : "opacity-100 xl:opacity-0 xl:group-hover/chat:opacity-100"
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
                  {/* <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenPopoverId(null);
                      onSetSessionToShare(session.id);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-sidebar-accent rounded-md transition-colors text-sky-500 w-full text-left cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button> */}
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
    );
  },
  (prev, next) => {
    // If it is editing, check if editTitle changed
    const editTitleCheck =
      prev.isEditing && next.isEditing ? prev.editTitle === next.editTitle : true;
    return (
      prev.session.id === next.session.id &&
      prev.session.title === next.session.title &&
      prev.session.updated_at === next.session.updated_at &&
      prev.isActive === next.isActive &&
      prev.isEditing === next.isEditing &&
      prev.isPopoverOpen === next.isPopoverOpen &&
      editTitleCheck
    );
  }
);

RecentChatItem.displayName = "RecentChatItem";

export default RecentChatItem;
