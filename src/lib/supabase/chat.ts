import { createClient } from "./client";

const supabase = createClient();

export interface ChatSessionRow {
  id: string;
  user_id: string;
  title: string;
  session_type: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ChatMessageRow {
  id: string;
  user_id: string;
  session_id: string;
  sender_role: "user" | "model";
  content: string;
  token_used: number | null;
  response_time_ms: number | null;
  generated_by_model: string | null;
  is_flagged: boolean | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export async function fetchUserSessions(): Promise<ChatSessionRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
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

export async function saveChatMessage(sessionId: string, role: "user" | "model", content: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("chat_messages").insert({
    user_id: user.id,
    session_id: sessionId,
    sender_role: role,
    content,
  });

  if (error) throw error;

  // Update session's updated_at
  await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);
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
