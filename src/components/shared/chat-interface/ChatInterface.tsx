"use client";

import { useEffect, useRef, useCallback } from "react";
import { calculateAge } from "@/lib/utils/kid/childAge";
import ChatFooter, { ChatFooterRef } from "./ChatFooter";
import ChatMessageList from "./ChatMessageList";
import ChatSuggestions from "./ChatSuggestions";
import ChatSkeleton from "./ChatSkeleton";
import ChatHeader from "./ChatHeader";
import { useChatMessages } from "./useChatMessages";
import { useChatPdf } from "./useChatPdf";
import { useChatDocx } from "./useChatDocx";
import { useChatSender } from "./useChatSender";
import { useTextToSpeech } from "@/hooks/shared/useTextToSpeech";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCurrentSessionId } from "@/store/slices/chatSlice";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/components/ui/sidebar";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "@/types/user";
import { useChatStore } from "./chatStore";

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
  const lastMessageContentRef = useRef<string | null>(null);
  const prevIsLoadingRef = useRef(false);
  const chatFooterRef = useRef<ChatFooterRef>(null);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  const { toggleSidebar, openMobile } = useSidebar();
  const { user, userProfile, isUserLoggedIn, userRole, isLoading: isLoadingAuth } = useAuth();

  const sessionOwnerProfile = useChatStore((s) => s.sessionOwnerProfile);

  // Sync Redux chat data to Zustand chatStore
  useEffect(() => {
    useChatStore.getState().setMessages(messages);
  }, [messages]);

  useEffect(() => {
    useChatStore.getState().setSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    useChatStore.getState().setCurrentSessionId(currentSessionId);
  }, [currentSessionId]);

  useEffect(() => {
    let active = true;
    if (!currentSessionId) {
      useChatStore.getState().setSessionOwnerProfile(null);
      return;
    }

    const fetchOwner = async () => {
      try {
        const supabase = createClient();
        const { data: sessionData, error: sessionError } = await supabase
          .from("chat_sessions")
          .select("user_id, profile:profile(user_id, first_name, last_name, avatar_url, role)")
          .eq("id", currentSessionId)
          .maybeSingle();

        if (sessionError || !sessionData) {
          if (active) useChatStore.getState().setSessionOwnerProfile(null);
          return;
        }

        const profileRaw = (sessionData as { profile?: unknown }).profile;
        const profileData = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;

        if (!profileData) {
          if (active) useChatStore.getState().setSessionOwnerProfile(null);
          return;
        }

        if (active) {
          useChatStore.getState().setSessionOwnerProfile(profileData as UserProfile);
        }
      } catch (err) {
        console.error("Failed to fetch session owner profile:", err);
        if (active) useChatStore.getState().setSessionOwnerProfile(null);
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

  const { isLoading, isGenerating, loadingText, sendMessage, stopGenerating } = useChatSender({
    messages,
    currentSessionId,
    isLoadingAuth,
    user,
    age: childAge,
    userRole,
    justCreatedSessionRef,
  });

  const { isSessionLoading, hasMore, isLoadingMore, loadMore, isPolling, cancelPolling } =
    useChatMessages({
      currentSessionId,
      messages,
      isLoadingAuth,
      isUserLoggedIn,
      justCreatedSessionRef,
      userRole,
      userId: user?.id ?? null,
      isGenerating,
    });

  const { pdfStates, handleDownloadPDF } = useChatPdf({
    messages,
    sessions,
    currentSessionId,
    isUserLoggedIn,
    user,
    userRole,
  });

  const { docxStates, handleDownloadDocx } = useChatDocx({
    messages,
    sessions,
    currentSessionId,
    isUserLoggedIn,
    user,
  });

  const { speak, stop, pause, resume } = useTextToSpeech();

  const handleSend = useCallback(
    (
      text: string,
      img: string | null,
      fileText: string | null,
      fileMeta: string | null,
      isVoiceInput?: boolean,
      attachedFile?: File | null
    ) => {
      void sendMessage(text, img, fileText, fileMeta, isVoiceInput, attachedFile);
    },
    [sendMessage]
  );

  const handleRetry = useCallback(() => {
    void sendMessage("", null, null, null, undefined, null, true);
  }, [sendMessage]);

  const handleStop = useCallback(() => {
    stopGenerating();
    cancelPolling();
  }, [stopGenerating, cancelPolling]);

  const lastMsg = messages[messages.length - 1];
  const isLatestStreaming = lastMsg?.role === "model" && lastMsg?.status === "streaming";

  const effectiveIsGenerating = isGenerating || isPolling || isLatestStreaming;
  const effectiveIsLoading =
    isLoading || (isPolling && !isLatestStreaming) || (isLatestStreaming && !lastMsg?.content);

  // Sync speech actions to Zustand (actions don't change frequently)
  useEffect(() => {
    useChatStore.getState().setSpeechActions({ speak, stop, pause, resume });
  }, [speak, stop, pause, resume]);

  // Sync Download state to Zustand
  useEffect(() => {
    useChatStore.getState().setDownloadState({
      pdfStates,
      docxStates,
      handleDownloadPDF,
      handleDownloadDocx,
    });
  }, [pdfStates, docxStates, handleDownloadPDF, handleDownloadDocx]);

  // Sync retry action to Zustand
  useEffect(() => {
    useChatStore.getState().setOnRetry(handleRetry);
    return () => {
      useChatStore.getState().setOnRetry(null);
    };
  }, [handleRetry]);

  const wasGeneratingRef = useRef(false);

  // Auto-play TTS for voice input when assistant response is fully received
  useEffect(() => {
    if (isGenerating) {
      wasGeneratingRef.current = true;
    } else if (wasGeneratingRef.current) {
      wasGeneratingRef.current = false;
      if (messages.length >= 2) {
        const lastMsg = messages[messages.length - 1];
        const secondLastMsg = messages[messages.length - 2];
        if (
          lastMsg &&
          lastMsg.role === "model" &&
          secondLastMsg &&
          secondLastMsg.role === "user" &&
          secondLastMsg.isVoiceInput &&
          lastMsg.content &&
          !lastMsg.isImage
        ) {
          speak(lastMsg.id, lastMsg.content);
        }
      }
    }
  }, [isGenerating, messages, speak]);

  // Stop speaking when currentSessionId changes or component unmounts
  useEffect(() => {
    stop();
    return () => {
      stop();
    };
  }, [currentSessionId, stop]);

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

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    isFirstScrollRef.current = true;
  }, [currentSessionId]);

  useEffect(() => {
    const prevIsLoading = prevIsLoadingRef.current;
    prevIsLoadingRef.current = isLoading;

    if (messages.length === 0) {
      lastMessageIdRef.current = null;
      lastMessageContentRef.current = null;
      return;
    }

    const lastMsg = messages[messages.length - 1];
    const prevLastMsgId = lastMessageIdRef.current;
    const prevLastMsgContent = lastMessageContentRef.current;

    lastMessageIdRef.current = lastMsg.id;
    lastMessageContentRef.current = lastMsg.content || "";

    const isFirst = isFirstScrollRef.current;
    if (isFirst) {
      scrollToBottom("instant");
      isFirstScrollRef.current = false;
    } else {
      const isNewMessage = prevLastMsgId !== null && lastMsg.id !== prevLastMsgId;
      const isStreaming =
        prevLastMsgId !== null &&
        lastMsg.id === prevLastMsgId &&
        lastMsg.role === "model" &&
        (lastMsg.content || "") !== prevLastMsgContent;
      const startedLoading = isLoading && !prevIsLoading;

      if (isNewMessage || isStreaming || startedLoading) {
        scrollToBottom("smooth");
      }
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
        {isSessionLoading && messages.length === 0 && currentSessionId ? (
          <ChatSkeleton />
        ) : messages.length === 0 ? (
          <ChatSuggestions suggestions={suggestions} onSelectSuggestion={handleSelectSuggestion} />
        ) : (
          <ChatMessageList
            messages={messages}
            isLoading={effectiveIsLoading}
            loadingText={loadingText}
            messagesEndRef={messagesEndRef}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
          />
        )}

        <ChatFooter
          ref={chatFooterRef}
          onSend={handleSend}
          onStop={handleStop}
          isLoading={effectiveIsGenerating}
          isAuthLoading={isLoadingAuth}
          currentSessionId={currentSessionId}
        />
      </main>
    </div>
  );
}
