import { ChatRequestBody } from "@/types/common";
import { generateAIResponse } from "../model-orchestrator";
import { aiLogger } from "../logger";
import { isStopCommand } from "./mode-detector";
import { extractAndParseJSON } from "./json-parser";

export type IntentMode =
  | "chat"
  | "quiz"
  | "pdf"
  | "doc"
  | "document_analysis"
  | "image_generation"
  | "image_analysis";

export interface IntentResult {
  mode: IntentMode;
  confidence: number;
  customTask?: "worksheet" | "storytelling" | "coding" | "socratic" | null;
  reason?: string;
}

export interface RouteIntentArgs {
  message: string;
  history?: ChatRequestBody["history"];
  hasImage: boolean;
  hasDocument: boolean;
  signal?: AbortSignal;
}

/**
 * Infers the active mode from dialogue history by scanning backwards.
 */
export function inferActiveModeFromHistory(history: ChatRequestBody["history"]): IntentMode {
  if (!history || history.length === 0) return "chat";
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === "model" || msg.role === "assistant") {
      if (msg.content.includes('"pdfContent"') || msg.content.includes("<!-- OVERVIEW -->")) {
        return "pdf";
      }
      if (msg.content.includes('"docContent"')) {
        return "doc";
      }
      if (
        msg.content.includes("I've generated that image") ||
        msg.content.startsWith("data:image/")
      ) {
        return "image_generation";
      }
    }
    if (msg.role === "user") {
      const queryLower = (msg.content || "").toLowerCase();
      if (PATTERNS.quizStart.test(queryLower)) {
        let stopped = false;
        for (let j = i + 1; j < history.length; j++) {
          if (history[j].role === "user" && isStopCommand(history[j].content || "")) {
            stopped = true;
            break;
          }
        }
        if (!stopped) return "quiz";
      }
    }
  }
  return "chat";
}

// Global Regex Patterns for deterministic classification (Single Source of Truth)
const PATTERNS = {
  // Obvious PDF triggers
  pdf: /\bpdf\b/i,
  pdfCreation:
    /\b(generate|create|make|build|download|export|write|compile|print|give|send|provide|show|get|need|want|prepare)\b/i,
  pdfPhrasePatterns: /\bpdf\s+(on|about|for|of)\b/i,
  pdfPhrases: [
    "give me notes on",
    "make revision notes",
    "prepare a study guide",
    "create a worksheet",
    "make printable notes",
    "create a handout",
    "prepare learning material",
    "make lecture notes",
    "create homework",
    "make an ebook",
    "summarize into notes",
    "notes on",
  ],

  // Obvious Word Document triggers
  doc: /\b(doc|docx|word|word\s+document)\b/i,
  docCreation:
    /\b(generate|create|make|build|download|export|write|compile|get|want|need|give|send|provide|show|prepare)\b/i,
  docPhrasePatterns: /\b(doc|docx|word\s+document)\s+(on|about|for|of)\b/i,

  // Quiz mode triggers
  quizStart:
    /\b(start\s+quiz|quiz\s+mode|quiz\s+me|test\s+me|ask\s+me\s+questions|challenge\s+me|give\s+me\s+mcqs|begin\s+quiz|practice\s+questions|check\s+my\s+understanding)\b/i,

  // Image Generation triggers
  imageGen:
    /\b(draw|paint|sketch|illustrate|visualize|generate\s+image|create\s+image|make\s+image|show\s+me\s+a\s+picture|show\s+me\s+an\s+image|illustration\s+of|picture\s+of|drawing\s+of)\b/i,
  imageGenExclusions:
    /\b(explain|describe|what\s+is|tell\s+me|analyze|analyse|discuss|identify|who|why|how|where|when|detail)\b/i,

  // Analysis / Explaining verbs (generic)
  analysisVerbs:
    /\b(explain|describe|what\s+is|tell\s+me|analyze|analyse|discuss|summarize|read|solve|outline|extract|review|what\s+does\s+it\s+say|details)\b/i,
};

/**
 * Extracts and cleans the user query by removing attachment formatting.
 */
function cleanQuery(message: string): string {
  if (!message) return "";
  let query = message;
  if (query.includes("\n\n[Attachment:")) {
    query = query.split("\n\n[Attachment:")[0];
  }
  const dbFileMatch = query.match(/^\[File:\s*[^\]]+\]\s*([\s\S]*)/);
  if (dbFileMatch) {
    query = dbFileMatch[1];
  }
  return query.trim();
}

/**
 * Determines user intent using zero-latency deterministic rules.
 */
export function detectIntentDeterministically(
  message: string,
  hasImage: boolean,
  hasDocument: boolean,
  lastMode: IntentMode
): IntentResult | null {
  const query = cleanQuery(message);
  const queryLower = query.toLowerCase();

  // 1. Stop Quiz command
  if (isStopCommand(message)) {
    return {
      mode: "chat",
      confidence: 1.0,
      reason: "Matched explicit stop command.",
    };
  }

  // 2. Strong Image Generation request
  const hasDirectImageCreation = PATTERNS.imageGen.test(queryLower);
  const hasImageAnalysisIntent = PATTERNS.imageGenExclusions.test(queryLower);
  if (hasDirectImageCreation && !hasImageAnalysisIntent && !hasImage) {
    return {
      mode: "image_generation",
      confidence: 1.0,
      reason: "Matched strong image generation triggers.",
    };
  }

  // 3. Document Analysis (if document present and user wants analysis/explanation)
  if (hasDocument) {
    const isDocSpecificQuery = PATTERNS.doc.test(queryLower) || PATTERNS.pdf.test(queryLower);
    const isAnalysisQuery = PATTERNS.analysisVerbs.test(queryLower) || query.length === 0;
    if (isAnalysisQuery || isDocSpecificQuery) {
      return {
        mode: "document_analysis",
        confidence: 1.0,
        reason: "Active document attachment with analysis request.",
      };
    }
  }

  // 4. Image Analysis (if image present and user wants analysis/explanation)
  if (hasImage) {
    const isAnalysisQuery = PATTERNS.analysisVerbs.test(queryLower) || query.length === 0;
    if (isAnalysisQuery) {
      return {
        mode: "image_analysis",
        confidence: 1.0,
        reason: "Active image attachment with analysis request.",
      };
    }
  }

  // 5. Strong PDF Generation request
  const matchesPdfPhrase = PATTERNS.pdfPhrases.some((phrase) => queryLower.includes(phrase));
  const hasPdfCreation =
    PATTERNS.pdf.test(queryLower) &&
    (PATTERNS.pdfCreation.test(queryLower) ||
      PATTERNS.pdfPhrasePatterns.test(queryLower) ||
      /^pdf\b/i.test(queryLower));
  if ((matchesPdfPhrase || hasPdfCreation) && !hasDocument) {
    return {
      mode: "pdf",
      confidence: 1.0,
      reason: "Matched explicit PDF generation triggers.",
    };
  }

  // 6. Strong DOC Generation request
  const hasDocCreation =
    PATTERNS.doc.test(queryLower) &&
    (PATTERNS.docCreation.test(queryLower) ||
      PATTERNS.docPhrasePatterns.test(queryLower) ||
      /^(doc|docx|word\s+document)\b/i.test(queryLower));
  if (hasDocCreation && !hasDocument) {
    return {
      mode: "doc",
      confidence: 1.0,
      reason: "Matched explicit Word Document creation triggers.",
    };
  }

  // 7. Strong Quiz Start request
  if (PATTERNS.quizStart.test(queryLower)) {
    return {
      mode: "quiz",
      confidence: 1.0,
      reason: "Matched explicit quiz start command.",
    };
  }

  // 8. Continue active quiz (stay in quiz mode if user is answering quiz questions)
  if (lastMode === "quiz") {
    // If user inputs a very short response (e.g. MCQ choices, brief answer) and no other triggers match
    const isShortAnswer = query.length < 15;
    const isObviousSwitch =
      hasDirectImageCreation ||
      matchesPdfPhrase ||
      hasPdfCreation ||
      hasDocCreation ||
      hasImage ||
      hasDocument;

    if (isShortAnswer && !isObviousSwitch) {
      return {
        mode: "quiz",
        confidence: 0.95,
        reason: "Continuing active quiz session with short response.",
      };
    }
  }

  return null;
}

/**
 * Classifies user intent using a lightweight, deterministic Gemini LLM call.
 */
async function classifyIntentWithAI(
  message: string,
  history: ChatRequestBody["history"] = [],
  hasImage: boolean,
  hasDocument: boolean,
  lastMode: IntentMode,
  signal?: AbortSignal
): Promise<IntentResult> {
  const systemPrompt = `You are the Kidoza AI Intent Router. Analyze the user's input and determine their intended action/mode.

You must choose exactly one of these modes:
1. "pdf": User wants to generate structured revision notes, study guides, worksheets, handouts, lecture notes, homework, or ebooks.
2. "doc": User wants to generate a Word document (.docx).
3. "quiz": User wants to start a quiz, practice questions, test their knowledge, get MCQs, or play a trivia game.
4. "image_generation": User wants to generate, draw, paint, visualize, or sketch an image/illustration.
5. "image_analysis": User has provided an image and wants to analyze, describe, explain, or solve a problem/graph in it.
6. "document_analysis": User has provided a document/PDF/text attachment and wants to analyze, summarize, explain, or ask questions about its content.
7. "chat": General conversational chat, greetings, general educational questions, homework help, or explanations that do not fit the specialized modes above.

Context Guidelines:
- If a document is present (hasDocument: true) and the query is about explaining or summarizing it, choose "document_analysis".
- If an image is present (hasImage: true) and the query is about describing or explaining it, choose "image_analysis".
- If the user was in a quiz (lastMode: "quiz") and their message is an answer, a short response, or a request to continue, choose "quiz".
- If the user wants structured learning materials/revision notes/study guides/handouts, choose "pdf".
- If the user wants a word document/DOC, choose "doc".
- If the user wants to draw/create an image, choose "image_generation".
- Otherwise, choose "chat".

Detect customTask:
Identify if the user request indicates one of these task styles:
- "worksheet": Active practice sheets with questions and answers.
- "storytelling": Weaving learning into a story/narrative.
- "coding": Computer programming tutor/code explanation.
- "socratic": Socratic questioning method (scaffolding instead of direct answers).
If none of these apply, set "customTask" to null.

Output must be a single valid JSON object matching this schema:
{
  "mode": "chat" | "quiz" | "pdf" | "doc" | "document_analysis" | "image_generation" | "image_analysis",
  "confidence": number (0.0 to 1.0),
  "customTask": "worksheet" | "storytelling" | "coding" | "socratic" | null,
  "reason": "string describing why this classification was made"
}`;

  // Build a lightweight payload with only the essential history for intent context
  const recentHistory = (history || []).slice(-3).map((h) => ({
    role: h.role === "user" ? "user" : "model",
    parts: [{ text: cleanQuery(h.content || "") }],
  }));

  const inputPayload = JSON.stringify({
    userMessage: cleanQuery(message),
    hasImage,
    hasDocument,
    lastMode,
    history: recentHistory,
  });

  const contents = [
    {
      role: "user",
      parts: [{ text: inputPayload }],
    },
  ];

  try {
    const aiResponse = await generateAIResponse({
      contents,
      systemPrompt,
      generationConfig: {
        temperature: 0.0,
        responseMimeType: "application/json",
        maxOutputTokens: 250,
      },
      signal,
      timeout: 8000, // 8 seconds timeout for intent routing
    });

    if (aiResponse.success) {
      const parsed = extractAndParseJSON(aiResponse.content) as Partial<IntentResult>;
      return {
        mode: parsed.mode || "chat",
        confidence: parsed.confidence ?? 0.8,
        customTask: parsed.customTask || undefined,
        reason: parsed.reason,
      };
    }
  } catch (error) {
    aiLogger.error("IntentRouter", "AI Intent Classification failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Graceful fallback to chat if AI classification fails
  return {
    mode: "chat",
    confidence: 0.5,
    reason: "Fallback due to AI classification timeout or error.",
  };
}

/**
 * Main entrypoint for Intent Routing.
 * Uses zero-latency rules first, and falls back to semantic AI classification if needed.
 */
export async function routeIntent(args: RouteIntentArgs): Promise<IntentResult> {
  const { message, history, hasImage, hasDocument, signal } = args;
  const lastMode = inferActiveModeFromHistory(history);

  // 1. Try deterministic routing first
  const deterministicResult = detectIntentDeterministically(
    message,
    hasImage,
    hasDocument,
    lastMode
  );
  if (deterministicResult) {
    aiLogger.info("IntentRouter", `Deterministic match resolved: ${deterministicResult.mode}`, {
      reason: deterministicResult.reason || "",
    });
    return deterministicResult;
  }

  // 2. Fallback to semantic AI intent classifier
  aiLogger.info("IntentRouter", "No deterministic match. Fallback to AI classifier.");
  const aiResult = await classifyIntentWithAI(
    message,
    history,
    hasImage,
    hasDocument,
    lastMode,
    signal
  );
  aiLogger.info("IntentRouter", `AI classification resolved: ${aiResult.mode}`, {
    confidence: aiResult.confidence,
    reason: aiResult.reason || "",
  });

  return aiResult;
}
