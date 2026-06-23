"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { calculateAge } from "@/lib/utils/kid/childAge";
import ChatFooter, { ChatFooterRef } from "./ChatFooter";
import ChatMessageList from "./ChatMessageList";
import ChatSuggestions from "./ChatSuggestions";
import ChatSkeleton from "./ChatSkeleton";
import ChatHeader from "./ChatHeader";
import { useChatMessages } from "./useChatMessages";
import { useChatPdf } from "./useChatPdf";
import { useChatSender } from "./useChatSender";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCurrentSessionId } from "@/store/slices/chatSlice";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/components/ui/sidebar";
import { getSessionManager } from "@/lib/ai/session-manager";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "@/types/user";

const suggestions = ["Help with Math", "Tell a Space Story", "Practice Spanish"];

export default function ChatInterface() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const urlSessionId = searchParams ? searchParams.get("id") : null;
  const messages = useAppSelector((state) => state.chat.messages);
  const currentSessionId = useAppSelector((state) => state.chat.currentSessionId);
  const sessions = useAppSelector((state) => state.chat.sessions);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const justCreatedSessionRef = useRef(false);
  const isFirstScrollRef = useRef(true);
  const currentSessionIdRef = useRef(currentSessionId);
  const lastMessageIdRef = useRef<string | null>(null);
  const chatFooterRef = useRef<ChatFooterRef>(null);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  const { toggleSidebar, openMobile } = useSidebar();
  const { user, userProfile, isUserLoggedIn, userRole, isLoading: isLoadingAuth } = useAuth();

  const [sessionOwnerProfile, setSessionOwnerProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let active = true;
    if (!currentSessionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessionOwnerProfile(null);
      return;
    }

    const fetchOwner = async () => {
      try {
        const supabase = createClient();
        const { data: sessionData, error: sessionError } = await supabase
          .from("chat_sessions")
          .select("user_id, profile:profile(first_name, last_name, avatar_url, role)")
          .eq("id", currentSessionId)
          .maybeSingle();

        if (sessionError || !sessionData) {
          if (active) setSessionOwnerProfile(null);
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profileRaw = (sessionData as any).profile;
        const profileData = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;

        if (!profileData) {
          if (active) setSessionOwnerProfile(null);
          return;
        }

        if (active) {
          setSessionOwnerProfile(profileData as UserProfile);
        }
      } catch (err) {
        console.error("Failed to fetch session owner profile:", err);
        if (active) setSessionOwnerProfile(null);
      }
    };

    void fetchOwner();

    return () => {
      active = false;
    };
  }, [currentSessionId]);

  const childAge =
    userRole === "kid" && userProfile?.date_of_birth
      ? (calculateAge(userProfile.date_of_birth) ?? undefined)
      : undefined;

  const { isSessionLoading, hasMore, isLoadingMore, loadMore } = useChatMessages({
    currentSessionId,
    messages,
    isLoadingAuth,
    isUserLoggedIn,
    justCreatedSessionRef,
    userRole,
    userId: user?.id ?? null,
  });

  const { pdfStates, handleDownloadPDF } = useChatPdf({
    messages,
    sessions,
    currentSessionId,
    isUserLoggedIn,
    user,
    userRole,
  });

  const { isLoading, sendMessage, stopGenerating } = useChatSender({
    messages,
    currentSessionId,
    isUserLoggedIn,
    isLoadingAuth,
    user,
    age: childAge,
    userRole,
    justCreatedSessionRef,
  });

  const handleSend = useCallback(
    (text: string, img: string | null, fileText: string | null, fileMeta: string | null) => {
      void sendMessage(text, img, fileText, fileMeta);
    },
    [sendMessage]
  );

  useEffect(() => {
    // 1. If auth is loading, wait before syncing
    if (isLoadingAuth) return;

    // 2. If user is logged out, clear currentSessionId in Redux
    if (!isUserLoggedIn) {
      if (currentSessionIdRef.current !== null) {
        dispatch(setCurrentSessionId(null));
      }
      return;
    }

    // 3. Sync Redux currentSessionId to match URL search parameter id
    if (urlSessionId !== currentSessionIdRef.current) {
      dispatch(setCurrentSessionId(urlSessionId));
    }
  }, [urlSessionId, isUserLoggedIn, isLoadingAuth, dispatch]); // ← currentSessionId intentionally omitted

  // Abort in-flight requests when component unmounts
  useEffect(() => {
    return () => {
      getSessionManager().abortActiveRequest();
    };
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Reset scroll speed on session change
  useEffect(() => {
    isFirstScrollRef.current = true;
  }, [currentSessionId]);

  // Scroll to bottom whenever messages update; use instant on first load of a session,
  // or smooth scroll when a new message is appended (last message ID changed)
  useEffect(() => {
    if (messages.length === 0) {
      lastMessageIdRef.current = null;
      return;
    }

    const lastMsg = messages[messages.length - 1];
    const prevLastMsgId = lastMessageIdRef.current;
    lastMessageIdRef.current = lastMsg.id;

    const isFirst = isFirstScrollRef.current;
    if (isFirst) {
      scrollToBottom("instant");
      isFirstScrollRef.current = false;
    } else if (prevLastMsgId !== null && lastMsg.id !== prevLastMsgId) {
      scrollToBottom("smooth");
    }
  }, [messages, isLoading, scrollToBottom]);

  const showHeader = userRole !== "kid";

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    chatFooterRef.current?.setInputText(suggestion);
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-background overflow-hidden">
      {showHeader && (
        <ChatHeader
          openMobile={openMobile}
          toggleSidebar={toggleSidebar}
          currentSessionId={currentSessionId}
          sessionOwnerProfile={sessionOwnerProfile}
          userRole={userRole}
        />
      )}

      <main className="flex-1 flex flex-col overflow-hidden min-h-0 bg-background">
        {isSessionLoading && messages.length === 0 ? (
          <ChatSkeleton />
        ) : messages.length === 0 ? (
          <ChatSuggestions suggestions={suggestions} onSelectSuggestion={handleSelectSuggestion} />
        ) : (
          <ChatMessageList
            messages={messages}
            isLoading={isLoading}
            pdfStates={pdfStates}
            handleDownloadPDF={handleDownloadPDF}
            messagesEndRef={messagesEndRef}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
            sessionOwnerProfile={sessionOwnerProfile}
          />
        )}

        <ChatFooter
          ref={chatFooterRef}
          onSend={handleSend}
          onStop={stopGenerating}
          isLoading={isLoading}
          isAuthLoading={isLoadingAuth}
          currentSessionId={currentSessionId}
        />
      </main>
    </div>
  );
}
