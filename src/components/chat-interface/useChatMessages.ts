"use client";

import { useEffect, useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setMessages } from "@/store/slice/chat.slice";
import { fetchSessionMessages } from "@/actions/chat.actions";
import { getParentSessionMessages } from "@/actions/dashboard.actions";
import { Message, ChatMessageRow } from "@/types/chat.types";

// Global client-side message cache for instant chat switching
const messagesCache = new Map<string, Message[]>();

interface UseChatMessagesArgs {
  currentSessionId: string | null;
  messages: Message[];
  isLoadingAuth: boolean;
  isUserLoggedIn: boolean;
  justCreatedSessionRef: React.MutableRefObject<boolean>;
  userRole?: string | null;
}

export function useChatMessages({
  currentSessionId,
  messages,
  isLoadingAuth,
  isUserLoggedIn,
  justCreatedSessionRef,
  userRole,
}: UseChatMessagesArgs) {
  const dispatch = useAppDispatch();
  const [isSessionLoading, setIsSessionLoading] = useState(false);

  // Clear message cache on logout
  useEffect(() => {
    if (!isUserLoggedIn) {
      messagesCache.clear();
    }
  }, [isUserLoggedIn]);

  // Keep cache synced with Redux messages state
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      messagesCache.set(currentSessionId, messages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Sync and load messages based on Redux currentSessionId with Stale-While-Revalidate caching and race-condition safety
  useEffect(() => {
    let active = true;

    const loadMessages = async () => {
      // 1. Return early if authentication is still loading to avoid RLS race conditions
      if (isLoadingAuth) {
        setIsSessionLoading(false);
        return;
      }

      // 2. Handle new/empty chat session
      if (!currentSessionId) {
        dispatch(setMessages([]));
        setIsSessionLoading(false);
        return;
      }

      // 3. Skip database fetch and UI clearing if we just created this session locally
      if (justCreatedSessionRef.current) {
        justCreatedSessionRef.current = false;
        setIsSessionLoading(false);
        return;
      }

      // 4. Try loading from cache instantly (Stale-While-Revalidate pattern)
      let hasCache = false;
      if (messagesCache.has(currentSessionId)) {
        const cached = messagesCache.get(currentSessionId);
        if (cached) {
          dispatch(setMessages(cached));
          hasCache = true;
        }
      }

      // If not in cache, clear messages and show the premium skeleton loader
      if (!hasCache) {
        dispatch(setMessages([]));
        setIsSessionLoading(true);
      }

      // 5. Fetch fresh messages from Supabase DB (either to populate cache or revalidate it)
      try {
        let dbMessages;
        if (userRole === "parent") {
          dbMessages = await getParentSessionMessages(currentSessionId);
        } else {
          dbMessages = await fetchSessionMessages(currentSessionId);
        }

        // If this effect run was cleaned up in the meantime (e.g., user clicked another chat), ignore result
        if (!active) {
          return;
        }

        const mappedMessages: Message[] = dbMessages.map((m: ChatMessageRow) => {
          const isImage =
            m.content.includes("supabase.co/storage/") ||
            m.content.startsWith("data:image/") ||
            m.content.includes("pollinations.ai") ||
            m.attachment_url?.includes("image/") ||
            m.attachment_url?.includes("_image_") ||
            /\.(jpg|jpeg|png|webp|gif)$/i.test(m.attachment_url || "");

          let isPdf =
            m.attachment_url?.includes(".pdf") ||
            (m.content.includes("pdf/") && m.content.includes(".pdf")) ||
            m.content.includes("<!-- OVERVIEW -->");

          // Extract embedded file name if present (format: [File: filename.ext] content)
          let content = m.content;
          let fileName: string | null = null;
          const fileMatch = content.match(/^\[File:\s*([^\]]+)\]\s*([\s\S]*)/);
          if (fileMatch) {
            fileName = fileMatch[1];
            content = fileMatch[2];
          }

          let pdfContent = content;
          let suggestedTitle: string | undefined = undefined;
          let pdfTheme: Message["pdfTheme"] = undefined;

          if (content.includes("<!-- OVERVIEW -->")) {
            const parts = content.split("<!-- OVERVIEW -->");
            pdfContent = parts[0].trim();
            let rest = parts[1];

            // Parse title
            const titleMatch = rest.match(/<!-- TITLE:(.*?) -->/);
            if (titleMatch) {
              suggestedTitle = titleMatch[1].trim() || undefined;
              rest = rest.replace(/<!-- TITLE:(.*?) -->/, "");
            }

            // Parse theme
            const themeMatch = rest.match(/<!-- THEME:(.*?) -->/);
            if (themeMatch) {
              pdfTheme = (themeMatch[1].trim() as Message["pdfTheme"]) || undefined;
              rest = rest.replace(/<!-- THEME:(.*?) -->/, "");
            }

            content = rest.trim();
            isPdf = true;
          }

          return {
            id: m.id,
            role: (m.sender_role as string) === "assistant" ? "model" : m.sender_role,
            content: content,
            isImage,
            isPdfRequest: isPdf,
            pdfContent: pdfContent,
            suggestedTitle: suggestedTitle,
            pdfTheme: pdfTheme,
            attachmentUrl: m.attachment_url,
            fileName: fileName,
            uploadedImage:
              m.sender_role === "user" && isImage ? m.attachment_url || content : undefined,
          };
        });

        // Compare if data changed before dispatching to avoid unnecessary rerenders
        const cachedMessages = messagesCache.get(currentSessionId);
        const hasDataChanged =
          !cachedMessages || JSON.stringify(cachedMessages) !== JSON.stringify(mappedMessages);

        if (hasDataChanged) {
          dispatch(setMessages(mappedMessages));
          messagesCache.set(currentSessionId, mappedMessages);
        } else {
        }
      } catch (error) {
        console.error("[ChatInterface] Failed to fetch session messages from DB:", error);
      } finally {
        if (active) {
          setIsSessionLoading(false);
        }
      }
    };

    loadMessages();

    // Cleanup function runs when currentSessionId/auth states change or component unmounts
    return () => {
      active = false;
    };
  }, [currentSessionId, isLoadingAuth, isUserLoggedIn, dispatch, justCreatedSessionRef, userRole]);

  return { isSessionLoading };
}
