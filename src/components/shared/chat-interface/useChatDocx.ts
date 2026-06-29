"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import {
  downloadDocxBlob,
  downloadDocxFromUrl,
  generateDocxBlob,
} from "@/hooks/shared/docx-helper";
import { uploadFileToStorage, saveGeneratedMaterial } from "@/lib/services/shared/chat.actions";
import { Message, ChatSession } from "@/types/common";
import { getUniqueStoragePath, cleanFileName } from "./chat-utils";

interface UseChatDocxArgs {
  messages: Message[];
  sessions: ChatSession[];
  currentSessionId: string | null;
  isUserLoggedIn: boolean;
  user: User | null;
}

export function useChatDocx({
  messages,
  sessions,
  currentSessionId,
  isUserLoggedIn,
  user,
}: UseChatDocxArgs) {
  const [docxStates, setDocxStates] = useState<
    Record<string, "idle" | "generating" | "uploading" | "downloading" | "success" | "error">
  >({});

  const handleDownloadDocx = useCallback(
    async (messageId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      // Prevent concurrent download requests for the same message
      if (
        docxStates[messageId] &&
        docxStates[messageId] !== "idle" &&
        docxStates[messageId] !== "error"
      ) {
        return;
      }

      const session = sessions.find((s) => s.id === currentSessionId);
      const baseName = message.suggestedTitle
        ? cleanFileName(message.suggestedTitle)
        : session
          ? cleanFileName(session.title)
          : `learning-${messageId.slice(0, 5)}`;
      const downloadFileName = `${baseName}.docx`;

      // 1. Direct Download from stored attachment URL
      if (message.attachmentUrl) {
        setDocxStates((prev) => ({ ...prev, [messageId]: "downloading" }));
        const toastId = toast.loading("Downloading Word Document...");
        try {
          let targetUrl = message.attachmentUrl;
          if (targetUrl.includes("/object/public/materials/")) {
            const relativePath = targetUrl.split("/object/public/materials/")[1];
            const { getSignedResourceUrl } = await import("@/lib/services/shared/storage.actions");
            const result = await getSignedResourceUrl(relativePath);
            if (result.success && result.url) {
              targetUrl = result.url;
            } else {
              throw new Error(result.error || "Failed to generate signed URL");
            }
          }
          await downloadDocxFromUrl(targetUrl, downloadFileName);
          setDocxStates((prev) => ({ ...prev, [messageId]: "success" }));
          toast.success("Document downloaded successfully! 🚀", { id: toastId });
          setTimeout(() => {
            setDocxStates((prev) => ({ ...prev, [messageId]: "idle" }));
          }, 3000);
        } catch (err) {
          console.error("Direct download failed, opening in new tab:", err);
          let targetUrl = message.attachmentUrl;
          if (targetUrl.includes("/object/public/materials/")) {
            try {
              const relativePath = targetUrl.split("/object/public/materials/")[1];
              const { getSignedResourceUrl } =
                await import("@/lib/services/shared/storage.actions");
              const result = await getSignedResourceUrl(relativePath);
              if (result.success && result.url) {
                targetUrl = result.url;
              }
            } catch {
              // fallback to original if signed request fails
            }
          }
          window.open(targetUrl, "_blank");
          setDocxStates((prev) => ({ ...prev, [messageId]: "success" }));
          toast.success("Opening Document in a new tab...", { id: toastId });
          setTimeout(() => {
            setDocxStates((prev) => ({ ...prev, [messageId]: "idle" }));
          }, 3000);
        }
        return;
      }

      // 2. Dynamic generation using the `docx` library helper
      const toastId = toast.loading("Preparing learning material...");
      try {
        setDocxStates((prev) => ({ ...prev, [messageId]: "generating" }));
        toast.loading("Generating Word document structure...", { id: toastId });

        const blob = await generateDocxBlob(message.docContent || message.content);

        setDocxStates((prev) => ({ ...prev, [messageId]: "downloading" }));
        toast.loading("Pushing document to browser...", { id: toastId });

        downloadDocxBlob(blob, downloadFileName);

        setDocxStates((prev) => ({ ...prev, [messageId]: "success" }));
        toast.success("Word Document downloaded successfully! 🚀", { id: toastId });

        // Upload to storage if not already there (runs asynchronously in the background)
        if (currentSessionId && isUserLoggedIn && !message.docContent?.startsWith("http")) {
          if (user?.id) {
            const storageFileName = getUniqueStoragePath(user.id, currentSessionId, "docx", "doc");
            const uploadWithRetry = async (retries = 3, delay = 1000) => {
              try {
                const storageUrl = await uploadFileToStorage(blob, storageFileName, user.id);
                await saveGeneratedMaterial(
                  currentSessionId,
                  "doc",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  storageUrl,
                  {
                    originalMessageId: messageId,
                    tokens: Math.round(message.content.length / 4),
                  },
                  user.id
                );
              } catch (uploadErr) {
                if (retries > 0) {
                  console.warn(
                    `Background Word upload failed, retrying in ${delay}ms... (${retries} retries left):`,
                    uploadErr
                  );
                  setTimeout(() => {
                    void uploadWithRetry(retries - 1, delay * 2);
                  }, delay);
                } else {
                  console.error(
                    "Background Word upload failed after multiple attempts:",
                    uploadErr
                  );
                }
              }
            };
            void uploadWithRetry();
          }
        }

        setTimeout(() => {
          setDocxStates((prev) => ({ ...prev, [messageId]: "idle" }));
        }, 3000);
      } catch (error) {
        console.error("Word Document generation failed:", error);
        setDocxStates((prev) => ({ ...prev, [messageId]: "error" }));
        toast.error("Failed to generate Word Document. Please try again.", { id: toastId });
        setTimeout(() => {
          setDocxStates((prev) => ({ ...prev, [messageId]: "idle" }));
        }, 3000);
      }
    },
    [messages, docxStates, sessions, currentSessionId, isUserLoggedIn, user]
  );

  return { docxStates, handleDownloadDocx };
}
