import { ChatRequestBody } from "@/types/common";
import { ChatMode } from "../prompts";

export function extractUserQuery(message: string): string {
  if (!message) return "";

  let query = message;

  // Case 1: Combined format from frontend send: "userPrompt\n\n[Attachment: filename]\nfileContent"
  if (query.includes("\n\n[Attachment:")) {
    query = query.split("\n\n[Attachment:")[0];
  }

  // Case 2: DB loaded format: "[File: filename] userPrompt"
  const dbFileMatch = query.match(/^\[File:\s*[^\]]+\]\s*([\s\S]*)/);
  if (dbFileMatch) {
    query = dbFileMatch[1];
  }

  return query.trim();
}

export function getConversationText(
  message: string,
  history: ChatRequestBody["history"] = []
): string {
  const query = extractUserQuery(message);
  return [query, ...(history || []).map((entry) => extractUserQuery(entry.content || ""))]
    .join("\n")
    .toLowerCase();
}

export function isQuizMode(message: string, history: ChatRequestBody["history"] = []): boolean {
  const text = getConversationText(message, history);
  return /start\s+quiz|quiz\s+mode|quiz me|ask me one question at a time|one question at a time|begin quiz/i.test(
    text
  );
}

export function isStopCommand(message: string): boolean {
  const query = extractUserQuery(message);
  return /^(stop|exit|quit|end quiz|end|stop quiz)$/i.test(query);
}

export function isPdfRequest(message: string): boolean {
  const query = extractUserQuery(message);

  // PDF request requires a creation keyword in present/future tense (NOT past tense like generated/created)
  // Ensure we match "generate/create/make/build/download/export" but NOT "generated/created/made/built/downloaded"
  const hasCreation = /\b(generate|create|make|build|download|export|write)\b/i.test(query);
  const hasPdf = /\bpdf\b/i.test(query);
  const hasAnalysisVerb =
    /\b(analyze|analyse|summarize|explain|review|detail|details|discuss)\b/i.test(query);

  // If the query contains "analyze" + "pdf" but no creation verb, it's an analysis request!
  if (hasPdf && hasAnalysisVerb && !hasCreation) {
    return false;
  }

  return hasPdf && hasCreation;
}

export function isDocumentAnalysis(
  message: string,
  history: ChatRequestBody["history"] = []
): boolean {
  const query = extractUserQuery(message);

  // Checks if there is a file in the current turn OR if there was a PDF/file in history
  const hasCurrentAttachment = message.includes("[Attachment:") || message.includes("[File:");
  const hasHistoryAttachment = (history || []).some(
    (h) =>
      h.content?.includes("[Attachment:") ||
      h.content?.includes("[File:") ||
      h.content?.includes("<!-- OVERVIEW -->")
  );
  const hasAttachment = hasCurrentAttachment || hasHistoryAttachment;

  // Broaden document analysis query detection to support common phrases like "tell me what it says", "what is this", "what does it say"
  const hasAnalysisKeywords =
    /analyze|summarize|explain|tell me|what is|what's|read|outline|extract|review|what does it say|detail|details/i.test(
      query
    );
  const hasPdfOrDocKeyword = /pdf|document|file|material|text/i.test(query);

  return hasAttachment && (hasAnalysisKeywords || hasPdfOrDocKeyword);
}

export function deriveChatMode(
  message: string,
  history: ChatRequestBody["history"] = []
): ChatMode {
  if (isPdfRequest(message)) {
    return "pdf";
  }
  if (isDocumentAnalysis(message, history)) {
    return "document_analysis";
  }
  if (isQuizMode(message, history)) {
    return "quiz";
  }
  return "chat";
}
