"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { downloadPdfBlob, downloadPdfFromUrl, generatePdfBlob } from "@/hooks/shared/pdf-helper";
import { uploadFileToStorage, saveGeneratedMaterial } from "@/lib/services/shared/chat.actions";
import { Message, UserRole, ChatSession } from "@/types/common";
import { getUniqueStoragePath, cleanFileName } from "./chat-utils";

interface UseChatPdfArgs {
  messages: Message[];
  sessions: ChatSession[];
  currentSessionId: string | null;
  isUserLoggedIn: boolean;
  user: User | null;
  userRole: UserRole | null;
}

export function useChatPdf({
  messages,
  sessions,
  currentSessionId,
  isUserLoggedIn,
  user,
  userRole,
}: UseChatPdfArgs) {
  const [pdfStates, setPdfStates] = useState<
    Record<string, "idle" | "generating" | "uploading" | "downloading" | "success" | "error">
  >({});

  const handleDownloadPDF = useCallback(
    async (messageId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      // Prevent concurrent download requests for the same message
      if (
        pdfStates[messageId] &&
        pdfStates[messageId] !== "idle" &&
        pdfStates[messageId] !== "error"
      ) {
        return;
      }

      const session = sessions.find((s) => s.id === currentSessionId);
      const baseName = message.suggestedTitle
        ? cleanFileName(message.suggestedTitle)
        : session
          ? cleanFileName(session.title)
          : `learning-${messageId.slice(0, 5)}`;
      const downloadFileName = `${baseName}.pdf`;

      // 1. Direct Download from stored attachment URL
      if (message.attachmentUrl) {
        setPdfStates((prev) => ({ ...prev, [messageId]: "downloading" }));
        const toastId = toast.loading("Downloading PDF...");
        try {
          const targetUrl = message.attachmentUrl;
          await downloadPdfFromUrl(targetUrl, downloadFileName);
          setPdfStates((prev) => ({ ...prev, [messageId]: "success" }));
          toast.success("PDF downloaded successfully! 🚀", { id: toastId });
          setTimeout(() => {
            setPdfStates((prev) => ({ ...prev, [messageId]: "idle" }));
          }, 3000);
        } catch (err) {
          console.error("Direct download failed, opening in new tab:", err);
          const targetUrl = message.attachmentUrl;
          window.open(targetUrl, "_blank");
          setPdfStates((prev) => ({ ...prev, [messageId]: "success" }));
          toast.success("Opening PDF in a new tab...", { id: toastId });
          setTimeout(() => {
            setPdfStates((prev) => ({ ...prev, [messageId]: "idle" }));
          }, 3000);
        }
        return;
      }

      // 2. Dynamic generation under @react-pdf/renderer
      const toastId = toast.loading("Preparing learning material...");
      try {
        setPdfStates((prev) => ({ ...prev, [messageId]: "generating" }));
        toast.loading("Generating beautiful layout...", { id: toastId });

        const resolvedRole = (
          message.pdfTheme === "clean" ? "parent" : message.pdfTheme || userRole || "kid"
        ) as UserRole;

        // Lazily loads @react-pdf/renderer & PdfDocument, performs rendering of blocks, paragraphs, and list AST nodes
        const blob = await generatePdfBlob(message.pdfContent || message.content, resolvedRole);

        setPdfStates((prev) => ({ ...prev, [messageId]: "downloading" }));
        toast.loading("Pushing document to browser...", { id: toastId });

        downloadPdfBlob(blob, downloadFileName);

        setPdfStates((prev) => ({ ...prev, [messageId]: "success" }));
        toast.success("PDF downloaded successfully! 🚀", { id: toastId });

        // Upload to storage if not already there (runs asynchronously in the background)
        if (currentSessionId && isUserLoggedIn && !message.pdfContent?.startsWith("http")) {
          if (user?.id) {
            const storageFileName = getUniqueStoragePath(user.id, currentSessionId, "pdf", "pdf");
            const uploadWithRetry = async (retries = 3, delay = 1000) => {
              try {
                const storageUrl = await uploadFileToStorage(blob, storageFileName, user.id);
                await saveGeneratedMaterial(
                  currentSessionId,
                  "pdf",
                  "application/pdf",
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
                    `Background PDF upload failed, retrying in ${delay}ms... (${retries} retries left):`,
                    uploadErr
                  );
                  setTimeout(() => {
                    void uploadWithRetry(retries - 1, delay * 2);
                  }, delay);
                } else {
                  console.error("Background PDF upload failed after multiple attempts:", uploadErr);
                }
              }
            };
            void uploadWithRetry();
          }
        }

        setTimeout(() => {
          setPdfStates((prev) => ({ ...prev, [messageId]: "idle" }));
        }, 3000);
      } catch (error) {
        console.error("PDF generation failed:", error);
        setPdfStates((prev) => ({ ...prev, [messageId]: "error" }));
        toast.error("Failed to generate PDF. Please try again.", { id: toastId });
        setTimeout(() => {
          setPdfStates((prev) => ({ ...prev, [messageId]: "idle" }));
        }, 3000);
      }
    },
    [messages, pdfStates, sessions, currentSessionId, isUserLoggedIn, user, userRole]
  );

  return { pdfStates, handleDownloadPDF };
}
