// Groq API provider (fallback)

import { AIResponse, GeminiContent } from "../types";
import { aiLogger } from "../logger";

const GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
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
 * Maps text and image_url parameters natively to prevent silent multimodal data loss.
 */
function convertToGroqMessages(contents: GeminiContent[]): GroqMessage[] {
  return contents.map((c) => {
    const parts: Array<
      { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
    > = [];

    for (const p of c.parts) {
      if (p.text) {
        parts.push({ type: "text", text: p.text });
      }
      if (p.inlineData) {
        parts.push({
          type: "image_url",
          image_url: {
            url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`,
          },
        });
      }
    }

    // Collapse to string if no images exist for backward compatibility and performance
    const content = parts.some((p) => p.type === "image_url")
      ? parts
      : parts.map((p) => (p.type === "text" ? p.text : "")).join("\n");

    return {
      role: c.role === "model" ? "assistant" : "user",
      content,
    } as GroqMessage;
  });
}

export async function callGroq(
  model: string,
  apiKey: string,
  contents: GeminiContent[],
  systemPrompt?: string,
  signal?: AbortSignal,
  timeout: number = 35000,
  responseFormat?: { type: string }
): Promise<AIResponse> {
  aiLogger.info("Groq", `Calling model: ${model}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const abortHandler = () => controller.abort();
  if (signal) {
    signal.addEventListener("abort", abortHandler);
  }

  const messages: GroqMessage[] = [];
  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }
  messages.push(...convertToGroqMessages(contents));

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
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    aiLogger.error("Groq", `Failed with ${model}`, {
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener("abort", abortHandler);
    }
  }
}
