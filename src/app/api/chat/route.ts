import { NextRequest, NextResponse } from "next/server";
import { ChatRequestBody } from "@/types/chat.types";
import { generateAIResponse } from "@/lib/ai/model-orchestrator";
import { buildChatPrompt, buildPdfPrompt } from "@/lib/ai/prompts";
import { buildGeminiContents } from "@/lib/ai/context-window";
import { aiLogger } from "@/lib/ai/logger";

export async function POST(req: NextRequest) {
  try {
    const { message, image, history, role = "kid" }: ChatRequestBody = await req.json();

    // Check if user specifically wants to CREATE a new PDF document
    const isPdfRequest =
      /pdf/i.test(message || "") && /generate|create|make|build|download/i.test(message || "");

    aiLogger.info("ChatAPI", `Received request. Role: ${role}, Is PDF: ${isPdfRequest}`);

    // Build the system prompt based on user's role and request type
    const activePrompt = isPdfRequest ? buildPdfPrompt(role) : buildChatPrompt(role);

    // Build optimized contents array using context window memory management
    const contents = buildGeminiContents(activePrompt, history || [], message, image);

    const generationConfig = isPdfRequest ? { responseMimeType: "application/json" } : undefined;

    // Delegate to the model fallback orchestrator
    const response = await generateAIResponse({
      contents,
      generationConfig,
      signal: req.signal,
    });

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to generate AI response" },
        { status: 500 }
      );
    }

    if (isPdfRequest) {
      try {
        const parsed = JSON.parse(response.content);
        return NextResponse.json({
          type: "text",
          message: parsed.overview || "Here is your completed PDF material.",
          pdfContent: parsed.pdfContent || response.content,
          pdfTheme:
            parsed.pdfTheme || (role === "kid" ? "kid" : role === "teacher" ? "teacher" : "clean"),
          suggestedTitle: parsed.suggestedTitle || "Learning Material",
          isPdfRequest: true,
          usage: {
            promptTokenCount: response.usage.promptTokens,
            candidatesTokenCount: response.usage.completionTokens,
            totalTokenCount: response.usage.totalTokens,
          },
          provider: response.provider,
          model: response.model,
          fallbackUsed: response.fallbackUsed,
        });
      } catch (err) {
        aiLogger.error("ChatAPI", "Failed to parse PDF JSON response", {
          error: err instanceof Error ? err.message : String(err),
          rawContent: response.content,
        });

        // Fallback if AI fails to return valid JSON
        return NextResponse.json({
          type: "text",
          message: "Here is your PDF overview.",
          pdfContent: response.content,
          pdfTheme: role === "kid" ? "kid" : role === "teacher" ? "teacher" : "clean",
          suggestedTitle: "Learning Material",
          isPdfRequest: true,
          usage: {
            promptTokenCount: response.usage.promptTokens,
            candidatesTokenCount: response.usage.completionTokens,
            totalTokenCount: response.usage.totalTokens,
          },
          provider: response.provider,
          model: response.model,
          fallbackUsed: response.fallbackUsed,
        });
      }
    }

    return NextResponse.json({
      type: "text",
      message: response.content,
      isPdfRequest: false,
      usage: {
        promptTokenCount: response.usage.promptTokens,
        candidatesTokenCount: response.usage.completionTokens,
        totalTokenCount: response.usage.totalTokens,
      },
      provider: response.provider,
      model: response.model,
      fallbackUsed: response.fallbackUsed,
    });
  } catch (error) {
    aiLogger.error("ChatAPI", "Fatal Chat API Error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
