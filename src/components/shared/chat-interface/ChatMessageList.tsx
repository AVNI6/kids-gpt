"use client";

import React, { useEffect, useLayoutEffect, useRef, useCallback, memo } from "react";
import { Bot } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { Message } from "@/types/common";
import ChatMessageItem from "./ChatMessageItem";

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<void>;
  loadingText?: string;
}

const ChatMessageList = memo(function ChatMessageList({
  messages,
  isLoading,
  messagesEndRef,
  hasMore,
  isLoadingMore,
  onLoadMore,
  loadingText,
}: ChatMessageListProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scrollHeightRef = useRef<number>(0);
  const scrollTopRef = useRef<number>(0);
  const isLoadingMoreRef = useRef(isLoadingMore);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (viewport && scrollHeightRef.current > 0) {
      const delta = viewport.scrollHeight - scrollHeightRef.current;
      if (delta > 0) {
        viewport.scrollTop = scrollTopRef.current + delta;
      }
      scrollHeightRef.current = 0;
      scrollTopRef.current = 0;
    }
  }, [messages]);

  const handleScroll = useCallback(
    async (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      if (target.scrollTop <= 5 && hasMore && !isLoadingMoreRef.current) {
        scrollHeightRef.current = target.scrollHeight;
        scrollTopRef.current = target.scrollTop;
        await onLoadMore();
      }
    },
    [hasMore, onLoadMore]
  );

  return (
    <div className="flex-1 min-h-0 overflow-hidden relative">
      <ScrollArea viewportRef={viewportRef} onScroll={handleScroll} className="h-full w-full">
        <div className="w-full max-w-3xl mx-auto pb-6 px-2 py-4 sm:p-0 sm:py-6 space-y-3">
          {isLoadingMore && (
            <div className="flex justify-center py-2 text-xs font-semibold text-muted-foreground gap-2 items-center">
              <Spinner className="w-4 h-4 animate-spin text-sky-500" />
              <span>Loading older messages...</span>
            </div>
          )}
          {messages.map((message) => {
            const isUser = message.role === "user";
            // FIX: Only show "AI Buddy" header when there's actual content AND it's not failed/terminated
            const showModelHeader =
              message.role === "model" && !!message.content && message.status !== "failed";

            return (
              <ChatMessageItem
                key={message.id}
                message={message}
                isUser={isUser}
                showModelHeader={showModelHeader}
              />
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-end gap-3">
                <Avatar size={"sm"} className="hidden sm:flex shrink-0 mb-1">
                  <AvatarFallback className="bg-sky-500 text-white">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>

                <div className="rounded-2xl sm:rounded-3xl rounded-bl-sm px-3 sm:px-5 py-2.5 sm:py-3.5 bg-card border border-border flex items-center gap-2.5 sm:gap-3 shadow-sm">
                  <Spinner />
                  <span className="text-muted-foreground text-sm font-medium">
                    {loadingText || "Thinking..."}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
});

ChatMessageList.displayName = "ChatMessageList";

export default ChatMessageList;
