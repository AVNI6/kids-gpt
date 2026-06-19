"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback, memo } from "react";
import { Bot } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { Message } from "@/types/common";
import { useAuth } from "@/hooks/useAuth";
import ChatMessageItem from "./ChatMessageItem";
import { UserProfile } from "@/types/user";

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  pdfStates: Record<
    string,
    "idle" | "generating" | "uploading" | "downloading" | "success" | "error"
  >;
  handleDownloadPDF: (messageId: string) => Promise<void>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<void>;
  sessionOwnerProfile?: UserProfile | null;
}

const ChatMessageList = memo(function ChatMessageList({
  messages,
  isLoading,
  pdfStates,
  handleDownloadPDF,
  messagesEndRef,
  hasMore,
  isLoadingMore,
  onLoadMore,
  sessionOwnerProfile,
}: ChatMessageListProps) {
  const { userProfile, isUserLoggedIn } = useAuth();
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

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
      // Check target.scrollTop <= 5 instead of exactly 0 to support high-DPI display zoom/rounding issues
      if (target.scrollTop <= 5 && hasMore && !isLoadingMoreRef.current) {
        scrollHeightRef.current = target.scrollHeight;
        scrollTopRef.current = target.scrollTop;
        await onLoadMore();
      }
    },
    [hasMore, onLoadMore]
  );

  const handleCopy = useCallback(async (messageId: string, content: string) => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 1200);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  }, []);

  return (
    <div className="flex-1 min-h-0 overflow-hidden relative">
      <ScrollArea viewportRef={viewportRef} onScroll={handleScroll} className="h-full w-full">
        <div className="w-full max-w-3xl mx-auto space-y-6 pb-6 p-3 sm:p-0 sm:py-6 md:py-8">
          {isLoadingMore && (
            <div className="flex justify-center py-2 text-xs font-semibold text-muted-foreground gap-2 items-center">
              <Spinner className="w-4 h-4 animate-spin text-sky-500" />
              <span>Loading older messages...</span>
            </div>
          )}
          {messages.map((message) => {
            const isUser = message.role === "user";
            const showModelHeader = message.role === "model";

            return (
              <ChatMessageItem
                key={message.id}
                message={message}
                isUser={isUser}
                showModelHeader={showModelHeader}
                pdfState={pdfStates[message.id] || "idle"}
                handleDownloadPDF={handleDownloadPDF}
                isCopied={copiedMessageId === message.id}
                handleCopy={handleCopy}
                isUserLoggedIn={isUserLoggedIn}
                userProfile={userProfile}
                sessionOwnerProfile={sessionOwnerProfile}
              />
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-end gap-3">
                <Avatar size={"sm"} className="shrink-0 mb-1">
                  <AvatarFallback className="bg-sky-500 text-white">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>

                <div className="rounded-3xl rounded-bl-sm px-5 py-3.5 bg-card border border-border flex items-center gap-3 shadow-sm">
                  <Spinner />
                  <span className="text-muted-foreground text-sm font-medium">Thinking...</span>
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
