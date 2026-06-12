import { createAdminClient } from "@/lib/supabase/admin";
import { generateAIResponse } from "@/lib/ai/model-orchestrator";
import { aiLogger } from "@/lib/ai/logger";

interface SessionSummaryTarget {
  id: string;
  summary: string | null;
  last_summarized_message_count: number | null;
  user_id: string;
}

export async function processPendingSummaries(options?: { sessionId?: string; force?: boolean }) {
  const supabase = createAdminClient();
  let sessions: SessionSummaryTarget[] = [];

  if (options?.sessionId) {
    const { data: session, error: fetchError } = await supabase
      .from("chat_sessions")
      .select("id, summary, last_summarized_message_count, user_id")
      .eq("id", options.sessionId)
      .maybeSingle();

    if (fetchError) {
      aiLogger.error("SummaryService", `Failed to fetch session ${options.sessionId}`, {
        error: fetchError.message,
      });
      throw fetchError;
    }
    if (session) {
      sessions = [session as SessionSummaryTarget];
    }
  } else if (options?.force) {
    const { data, error: fetchError } = await supabase
      .from("chat_sessions")
      .select("id, summary, last_summarized_message_count, user_id")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(5);

    if (fetchError) {
      aiLogger.error("SummaryService", "Failed to fetch sessions for force summary", {
        error: fetchError.message,
      });
      throw fetchError;
    }
    sessions = (data || []) as SessionSummaryTarget[];
  } else {
    const { data, error: fetchError } = await supabase
      .from("chat_sessions")
      .select("id, summary, last_summarized_message_count, user_id")
      .eq("summary_pending", true)
      .limit(5);

    if (fetchError) {
      aiLogger.error("SummaryService", "Failed to fetch pending sessions", {
        error: fetchError.message,
      });
      throw fetchError;
    }
    sessions = (data || []) as SessionSummaryTarget[];
  }

  if (!sessions || sessions.length === 0) {
    aiLogger.info("SummaryService", "No sessions to process");
    return { processedCount: 0, sessions: [] };
  }

  aiLogger.info("SummaryService", `Processing ${sessions.length} sessions`);

  let processedCount = 0;

  for (const session of sessions) {
    const sessionId = session.id;
    const currentSummary = session.summary || "";
    const lastSummarizedCount = session.last_summarized_message_count ?? 0;

    try {
      // 2. Fetch total non-deleted message count
      const { count: totalCount, error: countError } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId)
        .is("deleted_at", null);

      if (countError) {
        aiLogger.error("SummaryService", `Error counting messages for session ${sessionId}`, {
          error: countError.message,
        });
        continue;
      }

      const totalMessageCount = totalCount ?? 0;

      // 3. Fetch all unsummarized messages since last_summarized_message_count
      const { data: messages, error: messagesError } = await supabase
        .from("chat_messages")
        .select("sender_role, content, created_at")
        .eq("session_id", sessionId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (messagesError) {
        aiLogger.error("SummaryService", `Error fetching messages for session ${sessionId}`, {
          error: messagesError.message,
        });
        continue;
      }

      // Slice the messages in JS to get the unsummarized messages
      const newMessages = messages.slice(lastSummarizedCount);

      if (newMessages.length === 0) {
        aiLogger.warn(
          "SummaryService",
          `Session ${sessionId} has summary_pending=true but 0 new messages since index ${lastSummarizedCount}. Resetting pending flag.`
        );
        await supabase
          .from("chat_sessions")
          .update({
            summary_pending: false,
            last_summarized_message_count: totalMessageCount,
          })
          .eq("id", sessionId);
        continue;
      }

      // Format the messages for the prompt
      const formattedTurns = newMessages
        .map((m) => `${m.sender_role === "user" ? "Student" : "Tutor"}: ${m.content}`)
        .join("\n\n");

      // 4. Prompt Gemini to merge the current summary and the new message turns
      const promptText = `
You are an expert educational AI tutor. Your goal is to write a concise, running summary of a tutoring conversation between a student and a tutor.

Here is the current running summary of the conversation so far:
${currentSummary ? `"""\n${currentSummary}\n"""` : "(No previous summary)"}

Here are the new conversation messages that have occurred since the last summary:
"""
${formattedTurns}
"""

Please update the running summary by merging the new conversation turns into it.
Ensure the updated summary satisfies the following guidelines:
1. Focus on the student's learning progress, concepts they grasped (strengths), concepts they struggled with (weaknesses), their interests discussed, and their learning style.
2. Keep the summary concise and under 500-700 words.
3. Maintain continuity. Do not lose key context from the previous summary, but compress older details if needed.
4. Do NOT output any conversational filler. Output ONLY the updated summary.
`.trim();

      const aiResponse = await generateAIResponse({
        contents: [
          {
            role: "user",
            parts: [{ text: promptText }],
          },
        ],
        systemPrompt:
          "You are a tutoring session summarizer. Always output clean, structured, and concise summaries without any markdown commentary or greeting.",
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1000,
        },
      });

      if (!aiResponse.success || !aiResponse.content) {
        aiLogger.error("SummaryService", `AI response failed for session ${sessionId}`, {
          error: aiResponse.error || "Unknown AI error",
        });
        continue;
      }

      const updatedSummary = aiResponse.content.trim();

      // 5. Save updated summary and metadata to database
      const { error: updateError } = await supabase
        .from("chat_sessions")
        .update({
          summary: updatedSummary,
          last_summarized_message_count: totalMessageCount,
          summary_updated_at: new Date().toISOString(),
          summary_pending: false,
        })
        .eq("id", sessionId);

      if (updateError) {
        aiLogger.error(
          "SummaryService",
          `Failed to save updated summary for session ${sessionId}`,
          { error: updateError.message }
        );
        continue;
      }

      aiLogger.info(
        "SummaryService",
        `Successfully summarized session ${sessionId}. Messages summarized: ${newMessages.length}. Total messages: ${totalMessageCount}`
      );
      processedCount++;
    } catch (sessionErr) {
      aiLogger.error("SummaryService", `Error processing session ${sessionId}`, {
        error: sessionErr instanceof Error ? sessionErr.message : String(sessionErr),
      });
    }
  }

  return { processedCount, sessionsProcessed: sessions.map((s) => s.id) };
}
