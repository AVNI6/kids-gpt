import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatSession, Message, ChatState } from "@/types/common";

const initialState: ChatState = {
  currentSessionId: null,
  sessions: [],
  messages: [],
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setSessions: (state, action: PayloadAction<ChatSession[]>) => {
      state.sessions = action.payload;
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
    },
    updateSessionTitleInList: (state, action: PayloadAction<{ id: string; title: string }>) => {
      const session = state.sessions.find((s) => s.id === action.payload.id);
      if (session) {
        session.title = action.payload.title;
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
  },
});

export const {
  setSessions,
  setCurrentSessionId,
  setMessages,
  prependMessages,
  addMessage,
  addSession,
  appendSessions,
  updateSessionTitleInList,
  updateMessage,
  clearTransientState,
} = chatSlice.actions;

export default chatSlice.reducer;
