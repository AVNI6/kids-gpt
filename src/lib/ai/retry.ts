// Exponential backoff retry utility with jitter

import { aiLogger } from "./logger";

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  signal?: AbortSignal;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

function calculateDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  // Exponential backoff with jitter
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * baseDelayMs;
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    // Check if aborted before each attempt
    if (opts.signal?.aborted) {
      throw new DOMException("Request aborted", "AbortError");
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on abort
      if (lastError.name === "AbortError") {
        throw lastError;
      }

      // Don't retry on non-retryable errors (4xx except 429)
      const status = (error as { status?: number })?.status;
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw lastError;
      }

      if (attempt < opts.maxRetries) {
        const delay = calculateDelay(attempt, opts.baseDelayMs, opts.maxDelayMs);
        aiLogger.warn(
          "Retry",
          `Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms`,
          {
            error: lastError.message,
            attempt: attempt + 1,
            maxRetries: opts.maxRetries,
          }
        );

        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, delay);
          opts.signal?.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              reject(new DOMException("Request aborted", "AbortError"));
            },
            { once: true }
          );
        });
      }
    }
  }

  throw lastError || new Error("Retry failed with no error captured");
}
