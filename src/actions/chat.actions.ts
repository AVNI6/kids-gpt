import { createClient } from "@/lib/supabase/client";
import { ChatSessionRow, ChatMessageRow } from "@/types/chat.types";
import { SubscriptionPlanRow } from "@/types/subscription.types";
import { uploadChatAttachment } from "@/lib/storage";

const supabase = createClient();

export async function fetchUserSessions(userId?: string): Promise<ChatSessionRow[]> {
  let finalUserId = userId;

  if (!finalUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    finalUserId = user?.id;
  }

  if (!finalUserId) return [];

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, title, updated_at, created_at")
    .eq("user_id", finalUserId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

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

  // We use a try-catch for metadata in case the column is missing in older schemas
  const payload: import("@/types/json").JsonObject = {
    user_id: finalUserId,
    chat_session_id: sessionId,
    type: type,
    format: format,
    file_url: fileUrl,
  };

  // Only add metadata if we're sure about it, or wrap in a way that doesn't break the whole insert
  if (metadata) {
    payload.metadata = metadata;
  }

  const { error } = await supabase.from("generated_materials").insert(payload);

  if (error) {
    console.warn("Error saving generated material:", error.message);
    // If metadata column is missing, try saving without it as fallback
    if (error.message.includes("metadata")) {
      delete payload.metadata;
      await supabase.from("generated_materials").insert(payload);
    } else {
      throw error;
    }
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
    // Remove "images_generated" since it is not a database column
    const { data: usageData, error: fetchDailyError } = await supabase
      .from("daily_usage_tracking")
      .select("*")
      .eq("user_id", finalUserId)
      .eq("usage_date", today)
      .maybeSingle();

    if (fetchDailyError) {
      console.error("[trackDailyUsage] Error fetching daily usage:", fetchDailyError);
    }

    if (usageData) {
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
        console.error("[trackDailyUsage] Error updating daily usage:", updateDailyError);
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
        console.error("[trackDailyUsage] Error inserting daily usage:", insertDailyError);
      }
    }

    // 3. Track Cumulative Overall Usage (whole_usage_tracking)
    let wholeQuery = supabase
      .from("whole_usage_tracking")
      .select("*")
      .eq("user_id", finalUserId)
      .is("deleted_at", null);

    if (subData?.id) {
      wholeQuery = wholeQuery.eq("subscription_id", subData.id);
    } else {
      wholeQuery = wholeQuery.is("subscription_id", null);
    }

    const { data: wholeData, error: fetchWholeError } = await wholeQuery.maybeSingle();

    if (fetchWholeError) {
      console.error("[trackDailyUsage] Error fetching whole usage:", fetchWholeError);
    }

    const defaultLimit = 50000; // Fallback monthly limit (50,000 tokens)
    const limit = monthlyTokenLimit !== null ? monthlyTokenLimit : defaultLimit;

    if (wholeData) {
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
        console.error("[trackDailyUsage] Error updating whole usage:", updateWholeError);
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
        console.error("[trackDailyUsage] Error inserting whole usage:", insertWholeError);
      }
    }
  } catch (err) {
    console.error("[trackDailyUsage] Fatal tracking error:", err);
  }
}

export async function fetchSessionMessages(sessionId: string): Promise<ChatMessageRow[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return (data as ChatMessageRow[]) || [];
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
