import { createClient } from "@/lib/supabase/server";

export async function saveChatMessage(
  sessionId: string,
  role: "user" | "model",
  content: string,
  metadata?: {
    id?: string;
    tokens?: number;
    model?: string;
    responseTime?: number;
    attachmentUrl?: string;
    status?: "pending" | "streaming" | "completed" | "failed";
  },
  userId?: string
) {
  const supabase = await createClient();
  let finalUserId = userId;
  if (!finalUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    finalUserId = user?.id;
  }
  if (!finalUserId) throw new Error("Unauthorized");

  const { error } = await supabase.from("chat_messages").insert({
    id: metadata?.id || undefined,
    user_id: finalUserId,
    session_id: sessionId,
    sender_role: role,
    content,
    token_used: metadata?.tokens ? Math.round(metadata.tokens) : undefined,
    generated_by_model: metadata?.model,
    response_time_ms: metadata?.responseTime ? Math.round(metadata.responseTime) : undefined,
    attachment_url: metadata?.attachmentUrl,
    status: metadata?.status || "completed",
  });

  if (error) {
    console.error("Error saving chat message on server:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw error;
  }

  // Update session's updated_at
  await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  // Check if we need to mark summary as pending
  try {
    const { count, error: countError } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .is("deleted_at", null);

    if (countError) {
      console.error("Error counting messages in saveChatMessage:", countError);
    } else if (count !== null) {
      const { data: sessionData, error: sessionError } = await supabase
        .from("chat_sessions")
        .select("last_summarized_message_count, summary_pending")
        .eq("id", sessionId)
        .single();

      if (sessionError) {
        console.error("Error fetching session metadata in saveChatMessage:", sessionError);
      } else if (sessionData) {
        const lastCount = sessionData.last_summarized_message_count ?? 0;
        const isPending = sessionData.summary_pending ?? false;

        if (count >= 20 && count - lastCount >= 10 && !isPending) {
          const { error: updateSessionError } = await supabase
            .from("chat_sessions")
            .update({ summary_pending: true })
            .eq("id", sessionId);

          if (updateSessionError) {
            console.error(
              "Error updating session summary_pending in saveChatMessage:",
              updateSessionError
            );
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to run summary check in saveChatMessage:", err);
  }
}

export async function updateChatMessage(
  messageId: string,
  updates: {
    content?: string;
    status?: "pending" | "streaming" | "completed" | "failed";
    token_used?: number;
    response_time_ms?: number;
    generated_by_model?: string;
    attachment_url?: string;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("chat_messages").update(updates).eq("id", messageId);

  if (error) {
    console.error("Error updating chat message:", error);
    throw error;
  }
}

export async function trackDailyUsage(
  tokens: number,
  metrics: { isPdf?: boolean; isImage?: boolean; durationMs?: number } = {},
  userId?: string
) {
  try {
    const supabase = await createClient();
    let finalUserId = userId;
    if (!finalUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      finalUserId = user?.id;
    }
    if (!finalUserId) return;

    const today = new Date().toISOString().split("T")[0];
    const roundedTokens = Math.round(tokens);
    const roundedDuration = metrics.durationMs ? Math.round(metrics.durationMs) : 0;

    // 1. Get active subscription and retrieve the plan details
    const { data: subData, error: subError } = await supabase
      .from("subscriptions")
      .select("id, plan_id")
      .eq("user_id", finalUserId)
      .eq("status", "active")
      .maybeSingle();

    if (subError) {
      console.error("[trackDailyUsage] Error fetching subscription:", subError);
    }

    // 2. Track Daily Usage (daily_usage_tracking)
    // Use upsert so concurrent sends and constraint violations are handled gracefully.
    const { data: usageData, error: fetchDailyError } = await supabase
      .from("daily_usage_tracking")
      .select("id, token_used, messages_sent, pdfs_generated")
      .eq("user_id", finalUserId)
      .eq("usage_date", today)
      .maybeSingle();

    if (fetchDailyError) {
      console.error(
        "[trackDailyUsage] Error fetching daily usage:",
        fetchDailyError.message || fetchDailyError.code || JSON.stringify(fetchDailyError)
      );
    }

    if (usageData?.id) {
      const { error: updateDailyError } = await supabase
        .from("daily_usage_tracking")
        .update({
          token_used: (usageData.token_used || 0) + roundedTokens,
          messages_sent: (usageData.messages_sent || 0) + 1,
          pdfs_generated: (usageData.pdfs_generated || 0) + (metrics.isPdf ? 1 : 0),
          updated_at: new Date().toISOString(),
        })
        .eq("id", usageData.id);

      if (updateDailyError) {
        console.error(
          "[trackDailyUsage] Error updating daily usage:",
          updateDailyError.message || updateDailyError.code || JSON.stringify(updateDailyError)
        );
      }
    } else {
      const { error: insertDailyError } = await supabase.from("daily_usage_tracking").insert({
        user_id: finalUserId,
        subscription_id: subData?.id || null,
        usage_date: today,
        token_used: roundedTokens,
        messages_sent: 1,
        pdfs_generated: metrics.isPdf ? 1 : 0,
      });

      if (insertDailyError) {
        console.error(
          "[trackDailyUsage] Error inserting daily usage:",
          insertDailyError.message || insertDailyError.code || JSON.stringify(insertDailyError)
        );
      }
    }

    // 3. Track Cumulative Overall Usage (whole_usage_tracking)
    // Fetch by user_id only (ignore subscription_id filter) so we always find the existing row
    // regardless of how subscription_id was set previously.
    const { data: wholeData, error: fetchWholeError } = await supabase
      .from("whole_usage_tracking")
      .select(
        "id, total_token_used, tokens_remaining, messages_sent, pdfs_generated, total_session_duration_ms"
      )
      .eq("user_id", finalUserId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchWholeError) {
      console.error(
        "[trackDailyUsage] Error fetching whole usage:",
        fetchWholeError.message || fetchWholeError.code || JSON.stringify(fetchWholeError)
      );
    }

    if (wholeData?.id) {
      const newTotalTokenUsed = (wholeData.total_token_used || 0) + roundedTokens;

      const { error: updateWholeError } = await supabase
        .from("whole_usage_tracking")
        .update({
          total_token_used: newTotalTokenUsed,
          tokens_remaining: 999999, // Unlimited placeholder
          messages_sent: (wholeData.messages_sent || 0) + 1,
          pdfs_generated: (wholeData.pdfs_generated || 0) + (metrics.isPdf ? 1 : 0),
          total_session_duration_ms: (wholeData.total_session_duration_ms || 0) + roundedDuration,
          limit_reached: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wholeData.id);

      if (updateWholeError) {
        console.error(
          "[trackDailyUsage] Error updating whole usage:",
          updateWholeError.message || updateWholeError.code || JSON.stringify(updateWholeError)
        );
      }
    } else {
      const { error: insertWholeError } = await supabase.from("whole_usage_tracking").insert({
        user_id: finalUserId,
        subscription_id: subData?.id || null,
        usage_date: today,
        total_token_used: roundedTokens,
        tokens_remaining: 999999, // Unlimited placeholder
        messages_sent: 1,
        pdfs_generated: metrics.isPdf ? 1 : 0,
        total_session_duration_ms: roundedDuration,
        limit_reached: false,
      });

      if (insertWholeError) {
        console.error(
          "[trackDailyUsage] Error inserting whole usage:",
          insertWholeError.message || insertWholeError.code || JSON.stringify(insertWholeError)
        );
      }
    }
  } catch (err) {
    console.error("[trackDailyUsage] Fatal tracking error:", err);
  }
}
