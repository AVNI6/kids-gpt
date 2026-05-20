// Shared types for the AI orchestration system

export type UserRole = "kid" | "parent" | "teacher";

export type LearningStage = "preschool" | "elementary" | "middle-school" | "high-school";

export type AIProvider = "gemini" | "groq";

export type PdfTheme = "kid" | "clean" | "teacher";

export interface ModelConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  timeout?: number;
}

export interface AIResponse {
  success: boolean;
  provider: AIProvider;
  model: string;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  fallbackUsed: boolean;
  error?: string;
}

export interface PdfGenerationResult {
  overview: string;
  pdfContent: string;
  pdfTheme: PdfTheme;
  suggestedTitle: string;
}

export interface ChatContext {
  sessionId: string | null;
  role: UserRole;
  learningStage?: LearningStage;
  message: string;
  image?: string;
  history: Array<{ role: string; content: string }>;
  isPdfRequest: boolean;
}

export interface GeminiContent {
  role: string;
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
}

export interface ProviderCallOptions {
  model: string;
  apiKey: string;
  contents: GeminiContent[];
  generationConfig?: Record<string, unknown>;
  signal?: AbortSignal;
  timeout?: number;
}
