export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  session_type: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    role: string | null;
  } | null;
}

export type UserRole = "kid" | "parent" | "teacher";

export type PdfTheme = "kid" | "clean" | "teacher";

export interface Message {
  id: string;
  userId?: string;
  senderProfile?: {
    user_id: string;
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
    role?: string | null;
  } | null;
  role: "user" | "model";
  content: string;
  isImage?: boolean;
  uploadedImage?: string;
  pdfContent?: string;
  isPdfRequest?: boolean;
  pdfTheme?: PdfTheme;
  isDocRequest?: boolean;
  docContent?: string;
  docTheme?: PdfTheme;
  suggestedTitle?: string;
  token_used?: number;
  attachmentUrl?: string | null;
  fileName?: string | null;
  isVoiceInput?: boolean;
  status?: "pending" | "streaming" | "completed" | "failed" | "stopped";
  stopReason?: "user_aborted" | "error";
  created_at?: string;
}

export interface ChatState {
  currentSessionId: string | null;
  sessions: ChatSession[];
  messages: Message[];
}

export interface ChatSessionRow {
  id: string;
  user_id: string;
  title: string;
  session_type: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  summary?: string | null;
  summary_updated_at?: string | null;
  last_summarized_message_count?: number;
  summary_pending?: boolean;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    role: string | null;
  } | null;
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
  status: "pending" | "streaming" | "completed" | "failed" | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  profile?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    role: string | null;
  } | null;
}

export interface GeneratedMaterialRow {
  id: string;
  user_id: string;
  chat_session_id: string;
  type: "pdf" | "image";
  format: string;
  file_url: string;
  metadata: import("@/types/json").JsonObject | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// API and Gemini Specific Types
export interface ChatMessage {
  role: string;
  content: string;
  image?: string;
  generatedImage?: string;
}

export interface LearnerContext {
  age?: number;
  grade?: string | number;
  subject?: string;
  currentTopic?: string;
  learningGoal?: string;
}

export interface ActivityContext {
  activityName?: string;
  currentStep?: string;
  objective?: string;
}

export interface ChatRequestBody {
  message: string;
  image?: string;
  history?: ChatMessage[];
  role?: UserRole;
  customTask?: "worksheet" | "storytelling" | "coding" | "socratic";
  responseStyle?: "concise" | "detailed" | "interactive" | "step_by_step";
  age?: number;
  learnerContext?: LearnerContext;
  activityContext?: ActivityContext;
  sessionId?: string;
}

export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

export interface StudentLearningProfile {
  student_id: string;
  strengths: string[];
  weaknesses: string[];
  interests: string[];
  preferred_learning_style: string;
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}
