import { AIResponse, GeminiContent } from "./types";
import type { JsonObject } from "@/types/json";
interface GeminiStreamRequestBody {
  contents: GeminiContent[];
  generationConfig?: JsonObject;
  systemInstruction?: { parts: Array<{ text: string }> };
}
import { callGemini } from "./providers/gemini";
import { callGroq } from "./providers/groq";
import { aiLogger } from "./logger";

// Gemini models in priority order (free-tier compatible)
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

// Groq fallback models
const GROQ_MODELS = ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "llama-3.1-8b-instant"];

// ===== KEY ROTATION =====

function getGeminiApiKeys(): string[] {
  const keys: string[] = [];
  const key1 = process.env.GOOGLE_GEMINI_API_KEY;
  const key2 = process.env.GOOGLE_GEMINI_API_KEY2;
  const key3 = process.env.GOOGLE_GEMINI_API_KEY3;

  if (key1) keys.push(key1);
  if (key2) keys.push(key2);
  if (key3) keys.push(key3);

  return keys;
}

function getGroqApiKey(): string | null {
  return process.env.GROQ_API_KEY || null;
}

// ===== ORCHESTRATOR OPTIONS =====

export interface OrchestratorOptions {
  contents: GeminiContent[];
  systemPrompt?: string;
  generationConfig?: JsonObject;
  signal?: AbortSignal;
  timeout?: number;
}

// ===== MAIN ORCHESTRATOR =====

export async function generateAIResponse(options: OrchestratorOptions): Promise<AIResponse> {
  const { contents, systemPrompt, generationConfig, signal, timeout = 35000 } = options;

  // Check abort before starting
  if (signal?.aborted) {
    throw new DOMException("Request aborted before start", "AbortError");
  }

  const geminiKeys = getGeminiApiKeys();
  const groqKey = getGroqApiKey();

  // Track all errors for comprehensive logging
  const errors: Array<{ provider: string; model: string; key: string; error: string }> = [];

  // ===== PHASE 1: Try all Gemini models with key rotation =====
  for (const model of GEMINI_MODELS) {
    for (let keyIndex = 0; keyIndex < geminiKeys.length; keyIndex++) {
      if (signal?.aborted) {
        throw new DOMException("Request aborted", "AbortError");
      }

      const apiKey = geminiKeys[keyIndex];
      const keyLabel = `key${keyIndex + 1}`;

      try {
        aiLogger.info("Orchestrator", `Trying Gemini: ${model} with ${keyLabel}`);

        const response = await callGemini({
          model,
          apiKey,
          contents,
          systemPrompt,
          generationConfig,
          signal,
          timeout,
        });

        aiLogger.info("Orchestrator", `Success: ${model} with ${keyLabel}`, {
          tokens: response.usage.totalTokens,
        });

        return response;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw error; // Propagate abort immediately
        }

        const errorMsg = error instanceof Error ? error.message : String(error);
        const status = (error as { status?: number })?.status;

        errors.push({ provider: "gemini", model, key: keyLabel, error: errorMsg });

        // Rate limited (429) → try next key
        if (status === 429 || errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
          aiLogger.warn("Orchestrator", `Rate limited: ${model} ${keyLabel}, trying next key`);
          continue;
        }

        // Auth error (401/403) → try next key
        if (status === 401 || status === 403) {
          aiLogger.warn("Orchestrator", `Auth error: ${model} ${keyLabel}, trying next key`);
          continue;
        }

        // Other transient/500/network error → try next key instead of breaking!
        aiLogger.warn(
          "Orchestrator",
          `Transient key failure on ${model} with ${keyLabel}, trying next key`,
          {
            error: errorMsg,
          }
        );
        continue;
      }
    }
  }

  // ===== PHASE 2: Fallback to Groq =====
  if (groqKey) {
    for (const model of GROQ_MODELS) {
      if (signal?.aborted) {
        throw new DOMException("Request aborted", "AbortError");
      }

      try {
        aiLogger.info("Orchestrator", `Falling back to Groq: ${model}`);

        const responseFormat =
          generationConfig?.responseMimeType === "application/json"
            ? { type: "json_object" }
            : undefined;

        const response = await callGroq(
          model,
          groqKey,
          contents,
          systemPrompt,
          signal,
          timeout,
          responseFormat
        );

        aiLogger.info("Orchestrator", `Groq success: ${model}`, {
          tokens: response.usage.totalTokens,
        });

        return { ...response, fallbackUsed: true };
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw error;
        }

        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push({ provider: "groq", model, key: "groq", error: errorMsg });

        aiLogger.warn("Orchestrator", `Groq failed: ${model}`, { error: errorMsg });
        continue;
      }
    }
  }

  // ===== ALL PROVIDERS FAILED =====
  aiLogger.error("Orchestrator", "All providers exhausted", {
    totalAttempts: errors.length,
    errors: errors.slice(-5), // Last 5 errors
  });

  const isTokenOrQuotaError = errors.some(
    (e) =>
      e.error.toLowerCase().includes("429") ||
      e.error.toLowerCase().includes("quota") ||
      e.error.toLowerCase().includes("exhausted") ||
      e.error.toLowerCase().includes("limit") ||
      e.error.toLowerCase().includes("403") ||
      e.error.toLowerCase().includes("401")
  );

  const fallbackMessage = isTokenOrQuotaError
    ? "I'm sorry, I have run out of daily tokens. Please try again after."
    : "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";

  return {
    success: false,
    provider: "gemini",
    model: "none",
    content: fallbackMessage,
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    fallbackUsed: true,
    error: `All ${errors.length} attempts failed. Last error: ${errors[errors.length - 1]?.error || "Unknown"}`,
  };
}

// ===== STREAM CHUNK PARSERS =====

async function* streamGeminiParts(response: Response): AsyncGenerator<string, void, void> {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let braceCount = 0;
      let inString = false;
      let startIdx = -1;

      for (let i = 0; i < buffer.length; i++) {
        const char = buffer[i];

        if (char === '"' && (i === 0 || buffer[i - 1] !== "\\")) {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === "{") {
            if (braceCount === 0) {
              startIdx = i;
            }
            braceCount++;
          } else if (char === "}") {
            braceCount--;
            if (braceCount === 0 && startIdx !== -1) {
              const objStr = buffer.slice(startIdx, i + 1);
              try {
                const parsed = JSON.parse(objStr);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  yield text;
                }
              } catch {
                const textMatch = objStr.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                if (textMatch && textMatch[1]) {
                  try {
                    yield JSON.parse(`"${textMatch[1]}"`);
                  } catch {
                    yield textMatch[1];
                  }
                }
              }
              buffer = buffer.slice(i + 1);
              i = -1;
              startIdx = -1;
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function* streamGroqParts(response: Response): AsyncGenerator<string, void, void> {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith("data: ")) {
          const dataStr = trimmed.substring(6);
          if (dataStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(dataStr);
            const text = parsed.choices?.[0]?.delta?.content || "";
            if (text) {
              yield text;
            }
          } catch {
            // Ignore partial parse failures
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ===== STREAMING ORCHESTRATOR =====

export async function generateAIResponseStream(
  options: OrchestratorOptions
): Promise<ReadableStream<Uint8Array>> {
  const { contents, systemPrompt, generationConfig, signal, timeout = 35000 } = options;

  if (signal?.aborted) {
    throw new DOMException("Request aborted before start", "AbortError");
  }

  const geminiKeys = getGeminiApiKeys();
  const groqKey = getGroqApiKey();

  // Try Gemini models with key rotation first
  for (const model of GEMINI_MODELS) {
    for (let keyIndex = 0; keyIndex < geminiKeys.length; keyIndex++) {
      if (signal?.aborted) {
        throw new DOMException("Request aborted", "AbortError");
      }

      const apiKey = geminiKeys[keyIndex];
      const keyLabel = `key${keyIndex + 1}`;

      try {
        aiLogger.info("OrchestratorStream", `Trying Gemini: ${model} with ${keyLabel}`);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const abortHandler = () => controller.abort();
        if (signal) signal.addEventListener("abort", abortHandler);

        const body: GeminiStreamRequestBody = {
          contents,
          generationConfig,
        };

        if (systemPrompt) {
          body.systemInstruction = {
            parts: [{ text: systemPrompt }],
          };
        }

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (signal) signal.removeEventListener("abort", abortHandler);

        if (!res.ok) {
          throw new Error(`Gemini status ${res.status}`);
        }

        return new ReadableStream({
          async start(controllerStream) {
            const encoder = new TextEncoder();
            try {
              for await (const text of streamGeminiParts(res)) {
                if (signal?.aborted) break;
                controllerStream.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
              controllerStream.enqueue(encoder.encode("data: [DONE]\n\n"));
            } catch (err) {
              aiLogger.error("OrchestratorStream", "Error reading Gemini stream", {
                error: String(err),
              });
            } finally {
              controllerStream.close();
            }
          },
        });
      } catch (error) {
        aiLogger.warn(
          "OrchestratorStream",
          `Gemini Stream failed: ${model} ${keyLabel}, trying next key/model`,
          { error: String(error) }
        );
        continue;
      }
    }
  }

  // Fallback to Groq streaming
  if (groqKey) {
    for (const model of GROQ_MODELS) {
      if (signal?.aborted) {
        throw new DOMException("Request aborted", "AbortError");
      }

      try {
        aiLogger.info("OrchestratorStream", `Falling back to Groq: ${model}`);

        const url = "https://api.groq.com/openai/v1/chat/completions";

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const abortHandler = () => controller.abort();
        if (signal) signal.addEventListener("abort", abortHandler);

        const groqMessages = contents.map((c) => {
          const parts: Array<
            { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
          > = [];

          for (const p of c.parts) {
            if (p.text) parts.push({ type: "text", text: p.text });
            if (p.inlineData) {
              parts.push({
                type: "image_url",
                image_url: { url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}` },
              });
            }
          }

          const content = parts.some((p) => p.type === "image_url")
            ? parts
            : parts.map((p) => (p.type === "text" ? p.text : "")).join("\n");

          return {
            role: c.role === "model" ? "assistant" : "user",
            content,
          };
        });

        const messages = [];
        if (systemPrompt) {
          messages.push({ role: "system", content: systemPrompt });
        }
        messages.push(...groqMessages);

        const body = {
          model,
          messages,
          temperature: 0.7,
          max_tokens: 4096,
          stream: true,
        };

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (signal) signal.removeEventListener("abort", abortHandler);

        if (!res.ok) {
          throw new Error(`Groq status ${res.status}`);
        }

        return new ReadableStream({
          async start(controllerStream) {
            const encoder = new TextEncoder();
            try {
              for await (const text of streamGroqParts(res)) {
                if (signal?.aborted) break;
                controllerStream.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
              controllerStream.enqueue(encoder.encode("data: [DONE]\n\n"));
            } catch (err) {
              aiLogger.error("OrchestratorStream", "Error reading Groq stream", {
                error: String(err),
              });
            } finally {
              controllerStream.close();
            }
          },
        });
      } catch (error) {
        aiLogger.warn("OrchestratorStream", `Groq Stream failed: ${model}, trying next`, {
          error: String(error),
        });
        continue;
      }
    }
  }

  // All providers failed -> Return standard fallback message stream
  return new ReadableStream({
    start(controllerStream) {
      const encoder = new TextEncoder();
      const errMessage =
        "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";
      controllerStream.enqueue(encoder.encode(`data: ${JSON.stringify({ text: errMessage })}\n\n`));
      controllerStream.enqueue(encoder.encode("data: [DONE]\n\n"));
      controllerStream.close();
    },
  });
}
