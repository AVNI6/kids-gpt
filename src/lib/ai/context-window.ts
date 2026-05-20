// Context window memory management

import { GeminiContent } from "./types";
import { aiLogger } from "./logger";

const MAX_HISTORY_MESSAGES = 15;
const MAX_TOKEN_BUDGET = 8000;
const CHARS_PER_TOKEN = 4; // Approximation

interface HistoryMessage {
  role: string;
  content: string;
}

/**
 * Trim messages to stay within the token budget while preserving the most recent context.
 * Always keeps the latest messages and drops oldest first.
 */
export function trimMessages(
  messages: HistoryMessage[],
  maxMessages: number = MAX_HISTORY_MESSAGES,
  maxTokenBudget: number = MAX_TOKEN_BUDGET
): HistoryMessage[] {
  // First: limit by count
  const trimmed = messages.slice(-maxMessages);

  // Second: limit by approximate token count
  let totalChars = trimmed.reduce((sum, m) => sum + m.content.length, 0);
  const maxChars = maxTokenBudget * CHARS_PER_TOKEN;

  while (trimmed.length > 1 && totalChars > maxChars) {
    const removed = trimmed.shift();
    if (removed) {
      totalChars -= removed.content.length;
    }
  }

  aiLogger.debug("ContextWindow", `Trimmed to ${trimmed.length} messages`, {
    approximateTokens: Math.round(totalChars / CHARS_PER_TOKEN),
    maxBudget: maxTokenBudget,
  });

  return trimmed;
}

/**
 * Build the complete Gemini contents array from system prompt, history, and current message.
 */
export function buildGeminiContents(
  systemPrompt: string,
  history: HistoryMessage[],
  currentMessage: string,
  image?: string
): GeminiContent[] {
  const contents: GeminiContent[] = [];

  // Trim history to fit within budget
  const trimmedHistory = trimMessages(history);

  // Add history messages
  for (const msg of trimmedHistory) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }

  // Build current user message parts
  const currentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { text: `${systemPrompt}\n\nUser Question: ${currentMessage}` },
  ];

  // Add image if provided
  if (image) {
    let mimeType = "image/png";
    let base64Data = image;

    if (image.startsWith("data:")) {
      const parts = image.split(",");
      mimeType = parts[0].split(":")[1].split(";")[0];
      base64Data = parts[1];
    }

    currentParts.push({
      inlineData: {
        mimeType,
        data: base64Data,
      },
    });
  }

  contents.push({
    role: "user",
    parts: currentParts,
  });

  return contents;
}
