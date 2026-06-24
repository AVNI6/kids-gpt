import { createClient } from "@/lib/supabase/client";
import { ChatSessionRow, ChatMessageRow } from "@/types/common";
import { SubscriptionPlanRow } from "@/types/subscription.types";
import { uploadChatAttachment } from "@/lib/storage";

const supabase = createClient();

export async function fetchUserSessions(
  userId?: string,
  cursorUpdatedAt?: string,
  cursorId?: string,
  limit: number = 20
): Promise<ChatSessionRow[]> {
  let finalUserId = userId;

  if (!finalUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    finalUserId = user?.id;
  }

  if (!finalUserId) return [];

  let query = supabase
    .from("chat_sessions")
    .select("id, title, updated_at, created_at")
    .eq("user_id", finalUserId)
    .is("deleted_at", null);

  if (cursorUpdatedAt && cursorId) {
    query = query.or(
      `updated_at.lt.${cursorUpdatedAt},and(updated_at.eq.${cursorUpdatedAt},id.lt.${cursorId})`
    );
  }

  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }

  return (data as ChatSessionRow[]) || [];
}

export async function createChatSession(
  title: string = "New chat",
  userId?: string
): Promise<ChatSessionRow> {
  let finalUserId = userId;
  if (!finalUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    finalUserId = user?.id;
  }
  if (!finalUserId) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: finalUserId,
      title,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create session");
  return data as ChatSessionRow;
}

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
  },
  userId?: string
) {
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
  });

  if (error) {
    console.error("Error saving chat message:", error);
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

export async function updateChatMessageAttachment(messageId: string, attachmentUrl: string) {
  const { error } = await supabase
    .from("chat_messages")
    .update({ attachment_url: attachmentUrl })
    .eq("id", messageId);

  if (error) {
    console.error("Error updating message attachment:", error);
    throw error;
  }
}

export async function uploadFileToStorage(
  file: Blob | File,
  path: string,
  userId?: string
): Promise<string> {
  let finalUserId = userId;
  if (!finalUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    finalUserId = user?.id;
  }
  if (!finalUserId) throw new Error("Unauthorized");

  // Path format: folder/filename (e.g., pdf/filename.pdf)
  const fullPath = `${path}`;

  const result = await uploadChatAttachment(supabase, finalUserId, file, fullPath);

  if (!result.success || !result.publicUrl) {
    console.error("Error uploading to storage:", result.error);
    throw new Error(result.error || "Failed to upload file.");
  }

  return result.publicUrl;
}

export async function saveGeneratedMaterial(
  sessionId: string,
  type: string,
  format: string,
  fileUrl: string,
  metadata?: import("@/types/json").JsonObject,
  userId?: string
) {
  let finalUserId = userId;
  if (!finalUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    finalUserId = user?.id;
  }
  if (!finalUserId) throw new Error("Unauthorized");

  const payload: import("@/types/json").JsonObject = {
    user_id: finalUserId,
    chat_session_id: sessionId,
    type: type,
    format: format,
    file_url: fileUrl,
  };

  const { error } = await supabase.from("generated_materials").insert(payload);

  if (error) {
    console.error("Error saving generated material:", error.message);
    throw error;
  }
}

export async function trackDailyUsage(
  tokens: number,
  metrics: { isPdf?: boolean; isImage?: boolean; durationMs?: number } = {},
  userId?: string
) {
  try {
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

    let monthlyTokenLimit: number | null = null;
    if (subData?.plan_id) {
      const { data: planData, error: planError } = await supabase
        .from("subscriptions_plans")
        .select("monthly_token_limit")
        .eq("id", subData.plan_id)
        .maybeSingle();

      if (planError) {
        console.error("[trackDailyUsage] Error fetching plan limits:", planError);
      } else if (planData) {
        monthlyTokenLimit = planData.monthly_token_limit;
      }
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

    const defaultLimit = 50000; // Fallback monthly limit (50,000 tokens)
    const limit = monthlyTokenLimit !== null ? monthlyTokenLimit : defaultLimit;

    if (wholeData?.id) {
      const newTotalTokenUsed = (wholeData.total_token_used || 0) + roundedTokens;
      const tokensRemaining = Math.max(0, limit - newTotalTokenUsed);
      const limitReached = newTotalTokenUsed >= limit;

      const { error: updateWholeError } = await supabase
        .from("whole_usage_tracking")
        .update({
          total_token_used: newTotalTokenUsed,
          tokens_remaining: tokensRemaining,
          messages_sent: (wholeData.messages_sent || 0) + 1,
          pdfs_generated: (wholeData.pdfs_generated || 0) + (metrics.isPdf ? 1 : 0),
          total_session_duration_ms: (wholeData.total_session_duration_ms || 0) + roundedDuration,
          limit_reached: limitReached,
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
      const tokensRemaining = Math.max(0, limit - roundedTokens);
      const limitReached = roundedTokens >= limit;

      const { error: insertWholeError } = await supabase.from("whole_usage_tracking").insert({
        user_id: finalUserId,
        subscription_id: subData?.id || null,
        usage_date: today,
        total_token_used: roundedTokens,
        tokens_remaining: tokensRemaining,
        messages_sent: 1,
        pdfs_generated: metrics.isPdf ? 1 : 0,
        total_session_duration_ms: roundedDuration,
        limit_reached: limitReached,
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

// Helper to pre-sign URLs in bulk on the server
export async function preSignMessageUrls(
  messages: ChatMessageRow[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any
): Promise<ChatMessageRow[]> {
  const pathsToSign: string[] = [];
  const msgMap = new Map<string, Array<{ type: "content" | "attachment"; index: number }>>();

  messages.forEach((msg, idx) => {
    // 1. Check attachment URL
    if (msg.attachment_url && msg.attachment_url.includes("/object/public/materials/")) {
      const path = msg.attachment_url.split("/object/public/materials/")[1];
      if (path) {
        pathsToSign.push(path);
        const list = msgMap.get(path) || [];
        list.push({ type: "attachment", index: idx });
        msgMap.set(path, list);
      }
    }
    // 2. Check content (if message content contains a materials URL)
    if (msg.content && msg.content.includes("/object/public/materials/")) {
      const path = msg.content.split("/object/public/materials/")[1];
      if (path) {
        pathsToSign.push(path);
        const list = msgMap.get(path) || [];
        list.push({ type: "content", index: idx });
        msgMap.set(path, list);
      }
    }
  });

  if (pathsToSign.length > 0) {
    try {
      const { data: signedUrls, error } = await supabaseClient.storage
        .from("materials")
        .createSignedUrls(pathsToSign, 900);
      if (!error && signedUrls) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signedUrls.forEach((item: any) => {
          const list = msgMap.get(item.path);
          if (list && item.signedUrl) {
            list.forEach((mapping) => {
              if (mapping.type === "attachment") {
                messages[mapping.index].attachment_url = item.signedUrl;
              } else {
                messages[mapping.index].content = item.signedUrl;
              }
            });
          }
        });
      }
    } catch (err) {
      console.error("Bulk pre-signing failed:", err);
    }
  }
  return messages;
}

export async function fetchSessionMessages(
  sessionId: string,
  cursorCreatedAt?: string,
  cursorId?: string,
  limit: number = 30
): Promise<ChatMessageRow[]> {
  // Ensure the client has restored its auth session from storage before running RLS queries
  await supabase.auth.getSession();

  let query = supabase
    .from("chat_messages")
    .select("*, profile:profile(user_id, first_name, last_name, avatar_url, role)")
    .eq("session_id", sessionId)
    .is("deleted_at", null);

  if (cursorCreatedAt && cursorId) {
    query = query.or(
      `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`
    );
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  const results = (data as ChatMessageRow[]) || [];
  const reversed = [...results].reverse();
  return preSignMessageUrls(reversed, supabase);
}

export async function updateSessionTitle(sessionId: string, title: string) {
  const { error } = await supabase.from("chat_sessions").update({ title }).eq("id", sessionId);

  if (error) throw error;
}

export async function deleteChatSession(sessionId: string) {
  // 1. Delete generated materials and messages concurrently to reduce sequential roundtrips
  const [matRes, msgRes] = await Promise.all([
    supabase.from("generated_materials").delete().eq("chat_session_id", sessionId),
    supabase.from("chat_messages").delete().eq("session_id", sessionId),
  ]);

  if (matRes.error) {
    console.warn("Failed to delete generated materials (might not exist):", matRes.error.message);
  }

  if (msgRes.error) {
    console.error("Failed to delete messages for session:", msgRes.error);
    throw msgRes.error;
  }

  // 2. Finally delete the session itself
  const { error: finalError } = await supabase.from("chat_sessions").delete().eq("id", sessionId);

  if (finalError) {
    console.error("Hard delete failed:", finalError);
    throw finalError;
  }
}

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlanRow[]> {
  const { data, error } = await supabase
    .from("subscriptions_plans")
    .select("*")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("price", { ascending: true });

  if (error) {
    console.error("Error fetching subscription plans:", error);
    return [];
  }

  return (data as SubscriptionPlanRow[]) || [];
}
