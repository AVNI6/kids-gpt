"use server";

import { createClient } from "../lib/supabase/server";
import type { ChatSessionRow, ChatMessageRow } from "../types/chat.types";

const getSupabase = async () => createClient();

export async function fetchUserSessions(): Promise<ChatSessionRow[]> {
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
  const { error } = await supabase.from("chat_sessions").update({ title }).eq("id", sessionId);

  if (error) throw error;
}
