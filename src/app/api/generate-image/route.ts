import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const getErrorStatus = (error: unknown) => {
  if (typeof error === "object" && error && "status" in error) {
    const status = (error as { status?: number }).status;
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
          console.log(
            `[Image API] ${isEditRequest ? "EDIT" : "GENERATE"} with ${modelName} using Key ${keyIndex + 1}/${keys.length}`
          );
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
              console.log("[Image API] Fetching image from URL...");
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

            console.log(
              `[Image API] Image ready. Mime: ${mimeType}, Size: ${cleanBase64.length} chars`
            );

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
            console.log(`[Image API] Success with ${modelName} using Key index ${keyIndex}`);
            return NextResponse.json({
              type: "image",
              image: `data:${resultMimeType};base64,${resultImageBase64}`,
              message: textResponse || undefined,
              modelUsed: modelName,
            });
          }

          console.warn(`[Image API] ${modelName} returned no image, trying next key...`);
          continue;
        } catch (modelError: unknown) {
          const errorMsg = getErrorMessage(modelError);
          const status = getErrorStatus(modelError);
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
            console.log(
              `[Image API] Rate limited on ${modelName} with Key index ${keyIndex}, trying next...`
            );
            continue;
          }
          break;
        }
      }
    }

    console.log("[Image API] All Gemini models failed. Falling back to Pollinations.");

    const encodedPrompt = encodeURIComponent(userPrompt);
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

    const fallbackResponse = await fetch(fallbackUrl);
    if (!fallbackResponse.ok) throw new Error("Pollinations fallback failed");

    const arrayBuffer = await fallbackResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({
      type: "image",
      image: `data:image/jpeg;base64,${base64}`,
      modelUsed: "pollinations-fallback",
    });
  } catch (fatalError: unknown) {
    console.error("Fatal Image Generation Error:", fatalError);
    return NextResponse.json({
      type: "text",
      message: `I'm having trouble creating that image right now. Error: ${getErrorMessage(fatalError)}`,
    });
  }
}
