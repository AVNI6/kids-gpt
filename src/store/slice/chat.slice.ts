import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  isImage?: boolean;
  uploadedImage?: string;
  pdfContent?: string;
  isPdfRequest?: boolean;
}

interface ChatState {
  currentSessionId: string | null;
  sessions: ChatSession[];
  messages: Message[];
}

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
  updateSessionTitleInList,
} = chatSlice.actions;

export default chatSlice.reducer;
