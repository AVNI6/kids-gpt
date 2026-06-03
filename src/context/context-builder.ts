// import { GeminiContent, ChatMessage } from "@/types/common";

// const MAX_RECENT_MESSAGES = 12;

// /**
//  * Builds a dynamic context window for the Gemini API.
//  * Follows the pattern: System Prompt -> (Optional Summary) -> Last N Messages.
//  */
// export function buildChatContext(
//   messages: ChatMessage[],
//   systemPrompt: string,
//   summary?: string | null
// ): GeminiContent[] {
//   const contents: GeminiContent[] = [];

//   // 1. System Prompt (as user message for Gemini context setting if needed,
//   // though we usually pass it in the prompt itself, centralizing it here for clarity)
//   // Note: For Gemini, we often append system instructions to the first user message
//   // or use the systemInstruction field. We'll stick to the "User message enrichment"
//   // pattern we've been using, but structured.

//   // 2. Add Summary of old conversation if it exists
//   if (summary) {
//     contents.push({
//       role: "model",
//       parts: [{ text: `CONTEXT_SUMMARY: Here is a summary of our previous conversation to help me remember: ${summary}` }]
//     });
//   }

//   // 3. Slice the most recent messages
//   const recentMessages = messages.slice(-MAX_RECENT_MESSAGES);

//   // 4. Map messages to Gemini format
//   recentMessages.forEach((msg) => {
//     contents.push({
//       role: msg.role === "user" ? "user" : "model",
//       parts: [{ text: msg.content }]
//     });
//   });

//   return contents;
// }
