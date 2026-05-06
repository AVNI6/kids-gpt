import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatSession, Message, ChatState } from "@/types/chat.types";

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
  },
});

export const {
  setSessions,
  setCurrentSessionId,
  setMessages,
  addMessage,
  addSession,
  updateSessionTitleInList,
} = chatSlice.actions;

export default chatSlice.reducer;
