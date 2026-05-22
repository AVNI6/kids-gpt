import { createClient } from "@/lib/supabase/client";
import { ChatSessionRow, ChatMessageRow } from "@/types/chat.types";
import { SubscriptionPlanRow } from "@/types/subscription.types";

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

  console.log("fetchUserSessions: found", data?.length, "sessions");
  return (data as ChatSessionRow[]) || [];
}

export async function createChatSession(title: string = "New chat"): Promise<ChatSessionRow> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: user.id,
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
    tokens?: number;
    model?: string;
    responseTime?: number;
    attachmentUrl?: string;
  }
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("chat_messages").insert({
    user_id: user.id,
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

export async function uploadFileToStorage(file: Blob | File, path: string): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Path format: folder/filename (e.g., pdf/filename.pdf)
  const fullPath = `${path}`;

  const { error } = await supabase.storage.from("materials").upload(fullPath, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    console.error("Error uploading to storage:", error);
    throw error;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("materials").getPublicUrl(fullPath);

  return publicUrl;
}

export async function saveGeneratedMaterial(
  sessionId: string,
  type: string,
  format: string,
  fileUrl: string,
  metadata?: Record<string, unknown>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // We use a try-catch for metadata in case the column is missing in older schemas
  const payload: Record<string, unknown> = {
    user_id: user.id,
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
  metrics: { isPdf?: boolean; isImage?: boolean } = {}
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date().toISOString().split("T")[0];
  const roundedTokens = Math.round(tokens);

  // Get current subscription
  const { data: subData } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  // Try to find existing usage for today
  const { data: usageData } = await supabase
    .from("daily_usage_tracking")
    .select("*")
    .eq("user_id", user.id)
    .eq("usage_date", today)
    .maybeSingle();

  if (usageData) {
    // Update existing
    await supabase
      .from("daily_usage_tracking")
      .update({
        token_used: (usageData.token_used || 0) + roundedTokens,
        messages_sent: (usageData.messages_sent || 0) + 1,
        pdfs_generated: (usageData.pdfs_generated || 0) + (metrics.isPdf ? 1 : 0),
        images_generated: (usageData.images_generated || 0) + (metrics.isImage ? 1 : 0),
        updated_at: new Date().toISOString(),
      })
      .eq("id", usageData.id);
  } else {
    // Insert new
    await supabase.from("daily_usage_tracking").insert({
      user_id: user.id,
      subscription_id: subData?.id,
      usage_date: today,
      token_used: roundedTokens,
      messages_sent: 1,
      pdfs_generated: metrics.isPdf ? 1 : 0,
      images_generated: metrics.isImage ? 1 : 0,
    });
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
  // 1. Delete generated materials associated with this session
  const { error: matError } = await supabase
    .from("generated_materials")
    .delete()
    .eq("chat_session_id", sessionId);

  if (matError) {
    console.warn("Failed to delete generated materials (might not exist):", matError.message);
  }

  // 2. Delete all messages associated with this session
  const { error: msgError } = await supabase
    .from("chat_messages")
    .delete()
    .eq("session_id", sessionId);

  if (msgError) {
    console.error("Failed to delete messages for session:", msgError);
    throw msgError;
  }

  // 3. Finally delete the session itself
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
