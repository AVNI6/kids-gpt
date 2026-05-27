import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const getErrorMessage = (error: Error) => error.message || "Unknown error";

const getErrorStatus = (error: Error) => {
  if (typeof error === "object" && error && "status" in error) {
    const status = (error as Error & { status?: number }).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
};

// Nano Banana Models — separate lists for generation vs editing
const GENERATION_MODELS = [
  "imagen-4-fast-generate",
  "imagen-4-generate",
  "imagen-4-ultra-generate",
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview",
  "gemini-2.5-flash-image",
];

const EDIT_MODELS = [
  "gemini-3-pro-image-preview",
  "gemini-3.1-flash-image-preview",
  "gemini-2.5-flash-image",
];

// Global in-memory cache for generated images to improve URL retrieval times, reduce quota usage, and enable instant retrieval for identical prompts
const imageCache = new Map<string, { image: string; modelUsed: string; message?: string }>();

export async function POST(req: NextRequest) {
  let userPrompt = "";
  let inputImageBase64: string | null = null;
  let isEditRequest = false;

  try {
    const body = await req.json();
    userPrompt = body.prompt || body.message || "";
    inputImageBase64 = body.image || null;
    isEditRequest = !!body.isEdit || !!inputImageBase64;

    if (!userPrompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const cacheKey = userPrompt
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    // Skip cache for edit requests
    if (!isEditRequest && imageCache.has(cacheKey)) {
      const cached = imageCache.get(cacheKey)!;
      return NextResponse.json({
        type: "image",
        image: cached.image,
        message: cached.message,
        modelUsed: `${cached.modelUsed}-cached`,
      });
    }

    const keys: string[] = [];
    if (process.env.GOOGLE_GEMINI_API_KEY) keys.push(process.env.GOOGLE_GEMINI_API_KEY);
    if (process.env.GOOGLE_GEMINI_API_KEY2) keys.push(process.env.GOOGLE_GEMINI_API_KEY2);
    if (process.env.GOOGLE_GEMINI_API_KEY3) keys.push(process.env.GOOGLE_GEMINI_API_KEY3);

    if (keys.length === 0) {
      return NextResponse.json({ error: "No API keys configured" }, { status: 500 });
    }

    const modelList = isEditRequest ? EDIT_MODELS : GENERATION_MODELS;

    for (const modelName of modelList) {
      for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
        const apiKey = keys[keyIndex];
        try {
          const ai = new GoogleGenAI({ apiKey });

          // Build contents array — text prompt + optional reference image
          const contents: Array<
            { text: string } | { inlineData: { mimeType: string; data: string } }
          > = [];

          // Text instruction
          const textPrompt = isEditRequest
            ? `Edit this image: ${userPrompt}. Keep all existing subjects and layout exactly the same, only apply the requested changes.`
            : userPrompt;

          contents.push({ text: textPrompt });

          // Reference image for editing
          if (inputImageBase64) {
            let cleanBase64 = inputImageBase64;
            let mimeType = "image/png";

            if (inputImageBase64.startsWith("http")) {
              const imageRes = await fetch(inputImageBase64);
              if (!imageRes.ok) {
                console.error("[Image API] Failed to fetch image URL");
                continue;
              }
              const arrayBuffer = await imageRes.arrayBuffer();
              cleanBase64 = Buffer.from(arrayBuffer).toString("base64");
              mimeType = imageRes.headers.get("Content-Type") || "image/png";
            } else if (inputImageBase64.startsWith("data:")) {
              const parts = inputImageBase64.split(",");
              mimeType = parts[0].split(":")[1].split(";")[0];
              cleanBase64 = parts[1];
            }

            contents.push({
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            });
          }

          // Use ai.models.generateContent — the correct method for @google/genai SDK
          const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              responseModalities: ["TEXT", "IMAGE"],
            },
          });

          let resultImageBase64: string | null = null;
          let resultMimeType = "image/png";
          let textResponse = "";

          if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                resultImageBase64 = part.inlineData.data ?? null;
                resultMimeType = part.inlineData.mimeType || "image/png";
              } else if (part.text) {
                textResponse = part.text;
              }
            }
          }

          if (resultImageBase64) {
            const base64Url = `data:${resultMimeType};base64,${resultImageBase64}`;

            if (!isEditRequest) {
              imageCache.set(cacheKey, {
                image: base64Url,
                modelUsed: modelName,
                message: textResponse || undefined,
              });

              // Limit cache to 100 entries to prevent memory leaks
              if (imageCache.size > 100) {
                const firstKey = imageCache.keys().next().value;
                if (firstKey) imageCache.delete(firstKey);
              }
            }

            return NextResponse.json({
              type: "image",
              image: base64Url,
              message: textResponse || undefined,
              modelUsed: modelName,
            });
          }

          console.warn(`[Image API] ${modelName} returned no image, trying next key...`);
          continue;
        } catch (modelError) {
          const error = modelError instanceof Error ? modelError : new Error(String(modelError));
          const errorMsg = getErrorMessage(error);
          const status = getErrorStatus(error);
          console.error(
            `[Image API] Error with ${modelName} using Key index ${keyIndex}:`,
            errorMsg
          );

          if (
            status === 429 ||
            errorMsg.includes("429") ||
            errorMsg.includes("quota") ||
            errorMsg.includes("RESOURCE_EXHAUSTED")
          ) {
            continue;
          }
          break;
        }
      }
    }

    const encodedPrompt = encodeURIComponent(userPrompt);
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

    const fallbackResponse = await fetch(fallbackUrl);
    if (!fallbackResponse.ok) throw new Error("Pollinations fallback failed");

    const arrayBuffer = await fallbackResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const fallbackBase64Url = `data:image/jpeg;base64,${base64}`;

    if (!isEditRequest) {
      imageCache.set(cacheKey, {
        image: fallbackBase64Url,
        modelUsed: "pollinations-fallback",
      });

      // Limit cache to 100 entries
      if (imageCache.size > 100) {
        const firstKey = imageCache.keys().next().value;
        if (firstKey) imageCache.delete(firstKey);
      }
    }

    return NextResponse.json({
      type: "image",
      image: fallbackBase64Url,
      modelUsed: "pollinations-fallback",
    });
  } catch (fatalError) {
    const error = fatalError instanceof Error ? fatalError : new Error(String(fatalError));
    console.error("Fatal Image Generation Error:", error);
    return NextResponse.json({
      type: "text",
      message: `I'm having trouble creating that image right now. Error: ${getErrorMessage(error)}`,
    });
  }
}
