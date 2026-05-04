import { NextRequest, NextResponse } from "next/server";

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
    const { message, image } = await req.json();

    const isPdfRequest = /pdf/i.test(message || "");

    const activePrompt = isPdfRequest ? BASE_PROMPT_PDF : BASE_PROMPT_CHAT;
    const fullMessage = `${activePrompt}\n\nUser request: ${message || "Please analyze this image."}`;

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: fullMessage },
    ];

    if (image) {
      let mimeType = "image/png";
      let base64Data = image;

      if (image.startsWith("data:")) {
        const parts = image.split(",");
        mimeType = parts[0].split(":")[1].split(";")[0];
        base64Data = parts[1];
      }

      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts,
            },
          ],
          // Add generationConfig to encourage JSON if PDF request
          generationConfig: isPdfRequest ? { responseMimeType: "application/json" } : undefined,
        }),
      }
    );

    const data = await response.json();

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
        });
      } catch {
        // Fallback if AI fails to return valid JSON
        return NextResponse.json({
          type: "text",
          message: "Here is an overview of your material.",
          pdfContent: aiResponseRaw,
          isPdfRequest: true,
        });
      }
    }

    return NextResponse.json({
      type: "text",
      message: aiResponseRaw,
      isPdfRequest: false,
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed request" }, { status: 500 });
  }
}
