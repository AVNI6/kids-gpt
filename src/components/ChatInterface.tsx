"use client";

import { useState, useEffect, useRef } from "react";
import ChatFooter from "./chat-interface/ChatFooter";
import ChatMessageList from "./chat-interface/ChatMessageList";
import ChatSuggestions from "./chat-interface/ChatSuggestions";
import ChatSkeleton from "./chat-interface/ChatSkeleton";
import ChatHeader from "./chat-interface/ChatHeader";
import { useChatMessages } from "./chat-interface/useChatMessages";
import { useChatPdf } from "./chat-interface/useChatPdf";
import { useChatSender } from "./chat-interface/useChatSender";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCurrentSessionId } from "@/store/slice/chat.slice";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/components/ui/sidebar";
import { getSessionManager } from "@/lib/ai/session-manager";
import { useSearchParams } from "next/navigation";

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

  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const { toggleSidebar, openMobile } = useSidebar();
  const { user, isUserLoggedIn, userRole, isLoading: isLoadingAuth } = useAuth();

  const { isSessionLoading } = useChatMessages({
    currentSessionId,
    messages,
    isLoadingAuth,
    isUserLoggedIn,
    justCreatedSessionRef,
  });

  const { pdfStates, handleDownloadPDF } = useChatPdf({
    messages,
    sessions,
    currentSessionId,
    isUserLoggedIn,
    user,
    userRole,
  });

  const { isLoading, sendMessage } = useChatSender({
    messages,
    currentSessionId,
    isUserLoggedIn,
    user,
    userRole,
    input,
    image,
    fileContent,
    fileName,
    setInput,
    setImage,
    setFileContent,
    setFileName,
    justCreatedSessionRef,
  });

  // Clear staging states (images, files, inputs) on session / route change to prevent leakage
  useEffect(() => {
    const timer = setTimeout(() => {
      setImage(null);
      setFileContent(null);
      setFileName(null);
      setInput("");
    }, 0);
    return () => clearTimeout(timer);
  }, [currentSessionId]);

  // Sync URL search parameter id to Redux reactively
  useEffect(() => {
    if (urlSessionId !== currentSessionId) {
      console.log(
        "[ChatInterface] Syncing Redux currentSessionId to match URL search param:",
        urlSessionId
      );
      dispatch(setCurrentSessionId(urlSessionId));
    }
  }, [urlSessionId, currentSessionId, dispatch]);

  // Abort in-flight requests when component unmounts
  useEffect(() => {
    return () => {
      getSessionManager().abortActiveRequest();
    };
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Reset scroll speed on session change
  useEffect(() => {
    isFirstScrollRef.current = true;
  }, [currentSessionId]);

  // Scroll to bottom whenever messages update; use instant on first load of a session
  useEffect(() => {
    if (messages.length === 0) return;
    const isFirst = isFirstScrollRef.current;
    if (isFirst) {
      scrollToBottom("instant");
      isFirstScrollRef.current = false;
    } else {
      scrollToBottom("smooth");
    }
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-background overflow-hidden">
      <ChatHeader
        openMobile={openMobile}
        toggleSidebar={toggleSidebar}
        currentSessionId={currentSessionId}
      />

      <main className="flex-1 flex flex-col overflow-hidden min-h-0 bg-background">
        {isSessionLoading && messages.length === 0 ? (
          <ChatSkeleton />
        ) : messages.length === 0 ? (
          <ChatSuggestions suggestions={suggestions} onSelectSuggestion={setInput} />
        ) : (
          <ChatMessageList
            messages={messages}
            isLoading={isLoading}
            pdfStates={pdfStates}
            handleDownloadPDF={handleDownloadPDF}
            messagesEndRef={messagesEndRef}
          />
        )}

        <ChatFooter
          input={input}
          setInput={setInput}
          onSend={sendMessage}
          isLoading={isLoading}
          image={image}
          setImage={setImage}
          setFileContent={setFileContent}
          setFileName={setFileName}
          fileName={fileName}
        />
      </main>
    </div>
  );
}
