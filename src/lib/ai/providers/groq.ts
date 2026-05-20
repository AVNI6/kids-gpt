// Groq API provider (fallback)

import { AIResponse, GeminiContent } from "../types";
import { aiLogger } from "../logger";

const GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
    type?: string;
  };
}

/**
 * Convert Gemini-format contents to OpenAI-compatible messages.
 */
function convertToGroqMessages(contents: GeminiContent[]): GroqMessage[] {
  return contents.map((c) => {
    const textParts = c.parts
      .filter((p) => p.text)
      .map((p) => p.text!)
      .join("\n");

    return {
      role: c.role === "model" ? "assistant" : c.role === "user" ? "user" : "system",
      content: textParts,
    } as GroqMessage;
  });
}

export async function callGroq(
  model: string,
  apiKey: string,
  contents: GeminiContent[],
  signal?: AbortSignal,
  timeout: number = 30000,
  responseFormat?: { type: string }
): Promise<AIResponse> {
  aiLogger.info("Groq", `Calling model: ${model}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const messages = convertToGroqMessages(contents);

  try {
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    };

    if (responseFormat) {
      body.response_format = responseFormat;
    }

    const response = await fetch(GROQ_API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      const status = response.status;

      if (status === 429) {
        const err = new Error(`Groq rate limited on ${model}`) as Error & { status: number };
        err.status = 429;
        throw err;
      }

      throw new Error(`Groq API error (${status}): ${errorBody}`);
    }

    const data: GroqResponse = await response.json();

    if (data.error) {
      throw new Error(`Groq error: ${data.error.message}`);
    }

    const text = data.choices?.[0]?.message?.content || "";

    if (!text) {
      throw new Error(`Groq returned empty response from ${model}`);
    }

    aiLogger.info("Groq", `Success with ${model}`, {
      tokens: data.usage?.total_tokens,
    });

    return {
      success: true,
      provider: "groq",
      model,
      content: text,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      fallbackUsed: true,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    aiLogger.error("Groq", `Failed with ${model}`, {
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}
