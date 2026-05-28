// Context window memory management

import { GeminiContent } from "./types";
import { aiLogger } from "./logger";

const MAX_HISTORY_MESSAGES = 15;
const MAX_TOKEN_BUDGET = 8000;
const CHARS_PER_TOKEN = 4; // Approximation

interface HistoryMessage {
  role: string;
  content: string;
  image?: string;
  generatedImage?: string;
}

interface InlineData {
  mimeType: string;
  data: string;
}

/**
 * Parses a base64 data URL or a plain base64 string into an InlineData object.
 * Returns null if the input is not a valid base64 payload (e.g. it is a remote URL).
 */
function parseBase64InlineData(raw: string): InlineData | null {
  if (raw.startsWith("data:")) {
    const parts = raw.split(",");
    if (parts.length === 2) {
      const mimeType = parts[0].split(":")[1]?.split(";")[0] ?? "image/png";
      const data = parts[1];
      return { mimeType, data };
    }
    return null;
  }

  // Plain base64 string (no data URL prefix)
  if (!raw.startsWith("http") && !raw.startsWith("blob") && !raw.startsWith("/")) {
    return { mimeType: "image/png", data: raw };
  }

  return null; // It is a remote URL — requires async fetch
}

/**
 * Fetches a remote image URL and returns its InlineData (base64 + mimeType).
 * Wraps the fetch in a try/catch so a failed or expired image URL never crashes
 * the request. Returns null on any failure.
 */
async function fetchRemoteImageAsInlineData(url: string): Promise<InlineData | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!res.ok) {
      aiLogger.warn("ContextWindow", `Failed to fetch generated image: HTTP ${res.status}`, {
        url,
      });
      return null;
    }

    const contentType = res.headers.get("content-type") ?? "image/png";
    const mimeType = contentType.split(";")[0].trim();
    const arrayBuffer = await res.arrayBuffer();
    const data = Buffer.from(arrayBuffer).toString("base64");

    return { mimeType, data };
  } catch (err) {
    aiLogger.warn(
      "ContextWindow",
      "Generated image fetch failed — skipping visual context injection",
      {
        url,
        error: err instanceof Error ? err.message : String(err),
      }
    );
    return null;
  }
}

/**
 * Resolves any image string (data URL, base64, or remote URL) to an InlineData object.
 * Returns null if it cannot be resolved.
 */
async function buildInlineData(raw: string): Promise<InlineData | null> {
  const parsed = parseBase64InlineData(raw);
  if (parsed) return parsed;

  // Must be a remote URL — attempt async fetch
  if (raw.startsWith("http") || raw.startsWith("//")) {
    return fetchRemoteImageAsInlineData(raw);
  }

  return null;
}

/**
 * Trim messages to stay within the token budget while preserving the most recent context.
 * Always keeps the latest messages and drops oldest first, prioritizing preserving image-bearing turns.
 */
export function trimMessages(
  messages: HistoryMessage[],
  maxMessages: number = MAX_HISTORY_MESSAGES,
  maxTokenBudget: number = MAX_TOKEN_BUDGET
): HistoryMessage[] {
  // Find the index of the most recent image-bearing message
  const mostRecentImageIdx = messages.map((m) => !!(m.image || m.generatedImage)).lastIndexOf(true);

  let trimmed: HistoryMessage[];

  if (mostRecentImageIdx !== -1 && messages.length > maxMessages) {
    const sliceStart = messages.length - maxMessages;
    if (mostRecentImageIdx < sliceStart) {
      // Image turn would be trimmed out — keep it by pinning it to the head
      const imageMsg = messages[mostRecentImageIdx];
      const recentMsgs = messages.slice(-(maxMessages - 1));
      trimmed = [imageMsg, ...recentMsgs];
    } else {
      trimmed = messages.slice(-maxMessages);
    }
  } else {
    trimmed = messages.slice(-maxMessages);
  }

  // Limit by approximate token count — protect image-bearing turns from early eviction
  let totalChars = trimmed.reduce((sum, m) => sum + m.content.length, 0);
  const maxChars = maxTokenBudget * CHARS_PER_TOKEN;

  while (trimmed.length > 1 && totalChars > maxChars) {
    if (
      (trimmed[0].image || trimmed[0].generatedImage) &&
      trimmed.some((m) => !m.image && !m.generatedImage)
    ) {
      const nonImageIdx = trimmed.findIndex((m) => !m.image && !m.generatedImage);
      if (nonImageIdx !== -1) {
        const removed = trimmed.splice(nonImageIdx, 1)[0];
        totalChars -= removed.content.length;
        continue;
      }
    }

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
 * This is async because it may need to fetch remote generated image URLs and convert them to base64.
 */
export async function buildGeminiContents(
  history: HistoryMessage[],
  currentMessage: string,
  image?: string
): Promise<GeminiContent[]> {
  const contents: GeminiContent[] = [];

  // Trim history to fit within budget
  const trimmedHistory = trimMessages(history);

  for (const msg of trimmedHistory) {
    const parts: Array<{ text?: string; inlineData?: InlineData }> = [{ text: msg.content }];

    // 1. Attach user-uploaded image inline data
    if (msg.role === "user" && msg.image) {
      const inlineData = await buildInlineData(msg.image);
      if (inlineData) {
        parts.push({ inlineData });
      }
    }

    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts,
    });

    // 2. Inject AI-generated image back as a simulated user turn
    // This lets the model "see" what it previously generated for follow-up analysis
    if ((msg.role === "model" || msg.role === "assistant") && msg.generatedImage) {
      const inlineData = await buildInlineData(msg.generatedImage);
      if (inlineData) {
        contents.push({
          role: "user",
          parts: [
            {
              text: "[System: This is the image you generated in the previous turn. Use this visual context for analysis.]",
            },
            { inlineData },
          ],
        });
      }
    }
  }

  // Build current user message parts
  const currentParts: Array<{ text?: string; inlineData?: InlineData }> = [
    { text: currentMessage },
  ];

  // Attach current-turn image if provided
  if (image) {
    const inlineData = await buildInlineData(image);
    if (inlineData) {
      currentParts.push({ inlineData });
    }
  }

  contents.push({
    role: "user",
    parts: currentParts,
  });

  return contents;
}
