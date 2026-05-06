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
