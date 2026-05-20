import { NextRequest, NextResponse } from "next/server";
import { ChatMessage, ChatRequestBody, GeminiPart, GeminiContent } from "@/types/chat.types";

const BASE_PROMPT_CHAT = `You are a helpful educational assistant for kids. 
Answer the user's questions clearly and simply, using a friendly tone suitable for a child.`;

const BASE_PROMPT_PDF = `You are a helpful educational assistant for kids. 
The user specifically requested a PDF document. 
You MUST return your response in the following JSON format:
{
  "overview": "A short, engaging 2-3 sentence overview of what the document contains to be shown in the chat.",
  "pdfContent": "The full, detailed content in Markdown format for the PDF document. Include title, headings, bullet points, and fun facts."
}
Ensure the pdfContent is well-structured and comprehensive. Use emojis to make it fun!`;

const TEXT_MODEL = "gemini-flash-latest";

export async function POST(req: NextRequest) {
  try {
    const { message, image, history }: ChatRequestBody = await req.json();

    // Check if user specifically wants to CREATE a new PDF document
    const isPdfRequest =
      /pdf/i.test(message || "") && /generate|create|make|build|download/i.test(message || "");

    const activePrompt = isPdfRequest ? BASE_PROMPT_PDF : BASE_PROMPT_CHAT;

    // Construct the Gemini contents array with history
    const contents: GeminiContent[] = [];

    // Add history first
    if (history && Array.isArray(history)) {
      history.forEach((h: ChatMessage) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }],
        });
      });
    }

    const currentParts: GeminiPart[] = [{ text: `${activePrompt}\n\nUser Question: ${message}` }];

    if (image) {
      let mimeType = "image/png";
      let base64Data = image;

      if (image.startsWith("data:")) {
        const parts = image.split(",");
        mimeType = parts[0].split(":")[1].split(";")[0];
        base64Data = parts[1];
      }

      currentParts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    contents.push({
      role: "user",
      parts: currentParts,
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: isPdfRequest ? { responseMimeType: "application/json" } : undefined,
        }),
      }
    );

    const data = await response.json();
    const usage = data?.usageMetadata || {
      promptTokenCount: 0,
      candidatesTokenCount: 0,
      totalTokenCount: 0,
    };

    const aiResponseRaw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";

    if (isPdfRequest) {
      try {
        const parsed = JSON.parse(aiResponseRaw);
        return NextResponse.json({
          type: "text",
          message: parsed.overview,
          pdfContent: parsed.pdfContent,
          isPdfRequest: true,
          usage,
        });
      } catch {
        // Fallback if AI fails to return valid JSON
        return NextResponse.json({
          type: "text",
          message: "Here is an overview of your material.",
          pdfContent: aiResponseRaw,
          isPdfRequest: true,
          usage,
        });
      }
    }

    return NextResponse.json({
      type: "text",
      message: aiResponseRaw,
      isPdfRequest: false,
      usage,
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed request" }, { status: 500 });
  }
}
