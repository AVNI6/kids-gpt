"use client";

import { useState } from "react";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { downloadPdfBlob, downloadPdfFromUrl, generatePdfBlob } from "@/utils/pdf-helper";
import { uploadFileToStorage, saveGeneratedMaterial } from "@/actions/chat.actions";
import { Message, UserRole, ChatSession } from "@/types/chat.types";
import { getUniqueStoragePath } from "./chat-utils";

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

  const handleDownloadPDF = async (messageId: string) => {
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

    const cleanFileName = (title: string) => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 30);
    };
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
        await downloadPdfFromUrl(message.attachmentUrl, downloadFileName);
        setPdfStates((prev) => ({ ...prev, [messageId]: "success" }));
        toast.success("PDF downloaded successfully! 🚀", { id: toastId });
        setTimeout(() => {
          setPdfStates((prev) => ({ ...prev, [messageId]: "idle" }));
        }, 3000);
      } catch (err) {
        console.error("Direct download failed, opening in new tab:", err);
        window.open(message.attachmentUrl, "_blank");
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
          uploadFileToStorage(blob, storageFileName, user.id)
            .then(async (storageUrl) => {
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
            })
            .catch((uploadErr) => {
              console.error("Background PDF upload failed:", uploadErr);
            });
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
  };

  return { pdfStates, handleDownloadPDF };
}
