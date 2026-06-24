import { NextRequest, NextResponse } from "next/server";
import { ChatRequestBody } from "@/types/common";
import { generateAIResponse, generateAIResponseStream } from "@/lib/ai/model-orchestrator";
import { buildSystemPrompt, ChatMode } from "@/lib/ai/prompts";
import { buildConversationContext } from "@/lib/ai/context-window";
import { aiLogger } from "@/lib/ai/logger";
import { JsonObject } from "@/types/json";
import { createClient } from "@/lib/supabase/server";
import { getStudentLearningProfile } from "@/lib/services/shared/learning-profile.actions";

import { GoogleGenAI } from "@google/genai";
import {
  isStopCommand,
  deriveChatMode,
  extractUserQuery,
} from "@/lib/ai/orchestration/mode-detector";
import { getGenerationConfig } from "@/lib/ai/orchestration/generation-config";
import { extractAndParseJSON } from "@/lib/ai/orchestration/json-parser";
import { PdfResponseSchema } from "@/lib/ai/schemas/pdf-response.schema";
import { DocResponseSchema } from "@/lib/ai/schemas/doc-response.schema";

function isImageGenerationRequest(message: string): boolean {
  if (!message) return false;
  const queryLower = extractUserQuery(message).trim().toLowerCase();

  const hasAnalysisIntent =
    /(explain|describe|what\s+is|tell\s+me|analyze|analyse|discuss|identify|who|why|how|where|when|detail|in\s+(the\s+)?(image|photo|picture|drawing|illustration)|about\s+(the\s+)?(image|photo|picture|drawing|illustration)|previous\s+(image|photo|picture|drawing|illustration)|above\s+(image|photo|picture|drawing|illustration))/i.test(
      queryLower
    );
  if (hasAnalysisIntent) return false;

  const hasDirectCreation =
    /(draw|paint|sketch|illustrate|render|visualize)\s+(a|an|the|some)?\s*[a-z0-9]/i.test(
      queryLower
    );

  const hasRequestVerb =
    /(draw|create|generate|make|show|paint|sketch|produce|design|illustrate|visualize|render|want|wanted|need|display|give\s+me|fetch)/i.test(
      queryLower
    );
  const hasVisualNoun =
    /(image|picture|drawing|painting|photo|illustration|artwork|graphic|visual|portrait|scene|diagram)/i.test(
      queryLower
    );
  const hasVerbAndNoun = hasRequestVerb && hasVisualNoun;

  const hasOfPattern =
    /(image|picture|photo|illustration|drawing|painting|sketch|graphic|portrait|diagram)\s+of/i.test(
      queryLower
    );

  const isShortVisualNoun = hasVisualNoun && queryLower.length < 40;

  return hasDirectCreation || hasVerbAndNoun || hasOfPattern || isShortVisualNoun;
}

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      image,
      history,
      customTask,
      responseStyle,
      age,
      learnerContext,
      activityContext,
      sessionId,
    }: ChatRequestBody = await req.json();

    const supabase = await createClient();

    // 1. Retrieve the authenticated user session securely
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let secureRole: "kid" | "parent" | "teacher" = "kid";

    if (user) {
      // 🛠️ Security Verification: Fetch actual user role from server profile DB, ignoring client parameter
      const { data: profile, error: profileError } = await supabase
        .from("profile")
        .select("role")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .maybeSingle();

      if (profileError || !profile || !profile.role) {
        return NextResponse.json({ error: "Profile Not Found or Invalid Role" }, { status: 403 });
      }

      secureRole = profile.role as "kid" | "parent" | "teacher";
    }

    if (isImageGenerationRequest(message || "")) {
      // SAFE: Only strips leading trigger phrases
      let cleanedPrompt = (message || "").trim();
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

      try {
        const keys: string[] = [];
        if (process.env.GOOGLE_GEMINI_API_KEY) keys.push(process.env.GOOGLE_GEMINI_API_KEY);
        if (process.env.GOOGLE_GEMINI_API_KEY2) keys.push(process.env.GOOGLE_GEMINI_API_KEY2);
        if (process.env.GOOGLE_GEMINI_API_KEY3) keys.push(process.env.GOOGLE_GEMINI_API_KEY3);

        const encodedPrompt = encodeURIComponent(cleanedPrompt);
        let finalImageUrl = "";

        // Try Google GenAI models first (supported on the free tier)
        const models = [
          "imagen-3.0-generate-002",
          "gemini-3.1-flash-image",
          "gemini-3-pro-image",
          "gemini-2.5-flash-image",
        ];

        for (const modelName of models) {
          if (finalImageUrl.startsWith("data:image/")) break;
          for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
            const apiKey = keys[keyIndex];
            try {
              const ai = new GoogleGenAI({ apiKey });
              let resultImageBase64: string | null = null;

              if (modelName.startsWith("imagen-")) {
                const response = await ai.models.generateImages({
                  model: modelName,
                  prompt: cleanedPrompt,
                  config: {
                    numberOfImages: 1,
                    outputMimeType: "image/jpeg",
                    aspectRatio: "1:1",
                  },
                });
                resultImageBase64 = response?.generatedImages?.[0]?.image?.imageBytes ?? null;
              } else {
                const response = await ai.models.generateContent({
                  model: modelName,
                  contents: [{ text: cleanedPrompt }],
                  config: {
                    responseModalities: ["TEXT", "IMAGE"],
                  },
                });
                if (response.candidates?.[0]?.content?.parts) {
                  for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                      resultImageBase64 = part.inlineData.data ?? null;
                    }
                  }
                }
              }

              if (resultImageBase64) {
                finalImageUrl = `data:image/jpeg;base64,${resultImageBase64}`;
                break;
              }
            } catch (error) {
              aiLogger.warn(
                "ChatAPI",
                `Google GenAI ${modelName} failed for Key index ${keyIndex}`,
                {
                  error: error instanceof Error ? error.message : String(error),
                }
              );
            }
          }
        }

        // Try Hercai first (an AI image generator that returns JSON)
        if (!finalImageUrl.startsWith("data:image/")) {
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
                  finalImageUrl = `data:image/jpeg;base64,${base64}`;
                }
              }
            }
          } catch (e) {
            aiLogger.warn("ChatAPI", "Hercai fallback failed", {
              error: e instanceof Error ? e.message : String(e),
            });
          }
        }

        // Try Unsplash Search if Hercai failed
        if (!finalImageUrl.startsWith("data:image/") && process.env.UNPLASH_ACCESS_KEY) {
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
                  finalImageUrl = `data:image/jpeg;base64,${base64}`;
                }
              }
            }
          } catch (e) {
            aiLogger.warn("ChatAPI", "Unsplash fallback failed", {
              error: e instanceof Error ? e.message : String(e),
            });
          }
        }

        // Try other endpoints if Unsplash / Hercai failed
        if (!finalImageUrl.startsWith("data:image/")) {
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
                if (arrayBuffer) {
                  const base64 = Buffer.from(arrayBuffer).toString("base64");
                  finalImageUrl = `data:image/jpeg;base64,${base64}`;
                  break;
                }
              }
            } catch (e) {
              aiLogger.warn("ChatAPI", `Fallback failed for ${url}`, {
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }
        }

        // Guaranteed base64 fallback (loremflickr) if everything else fails
        if (!finalImageUrl.startsWith("data:image/")) {
          try {
            const res = await fetch(`https://loremflickr.com/800/600/education,illustration`, {
              signal: AbortSignal.timeout(8000),
            });
            if (res.ok) {
              const arrayBuffer = await res.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString("base64");
              finalImageUrl = `data:image/jpeg;base64,${base64}`;
            }
          } catch {
            finalImageUrl =
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
          }
        }

        // Return standard SSE stream so the frontend can render the image
        return new Response(
          `data: ${JSON.stringify({ imageUrl: finalImageUrl, text: "I've generated that image for you!" })}\n\ndata: [DONE]\n\n`,
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
      `Received request. Role: ${secureRole}, Mode: ${mode}, Style: ${responseStyle}`
    );

    // Layer-compose the modular system prompt dynamically
    const activePrompt = buildSystemPrompt({
      role: secureRole,
      mode,
      customTask,
      responseStyle,
      age,
      learnerContext,
      activityContext,
    });

    // Log structured prompt metrics
    aiLogger.info("ChatAPI", "Prompt Metrics Log", {
      mode,
      role: secureRole,
      responseStyle: responseStyle || "default",
      customTask: customTask || "none",
      promptLength: activePrompt.length,
      promptVersion: "1.0.0",
    });

    if (mode === "quiz" && isStopCommand(message || "")) {
      const stopMessage =
        secureRole === "teacher"
          ? "Quiz stopped. You can start a new quiz anytime."
          : secureRole === "parent"
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

    // Fetch user learning profile and session summary in parallel using a single Supabase client
    let learningProfile = null;
    let sessionSummary: string | null = null;

    try {
      const supabase = await createClient();
      const [authResult, sessionResult] = await Promise.all([
        user ? supabase.auth.getUser() : Promise.resolve({ data: { user: null }, error: null }),
        sessionId && user
          ? supabase.from("chat_sessions").select("summary").eq("id", sessionId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (authResult.error) {
        aiLogger.error("ChatAPI", "Failed to retrieve authenticated user in API route", {
          error: authResult.error.message,
        });
      } else if (authResult.data?.user?.id) {
        learningProfile = await getStudentLearningProfile(authResult.data.user.id);
      }

      if (sessionResult.error) {
        aiLogger.error("ChatAPI", `Failed to retrieve session summary for session ${sessionId}`, {
          error: sessionResult.error.message,
        });
      } else if (sessionResult.data) {
        sessionSummary = sessionResult.data.summary;
      }
    } catch (err) {
      aiLogger.error("ChatAPI", "Error fetching user or session context in parallel", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Build optimized contents array using centralized context builder utility
    const { contents, systemContexts, telemetry } = await buildConversationContext({
      recentMessages: history || [],
      currentMessage: message || "",
      image: image,
      memory: {
        sessionSummary: sessionSummary,
        learningProfile: learningProfile,
        retrievedMemories: [],
      },
    });

    aiLogger.info("ChatAPI", "Context Assembly Telemetry", {
      historyMessagesUsed: telemetry.historyMessagesUsed,
      estimatedTokens: telemetry.estimatedTokens,
      trimmedMessages: telemetry.trimmedMessages,
      learningProfileUsed: telemetry.learningProfileUsed,
      strengthsCount: telemetry.strengthsCount,
      weaknessesCount: telemetry.weaknessesCount,
      interestsCount: telemetry.interestsCount,
      profileContextTokens: telemetry.profileContextTokens,
      sessionSummaryUsed: telemetry.sessionSummaryUsed,
      sessionSummaryTokens: telemetry.sessionSummaryTokens,
    });

    // Assemble final system prompt by combining active prompt and injected system contexts
    const finalSystemPrompt = [activePrompt, ...systemContexts].filter(Boolean).join("\n\n");

    // Get generation config from orchestrator
    const generationConfig = getGenerationConfig(mode);

    if (mode === "pdf") {
      // Delegate to the model fallback orchestrator for structured JSON
      const response = await generateAIResponse({
        contents,
        systemPrompt: finalSystemPrompt,
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
              (secureRole === "kid" ? "kid" : secureRole === "teacher" ? "teacher" : "clean"),
            suggestedTitle: (parsedRaw?.suggestedTitle as string) || "Learning Material",
          };
        }

        // Validate pdfTheme is one of allowed themes
        const pdfTheme =
          validatedData.pdfTheme === "kid" ||
          validatedData.pdfTheme === "clean" ||
          validatedData.pdfTheme === "teacher"
            ? validatedData.pdfTheme
            : secureRole === "kid"
              ? "kid"
              : secureRole === "teacher"
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
          pdfTheme: secureRole === "kid" ? "kid" : secureRole === "teacher" ? "teacher" : "clean",
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

    if (mode === "doc") {
      // Delegate to the model fallback orchestrator for structured JSON
      const response = await generateAIResponse({
        contents,
        systemPrompt: finalSystemPrompt,
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
        const validationResult = DocResponseSchema.safeParse(parsedRaw);

        let validatedData;
        if (validationResult.success) {
          validatedData = validationResult.data;
        } else {
          aiLogger.warn("ChatAPI", "Doc JSON failed strict zod schema validation", {
            errors: validationResult.error.format() as unknown as JsonObject,
            raw: parsedRaw,
          });
          // Fall back gracefully to raw fields, filling missing parameters with defaults
          validatedData = {
            overview: (parsedRaw?.overview as string) || "Here is your completed Word document.",
            docContent:
              (parsedRaw?.docContent as string) ||
              (parsedRaw?.pdfContent as string) ||
              response.content,
            suggestedTitle: (parsedRaw?.suggestedTitle as string) || "Learning Material",
          };
        }

        return NextResponse.json({
          type: "text",
          message: validatedData.overview || "Here is your completed Word document.",
          docContent: validatedData.docContent || response.content,
          suggestedTitle: validatedData.suggestedTitle || "Learning Material",
          isDocRequest: true,
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
        aiLogger.error("ChatAPI", "Failed to parse Doc JSON response", {
          error: err instanceof Error ? err.message : String(err),
          rawContent: response.content,
        });

        // Fallback if AI fails to return valid JSON
        return NextResponse.json({
          type: "text",
          message: "Here is your Word document overview.",
          docContent: response.content,
          suggestedTitle: "Learning Material",
          isDocRequest: true,
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
        systemPrompt: finalSystemPrompt,
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
        systemPrompt: finalSystemPrompt,
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
