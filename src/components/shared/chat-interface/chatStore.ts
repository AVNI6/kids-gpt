import { create } from "zustand";
import { Message, ChatSession } from "@/types/common";
import { UserProfile } from "@/types/user";
import { useAuth } from "@/hooks/useAuth";

export interface SpeechActions {
  speak: (messageId: string, text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

export interface ChatState {
  messages: Message[];
  sessions: ChatSession[];
  currentSessionId: string | null;
  activeMessageId: string | null;
  sessionOwnerProfile: UserProfile | null;
  onRetry: (() => void) | null;

  // Speech bridge state
  activeSpeakingId: string | null;
  isPlaying: boolean;
  isSpeechLoading: boolean;
  isSpeechPaused: boolean;
  speechActions: SpeechActions | null;

  // Downloads bridge state
  pdfStates: Record<
    string,
    "idle" | "generating" | "uploading" | "downloading" | "success" | "error"
  >;
  docxStates: Record<
    string,
    "idle" | "generating" | "uploading" | "downloading" | "success" | "error"
  >;
  handleDownloadPDF: ((messageId: string) => Promise<void>) | null;
  handleDownloadDocx: ((messageId: string) => Promise<void>) | null;

  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setSessions: (sessions: ChatSession[]) => void;
  addSession: (session: ChatSession) => void;
  setCurrentSessionId: (id: string | null) => void;
  setActiveMessageId: (id: string | null) => void;
  setSessionOwnerProfile: (profile: UserProfile | null) => void;
  setOnRetry: (onRetry: (() => void) | null) => void;
  setSpeechState: (
    state: Partial<{
      activeSpeakingId: string | null;
      isPlaying: boolean;
      isSpeechLoading: boolean;
      isSpeechPaused: boolean;
    }>
  ) => void;
  setSpeechActions: (actions: SpeechActions) => void;
  setDownloadState: (
    state: Partial<{
      pdfStates: Record<
        string,
        "idle" | "generating" | "uploading" | "downloading" | "success" | "error"
      >;
      docxStates: Record<
        string,
        "idle" | "generating" | "uploading" | "downloading" | "success" | "error"
      >;
      handleDownloadPDF: (messageId: string) => Promise<void>;
      handleDownloadDocx: (messageId: string) => Promise<void>;
    }>
  ) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  sessions: [],
  currentSessionId: null,
  activeMessageId: null,
  sessionOwnerProfile: null,
  onRetry: null,

  // Speech defaults
  activeSpeakingId: null,
  isPlaying: false,
  isSpeechLoading: false,
  isSpeechPaused: false,
  speechActions: null,

  // Downloads defaults
  pdfStates: {},
  docxStates: {},
  handleDownloadPDF: null,
  handleDownloadDocx: null,

  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  setActiveMessageId: (id) => set({ activeMessageId: id }),
  setSessionOwnerProfile: (profile) => set({ sessionOwnerProfile: profile }),
  setOnRetry: (onRetry) => set({ onRetry }),

  setSpeechState: (state) => set((s) => ({ ...s, ...state })),
  setSpeechActions: (actions) => set({ speechActions: actions }),
  setDownloadState: (state) => set((s) => ({ ...s, ...state })),

  clearChat: () =>
    set({
      messages: [],
      activeMessageId: null,
      sessionOwnerProfile: null,
      activeSpeakingId: null,
      isPlaying: false,
      isSpeechLoading: false,
      isSpeechPaused: false,
    }),
}));

// 1. useUser hook: wrap Redux auth hook
export function useUser() {
  const auth = useAuth();
  return {
    user: auth.user,
    userProfile: auth.userProfile,
    isUserLoggedIn: auth.isUserLoggedIn,
    userRole: auth.userRole,
  };
}

// 2. useSpeech hook: select from ChatStore
export function useSpeech() {
  const activeSpeakingId = useChatStore((s) => s.activeSpeakingId);
  const isPlaying = useChatStore((s) => s.isPlaying);
  const isSpeechLoading = useChatStore((s) => s.isSpeechLoading);
  const isSpeechPaused = useChatStore((s) => s.isSpeechPaused);
  const speechActions = useChatStore((s) => s.speechActions);

  return {
    activeSpeakingId,
    isPlaying,
    isSpeechLoading,
    isSpeechPaused,
    speak: speechActions?.speak || (() => {}),
    stop: speechActions?.stop || (() => {}),
    pause: speechActions?.pause || (() => {}),
    resume: speechActions?.resume || (() => {}),
  };
}

// 3. useDownloads hook: select from ChatStore
export function useDownloads() {
  const pdfStates = useChatStore((s) => s.pdfStates);
  const docxStates = useChatStore((s) => s.docxStates);
  const handleDownloadPDF = useChatStore((s) => s.handleDownloadPDF);
  const handleDownloadDocx = useChatStore((s) => s.handleDownloadDocx);

  return {
    pdfStates,
    docxStates,
    handleDownloadPDF: handleDownloadPDF || (async () => {}),
    handleDownloadDocx: handleDownloadDocx || (async () => {}),
  };
}

// 4. useChatSession hook: select from ChatStore
export function useChatSession() {
  const messages = useChatStore((s) => s.messages);
  const sessions = useChatStore((s) => s.sessions);
  const currentSessionId = useChatStore((s) => s.currentSessionId);
  const sessionOwnerProfile = useChatStore((s) => s.sessionOwnerProfile);
  const onRetry = useChatStore((s) => s.onRetry);

  return {
    messages,
    sessions,
    currentSessionId,
    sessionOwnerProfile,
    onRetry: onRetry || (() => {}),
  };
}
