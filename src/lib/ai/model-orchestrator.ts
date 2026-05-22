import { AIResponse, GeminiContent } from "./types";
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
  generationConfig?: Record<string, unknown>;
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
