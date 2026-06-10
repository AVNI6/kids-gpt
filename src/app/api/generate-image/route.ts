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

// Nano Banana & Imagen Models — separate lists for generation vs editing
const GENERATION_MODELS = [
  "imagen-3.0-generate-002",
  "gemini-3.1-flash-image",
  "gemini-3-pro-image",
  "gemini-2.5-flash-image",
  "imagen-4-fast-generate",
  "imagen-4-generate",
  "imagen-4-ultra-generate",
];

const EDIT_MODELS = ["gemini-3-pro-image", "gemini-3.1-flash-image", "gemini-2.5-flash-image"];

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
          let resultImageBase64: string | null = null;
          let resultMimeType = "image/png";
          let textResponse = "";

          if (modelName.startsWith("imagen-")) {
            // Imagen models use generateImages method
            const response = await ai.models.generateImages({
              model: modelName,
              prompt: userPrompt,
              config: {
                numberOfImages: 1,
                outputMimeType: "image/jpeg",
                aspectRatio: "1:1",
              },
            });
            resultImageBase64 = response?.generatedImages?.[0]?.image?.imageBytes ?? null;
            resultMimeType = "image/jpeg";
          } else {
            // Gemini models use generateContent method with TEXT/IMAGE response modalities
            const contents: Array<
              { text: string } | { inlineData: { mimeType: string; data: string } }
            > = [];

            const textPrompt = isEditRequest
              ? `Edit this image: ${userPrompt}. Keep all existing subjects and layout exactly the same, only apply the requested changes.`
              : userPrompt;

            contents.push({ text: textPrompt });

            if (inputImageBase64) {
              let cleanBase64 = inputImageBase64;
              let mimeType = "image/png";

              if (inputImageBase64.startsWith("http")) {
                const imageRes = await fetch(inputImageBase64);
                if (!imageRes.ok) continue;
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

            const response = await ai.models.generateContent({
              model: modelName,
              contents: contents,
              config: {
                responseModalities: ["TEXT", "IMAGE"],
              },
            });

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
    let cleanedPrompt = userPrompt.trim();
    // 1. Remove leading request phrasing: "generate an image of", "wanted image of", "draw a", "want to see a"
    cleanedPrompt = cleanedPrompt.replace(
      /^(please\s+)?(generate|create|draw|make|show\s+me|want|wanted|need|give\s+me|fetch|show|display)\s+(an?\s+)?(image|picture|photo|illustration|drawing|painting|artwork|sketch|graphic)?(\s+of)?\s*/i,
      ""
    );
    // 2. Remove leading visual nouns followed by "of"
    cleanedPrompt = cleanedPrompt.replace(
      /^(an?\s+)?(image|picture|photo|illustration|drawing|painting|artwork|sketch|graphic)\s+of\s+/i,
      ""
    );
    // 3. Remove trailing visual nouns
    cleanedPrompt = cleanedPrompt.replace(
      /\s+(image|picture|photo|illustration|drawing|painting|artwork|sketch|graphic)$/i,
      ""
    );
    cleanedPrompt = cleanedPrompt.trim() || "educational illustration";

    const encodedPrompt = encodeURIComponent(cleanedPrompt);
    let fallbackBase64Url = "";

    // Try Hercai first (an AI image generator that returns JSON)
    try {
      const hercaiRes = await fetch(
        `https://hercai.onrender.com/v3/text2image?prompt=${encodedPrompt}`,
        {
          signal: AbortSignal.timeout(25000),
        }
      );
      if (hercaiRes.ok) {
        const hercaiData = await hercaiRes.json();
        if (hercaiData && hercaiData.url) {
          const imgRes = await fetch(hercaiData.url, { signal: AbortSignal.timeout(15000) });
          const contentType = imgRes.headers.get("content-type") || "";
          if (imgRes.ok && contentType.startsWith("image/")) {
            const arrayBuffer = await imgRes.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            fallbackBase64Url = `data:image/jpeg;base64,${base64}`;
          }
        }
      }
    } catch (e) {
      console.warn("[Image API] Hercai fallback failed:", e);
    }

    // Try Unsplash Search if Hercai failed and API key is present
    if (!fallbackBase64Url.startsWith("data:image/") && process.env.UNPLASH_ACCESS_KEY) {
      try {
        const unsplashRes = await fetch(
          `https://api.unsplash.com/photos/random?query=${encodeURIComponent(cleanedPrompt)}&client_id=${process.env.UNPLASH_ACCESS_KEY}`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (unsplashRes.ok) {
          const data = await unsplashRes.json();
          const imageUrl = data?.urls?.regular;
          if (imageUrl) {
            const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
            const contentType = imgRes.headers.get("content-type") || "";
            if (imgRes.ok && contentType.startsWith("image/")) {
              const arrayBuffer = await imgRes.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString("base64");
              fallbackBase64Url = `data:image/jpeg;base64,${base64}`;
            }
          }
        }
      } catch (e) {
        console.warn("[Image API] Unsplash fallback failed:", e);
      }
    }

    // Try other endpoints if Unsplash / Hercai failed
    if (!fallbackBase64Url.startsWith("data:image/")) {
      const tags = cleanedPrompt
        .toLowerCase()
        .split(/\s+/)
        .filter(
          (w) =>
            ![
              "in",
              "the",
              "a",
              "an",
              "on",
              "of",
              "with",
              "and",
              "or",
              "to",
              "for",
              "at",
              "by",
              "from",
            ].includes(w) && w.length > 1
        )
        .join(",");
      const loremFlickrUrl = `https://loremflickr.com/800/600/${encodeURIComponent(tags || cleanedPrompt)}`;

      const fallbacks = [
        `https://api.airforce/v1/imagen?prompt=${encodedPrompt}&model=dall-e-3`,
        `https://api.airforce/v1/imagen?prompt=${encodedPrompt}&model=flux`,
        loremFlickrUrl,
        `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`,
      ];

      for (const url of fallbacks) {
        try {
          const res = await fetch(url, {
            signal: AbortSignal.timeout(10000),
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
          });
          const contentType = res.headers.get("content-type") || "";
          if (res.ok && contentType.startsWith("image/")) {
            const arrayBuffer = await res.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            fallbackBase64Url = `data:image/jpeg;base64,${base64}`;
            break;
          }
        } catch (e) {
          console.warn(`[Image API] Fallback failed for ${url}:`, e);
        }
      }
    }

    // Guaranteed base64 fallback (loremflickr) if everything else fails
    if (!fallbackBase64Url.startsWith("data:image/")) {
      try {
        const res = await fetch(`https://loremflickr.com/800/600/education,illustration`, {
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");
          fallbackBase64Url = `data:image/jpeg;base64,${base64}`;
        }
      } catch {
        fallbackBase64Url =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
      }
    }

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
