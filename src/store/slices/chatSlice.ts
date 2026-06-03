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
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    addSession: (state, action: PayloadAction<ChatSession>) => {
      state.sessions = [action.payload, ...state.sessions];
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
  addMessage,
  addSession,
  updateSessionTitleInList,
  updateMessage,
  clearTransientState,
} = chatSlice.actions;

export default chatSlice.reducer;
