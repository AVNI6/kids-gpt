import { NextRequest, NextResponse } from "next/server";
import { ChatRequestBody } from "@/types/chat.types";
import { generateAIResponse, generateAIResponseStream } from "@/lib/ai/model-orchestrator";
import { buildSystemPrompt, ChatMode } from "@/lib/ai/prompts";
import { buildGeminiContents } from "@/lib/ai/context-window";
import { aiLogger } from "@/lib/ai/logger";
import { JsonObject } from "@/types/json";

import {
  isStopCommand,
  deriveChatMode,
  extractUserQuery,
} from "@/lib/ai/orchestration/mode-detector";
import { getGenerationConfig } from "@/lib/ai/orchestration/generation-config";
import { extractAndParseJSON } from "@/lib/ai/orchestration/json-parser";
import { PdfResponseSchema } from "@/lib/ai/schemas/pdf-response.schema";

function isImageGenerationRequest(message: string): boolean {
  if (!message) return false;
  const query = extractUserQuery(message);
  const hasCreationVerb =
    /(draw|create|generate|make|show me|paint|sketch|produce|design|illustrate|visualize|render)/i.test(
      query
    );
  const hasVisualNoun =
    /(image|picture|drawing|painting|photo|illustration|artwork|graphic|visual|portrait|scene|diagram)/i.test(
      query
    );
  const hasAnalysisIntent =
    /(explain|describe|what is|tell me about|analyze|analyse|discuss|identify|who is|who's|character|detail|details\s+of|generated|created|made|drawn|painted|sketched|illustrated|visualized|rendered|in\s+(the\s+)?(image|photo|picture|drawing|illustration)|of\s+(the\s+)?(image|photo|picture|drawing|illustration)|from\s+(the\s+)?(image|photo|picture|drawing|illustration)|about\s+(the\s+)?(image|photo|picture|drawing|illustration)|above\s+(image|photo|picture|drawing|illustration)|previous\s+(image|photo|picture|drawing|illustration)|that\s+(image|photo|picture|drawing|illustration)|this\s+(image|photo|picture|drawing|illustration))/i.test(
      query
    );

  return (
    hasCreationVerb &&
    (hasVisualNoun || query.toLowerCase().includes("draw ")) &&
    !hasAnalysisIntent
  );
}

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      image,
      history,
      role = "kid",
      customTask,
      responseStyle,
    }: ChatRequestBody = await req.json();

    if (isImageGenerationRequest(message || "")) {
      // SAFE: Only strips leading trigger phrases
      const cleanedPrompt =
        (message || "")
          .replace(
            /^(please\s+)?(generate|create|draw|make|show\s+me)\s+(an?\s+)?(image|picture|photo|illustration|drawing)(\s+of)?\s*/i,
            ""
          )
          .trim() || "educational illustration";

      // URL-encode for external API safety
      const encodedPrompt = encodeURIComponent(cleanedPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true`;

      try {
        // RESTORE SUPABASE UPLOAD LOGIC HERE (If applicable to your pipeline)
        // await uploadToSupabase(imageUrl);

        // Return standard SSE stream so the frontend can render the image
        return new Response(
          `data: ${JSON.stringify({ imageUrl, text: "I've generated that image for you!" })}\n\ndata: [DONE]\n\n`,
          {
            headers: {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          }
        );
      } catch (error) {
        aiLogger.error("ChatAPI", "Image Generation/Upload Failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        // Fall through to standard chat response if image generation fails
      }
    }

    // Centralized Mode Derivation using extracted mode detector
    const mode: ChatMode = deriveChatMode(message || "", history || []);

    aiLogger.info(
      "ChatAPI",
      `Received request. Role: ${role}, Mode: ${mode}, Style: ${responseStyle}`
    );

    // Layer-compose the modular system prompt dynamically
    const activePrompt = buildSystemPrompt({
      role,
      mode,
      customTask,
      responseStyle,
    });

    // Log structured prompt metrics
    aiLogger.info("ChatAPI", "Prompt Metrics Log", {
      mode,
      role,
      responseStyle: responseStyle || "default",
      customTask: customTask || "none",
      promptLength: activePrompt.length,
      promptVersion: "1.0.0",
    });

    if (mode === "quiz" && isStopCommand(message || "")) {
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
    const contents = await buildGeminiContents(history || [], message, image);

    // Get generation config from orchestrator
    const generationConfig = getGenerationConfig(mode);

    if (mode === "pdf") {
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
        const parsedRaw = extractAndParseJSON(response.content) as JsonObject;
        const validationResult = PdfResponseSchema.safeParse(parsedRaw);

        let validatedData;
        if (validationResult.success) {
          validatedData = validationResult.data;
        } else {
          aiLogger.warn("ChatAPI", "PDF JSON failed strict zod schema validation", {
            errors: validationResult.error.format() as unknown as JsonObject,
            raw: parsedRaw,
          });
          // Fall back gracefully to raw fields, filling missing parameters with defaults
          validatedData = {
            overview: (parsedRaw?.overview as string) || "Here is your completed PDF material.",
            pdfContent: (parsedRaw?.pdfContent as string) || response.content,
            pdfTheme:
              (parsedRaw?.pdfTheme as string) ||
              (role === "kid" ? "kid" : role === "teacher" ? "teacher" : "clean"),
            suggestedTitle: (parsedRaw?.suggestedTitle as string) || "Learning Material",
          };
        }

        // Validate pdfTheme is one of allowed themes
        const pdfTheme =
          validatedData.pdfTheme === "kid" ||
          validatedData.pdfTheme === "clean" ||
          validatedData.pdfTheme === "teacher"
            ? validatedData.pdfTheme
            : role === "kid"
              ? "kid"
              : role === "teacher"
                ? "teacher"
                : "clean";

        return NextResponse.json({
          type: "text",
          message: validatedData.overview || "Here is your completed PDF material.",
          pdfContent: validatedData.pdfContent || response.content,
          pdfTheme: pdfTheme,
          suggestedTitle: validatedData.suggestedTitle || "Learning Material",
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

    // Standard chat responses stream in real-time with fallback protection
    try {
      const stream = await generateAIResponseStream({
        contents,
        systemPrompt: activePrompt,
        generationConfig,
        signal: req.signal,
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (streamError) {
      if (req.signal?.aborted) {
        throw streamError;
      }

      aiLogger.warn("ChatAPI", "Streaming failed, falling back to non-streamed response", {
        error: streamError instanceof Error ? streamError.message : String(streamError),
      });

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

      // Convert full non-streamed content to a compatible SSE event stream
      const encoder = new TextEncoder();
      const fallbackStream = new ReadableStream({
        start(controller) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: response.content })}\n\n`)
            );
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch (err) {
            aiLogger.error("ChatAPI", "Failed to stream fallback response", {
              error: err instanceof Error ? err.message : String(err),
            });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(fallbackStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }
  } catch (error) {
    aiLogger.error("ChatAPI", "Fatal Chat API Error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
