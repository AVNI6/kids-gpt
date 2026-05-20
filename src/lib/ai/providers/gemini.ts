// Gemini API provider

import { AIResponse, ProviderCallOptions } from "../types";
import { aiLogger } from "../logger";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

export async function callGemini(options: ProviderCallOptions): Promise<AIResponse> {
  const { model, apiKey, contents, generationConfig, signal, timeout = 30000 } = options;
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  aiLogger.info("Gemini", `Calling model: ${model}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Link external signal to our controller
  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      const status = response.status;

      if (status === 429) {
        const err = new Error(`Rate limited on ${model}`) as Error & { status: number };
        err.status = 429;
        throw err;
      }

      if (status === 403 || status === 401) {
        const err = new Error(`Auth error on ${model}: ${errorBody}`) as Error & { status: number };
        err.status = status;
        throw err;
      }

      throw new Error(`Gemini API error (${status}): ${errorBody}`);
    }

    const data: GeminiResponse = await response.json();

    if (data.error) {
      throw new Error(`Gemini error: ${data.error.message || data.error.status}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const usage = data.usageMetadata || {};

    if (!text) {
      throw new Error(`Gemini returned empty response from ${model}`);
    }

    aiLogger.info("Gemini", `Success with ${model}`, {
      tokens: usage.totalTokenCount,
    });

    return {
      success: true,
      provider: "gemini",
      model,
      content: text,
      usage: {
        promptTokens: usage.promptTokenCount || 0,
        completionTokens: usage.candidatesTokenCount || 0,
        totalTokens: usage.totalTokenCount || 0,
      },
      fallbackUsed: false,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof DOMException && error.name === "AbortError") {
      throw error; // Let abort propagate
    }

    aiLogger.error("Gemini", `Failed with ${model}`, {
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}
