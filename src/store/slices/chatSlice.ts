import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatSession, Message } from "@/types/common";

export interface ChatState {
  currentSessionId: string | null;
  sessions: ChatSession[];
  messages: Message[];
  isLoadingSessions: boolean;
  sessionsUserId: string | null;
  hasMoreSessions: boolean;
}

const initialState: ChatState = {
  currentSessionId: null,
  sessions: [],
  messages: [],
  isLoadingSessions: false,
  sessionsUserId: null,
  hasMoreSessions: true,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setSessions: (
      state,
      action: PayloadAction<{ sessions: ChatSession[]; userId?: string | null }>
    ) => {
      state.sessions = action.payload.sessions;
      if (action.payload.userId !== undefined) {
        state.sessionsUserId = action.payload.userId;
      }
      state.hasMoreSessions = action.payload.sessions.length >= 20;
    },
    setLoadingSessions: (state, action: PayloadAction<boolean>) => {
      state.isLoadingSessions = action.payload;
    },
    setCurrentSessionId: (state, action: PayloadAction<string | null>) => {
      state.currentSessionId = action.payload;
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    prependMessages: (state, action: PayloadAction<Message[]>) => {
      const existingIds = new Set(state.messages.map((m) => m.id));
      const filtered = action.payload.filter((m) => !existingIds.has(m.id));
      state.messages = [...filtered, ...state.messages];
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    addSession: (state, action: PayloadAction<ChatSession>) => {
      state.sessions = [action.payload, ...state.sessions];
    },
    appendSessions: (state, action: PayloadAction<ChatSession[]>) => {
      const existingIds = new Set(state.sessions.map((s) => s.id));
      const filtered = action.payload.filter((s) => !existingIds.has(s.id));
      state.sessions = [...state.sessions, ...filtered];
      state.hasMoreSessions = action.payload.length >= 20;
    },
    updateSessionTitleInList: (state, action: PayloadAction<{ id: string; title: string }>) => {
      const session = state.sessions.find((s) => s.id === action.payload.id);
      if (session) {
        session.title = action.payload.title;
      }
    },
    touchSession: (state, action: PayloadAction<string>) => {
      const sessionIndex = state.sessions.findIndex((s) => s.id === action.payload);
      if (sessionIndex > -1) {
        const session = state.sessions[sessionIndex];
        session.updated_at = new Date().toISOString();
        state.sessions.splice(sessionIndex, 1);
        state.sessions.unshift(session);
      }
    },
    updateMessage: (
      state,
      action: PayloadAction<{
        id: string;
        content: string;
        attachmentUrl?: string;
        isImage?: boolean;
      }>
    ) => {
      const msg = state.messages.find((m) => m.id === action.payload.id);
      if (msg) {
        msg.content = action.payload.content;
        if (action.payload.attachmentUrl !== undefined) {
          msg.attachmentUrl = action.payload.attachmentUrl;
        }
        if (action.payload.isImage !== undefined) {
          msg.isImage = action.payload.isImage;
        }
      }
    },
    clearTransientState: (state) => {
      state.messages = [];
      state.currentSessionId = null;
    },
    resetChatState: (state) => {
      state.currentSessionId = null;
      state.sessions = [];
      state.messages = [];
      state.isLoadingSessions = false;
      state.sessionsUserId = null;
      state.hasMoreSessions = true;
    },
  },
});

export const {
  setSessions,
  setLoadingSessions,
  setCurrentSessionId,
  setMessages,
  prependMessages,
  addMessage,
  addSession,
  appendSessions,
  updateSessionTitleInList,
  touchSession,
  updateMessage,
  clearTransientState,
  resetChatState,
} = chatSlice.actions;

export default chatSlice.reducer;
