import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

// Check if at least one Google Gemini API key is configured
export const hasAnyGeminiApiKey = !!(
  process.env.GOOGLE_GEMINI_API_KEY ||
  process.env.GOOGLE_GEMINI_API_KEY2 ||
  process.env.GOOGLE_GEMINI_API_KEY3
);

if (!hasAnyGeminiApiKey) {
  console.warn("WARNING: No Google Gemini API keys configured in environment variables.");
}

/**
 * Universal helper for robust structured object generation with key rotation and model fallbacks
 */
export async function generateStructuredObject<T extends z.ZodTypeAny>({
  schema,
  system,
  prompt,
}: {
  schema: T;
  system: string;
  prompt: string;
}) {
  const keys: string[] = [];
  if (process.env.GOOGLE_GEMINI_API_KEY) keys.push(process.env.GOOGLE_GEMINI_API_KEY);
  if (process.env.GOOGLE_GEMINI_API_KEY2) keys.push(process.env.GOOGLE_GEMINI_API_KEY2);
  if (process.env.GOOGLE_GEMINI_API_KEY3) keys.push(process.env.GOOGLE_GEMINI_API_KEY3);

  if (keys.length === 0) {
    throw new Error("No Google Gemini API keys configured in environment variables.");
  }

  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  const errors: string[] = [];

  for (const modelName of models) {
    for (let i = 0; i < keys.length; i++) {
      const apiKey = keys[i];
      try {
        console.log(`[Activity AI] Trying model ${modelName} with API Key ${i + 1}/${keys.length}`);

        const googleProviderInstance = createGoogleGenerativeAI({
          apiKey,
        });

        const result = await generateObject({
          model: googleProviderInstance(modelName),
          schema,
          system,
          prompt,
        });

        console.log(
          `[Activity AI] Successfully generated object using ${modelName} with key index ${i}`
        );
        return result;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[Activity AI] Failed with ${modelName} using key index ${i}: ${errMsg}`);
        errors.push(`${modelName} (Key ${i + 1}): ${errMsg}`);
      }
    }
  }

  throw new Error(
    `AI generation failed after trying all keys and models. Errors:\n- ${errors.join("\n- ")}`
  );
}
