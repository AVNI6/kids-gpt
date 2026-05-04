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

export async function POST(req: NextRequest) {
  let userPrompt = "";
  try {
    const body = await req.json();
    userPrompt = body.prompt || body.message || "";

    if (!userPrompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: userPrompt,
    });

    let imageBase64 = null;
    let mimeType = "image/png";

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageBase64 = part.inlineData.data;
          mimeType = part.inlineData.mimeType || "image/png";
          break;
        }
      }
    }

    if (imageBase64) {
      return NextResponse.json({
        type: "image",
        image: `data:${mimeType};base64,${imageBase64}`,
      });
    } else {
      console.error("No image found in response parts.");
      return NextResponse.json({
        type: "text",
        message: "Sorry, I couldn't generate that image. Let's try something else!",
      });
    }
  } catch (error: unknown) {
    console.error("Image Generation API Error:", error);

    const errorMessage = getErrorMessage(error);
    const isQuotaError =
      errorMessage.includes("429") ||
      errorMessage.includes("quota") ||
      errorMessage.includes("RESOURCE_EXHAUSTED") ||
      getErrorStatus(error) === 429;

    if (isQuotaError) {
      try {
        console.log(
          "Gemini Quota Exceeded. Falling back to Pollinations API with prompt:",
          userPrompt
        );
        const encodedPrompt = encodeURIComponent(userPrompt);
        const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

        const fallbackResponse = await fetch(fallbackUrl);
        if (!fallbackResponse.ok)
          throw new Error(`Pollinations API failed: ${fallbackResponse.statusText}`);

        const arrayBuffer = await fallbackResponse.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");

        return NextResponse.json({
          type: "image",
          image: `data:image/jpeg;base64,${base64}`,
        });
      } catch (fallbackError: unknown) {
        console.error("Fallback Image API Error:", fallbackError);
        return NextResponse.json({
          type: "text",
          message: `Image generation failed. Google Quota Exceeded and Fallback failed: ${getErrorMessage(fallbackError)}`,
        });
      }
    }

    return NextResponse.json({
      type: "text",
      message: `Google API Error: ${errorMessage}`,
    });
  }
}
