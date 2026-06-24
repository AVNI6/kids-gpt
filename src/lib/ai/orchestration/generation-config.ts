import { ChatMode } from "../prompts";
import type { JsonObject } from "@/types/json";

export function getGenerationConfig(mode: ChatMode): JsonObject | undefined {
  switch (mode) {
    case "pdf":
    case "doc":
      return {
        temperature: 0.1,
        responseMimeType: "application/json",
      };
    case "quiz":
      return {
        temperature: 0.2,
      };
    case "document_analysis":
    case "image_analysis":
      return {
        temperature: 0.4,
      };
    case "chat":
      return {
        temperature: 0.7,
      };
    default:
      return undefined;
  }
}
