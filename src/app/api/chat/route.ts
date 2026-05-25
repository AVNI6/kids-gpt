import { NextRequest, NextResponse } from "next/server";
import { ChatRequestBody } from "@/types/chat.types";
import { generateAIResponse, generateAIResponseStream } from "@/lib/ai/model-orchestrator";
import { buildChatPrompt, buildPdfPrompt, buildQuizPrompt } from "@/lib/ai/prompts";
import { buildGeminiContents } from "@/lib/ai/context-window";
import { aiLogger } from "@/lib/ai/logger";

function getConversationText(message: string, history: ChatRequestBody["history"] = []) {
  return [message, ...(history || []).map((entry) => entry.content || "")].join("\n").toLowerCase();
}

function isQuizMode(message: string, history: ChatRequestBody["history"] = []) {
  const text = getConversationText(message, history);
  return /start\s+quiz|quiz\s+mode|quiz me|ask me one question at a time|one question at a time|begin quiz/i.test(
    text
  );
}

function isStopCommand(message: string) {
  return /^(stop|exit|quit|end quiz|end|stop quiz)$/i.test(message.trim());
}

function extractAndParseJSON(content: string) {
  let cleanContent = content.trim();

  // 1. Remove markdown code fences if present (e.g. ```json or ```)
  const codeBlockRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
  const match = cleanContent.match(codeBlockRegex);
  if (match) {
    cleanContent = match[1].trim();
  }

  // 2. Locate first '{' and last '}' to strip extra text before/after
  const startIdx = cleanContent.indexOf("{");
  const endIdx = cleanContent.lastIndexOf("}");

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    try {
      const jsonCandidate = cleanContent.slice(startIdx, endIdx + 1);
      return JSON.parse(jsonCandidate);
    } catch {
      // Fall through to standard parsing if slice fails
    }
  }

  return JSON.parse(cleanContent);
}

export async function POST(req: NextRequest) {
  try {
    const { message, image, history, role = "kid" }: ChatRequestBody = await req.json();

    // Check if user specifically wants to CREATE a new PDF document
    const isPdfRequest =
      /pdf/i.test(message || "") && /generate|create|make|build|download/i.test(message || "");

    aiLogger.info("ChatAPI", `Received request. Role: ${role}, Is PDF: ${isPdfRequest}`);

    // Build the system prompt based on user's role and request type
    const quizMode = isQuizMode(message || "", history || []);
    const activePrompt = isPdfRequest
      ? buildPdfPrompt(role)
      : quizMode
        ? buildQuizPrompt(role)
        : buildChatPrompt(role);

    if (!isPdfRequest && quizMode && isStopCommand(message || "")) {
      const stopMessage =
        role === "teacher"
          ? "Quiz stopped. You can start a new quiz anytime."
          : role === "parent"
            ? "Quiz stopped. You can start again whenever you're ready."
            : 'Quiz stopped. Say "Start Quiz" whenever you want to play again.';

      return new Response(`data: ${JSON.stringify({ text: stopMessage })}\n\ndata: [DONE]\n\n`, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Build optimized contents array using context window memory management
    const contents = buildGeminiContents(history || [], message, image);

    const generationConfig = isPdfRequest ? { responseMimeType: "application/json" } : undefined;

    if (isPdfRequest) {
      // Delegate to the model fallback orchestrator for structured JSON
      const response = await generateAIResponse({
        contents,
        systemPrompt: activePrompt,
        generationConfig,
        signal: req.signal,
      });

      if (!response.success) {
        return NextResponse.json(
          { error: response.error || "Failed to generate AI response" },
          { status: 500 }
        );
      }

      try {
        const parsed = extractAndParseJSON(response.content);
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

    // Standard chat responses stream in real-time
    const stream = await generateAIResponseStream({
      contents,
      systemPrompt: activePrompt,
      signal: req.signal,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    aiLogger.error("ChatAPI", "Fatal Chat API Error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
