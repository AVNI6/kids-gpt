"use client";

import { useEffect, useRef, useCallback } from "react";
import { useChatStore } from "@/components/shared/chat-interface/chatStore";

// Task 1.1: Define SpeechState interface for atomic state management
interface SpeechState {
  activeSpeakingId: string | null;
  isPlaying: boolean;
  isSpeechLoading: boolean;
  isSpeechPaused: boolean;
}

export function useTextToSpeech() {
  const activeSpeakingId = useChatStore((s) => s.activeSpeakingId);
  const isPlaying = useChatStore((s) => s.isPlaying);
  const isSpeechLoading = useChatStore((s) => s.isSpeechLoading);
  const isSpeechPaused = useChatStore((s) => s.isSpeechPaused);

  // Keep reference to active utterance to prevent garbage collection cut-offs
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Task 1.2: Create updateSpeechState helper for atomic updates directly to Zustand
  const updateSpeechState = useCallback((updates: Partial<SpeechState>) => {
    useChatStore.getState().setSpeechState(updates);
  }, []);

  // Task 1.3: Update stop() to use atomic state updates
  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    updateSpeechState({
      activeSpeakingId: null,
      isPlaying: false,
      isSpeechLoading: false,
      isSpeechPaused: false,
    });
    utteranceRef.current = null;
  }, [updateSpeechState]);

  // Task 1.4: Update pause() to use atomic state updates
  const pause = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
      updateSpeechState({ isSpeechPaused: true, isPlaying: false });
    }
  }, [updateSpeechState]);

  // Task 1.5: Update resume() to use atomic state updates
  const resume = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.resume();
      updateSpeechState({ isSpeechPaused: false, isPlaying: true });
    }
  }, [updateSpeechState]);

  // Task 1.6: Update speak() to use atomic state updates
  const speak = useCallback(
    (messageId: string, text: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      // 1. Cancel any active playback first
      window.speechSynthesis.cancel();

      // 2. Clean/strip markdown
      const cleanedText = stripMarkdown(text);
      if (!cleanedText) return;

      // 3. Set initializing state - ATOMIC UPDATE
      updateSpeechState({
        activeSpeakingId: messageId,
        isSpeechLoading: true,
        isPlaying: false,
        isSpeechPaused: false,
      });

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utteranceRef.current = utterance;

      // Set English voice if available
      const voices = window.speechSynthesis.getVoices();
      const voice =
        voices.find((v) => v.lang.includes("en-US") && v.name.includes("Google")) ||
        voices.find((v) => v.lang.includes("en-US")) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];
      if (voice) {
        utterance.voice = voice;
      }

      // Task 1.6: Update event handlers to use atomic state updates
      utterance.onstart = () => {
        updateSpeechState({
          isSpeechLoading: false,
          isPlaying: true,
          isSpeechPaused: false,
        });
      };

      utterance.onend = () => {
        updateSpeechState({
          activeSpeakingId: null,
          isPlaying: false,
          isSpeechLoading: false,
          isSpeechPaused: false,
        });
        utteranceRef.current = null;
      };

      utterance.onerror = () => {
        // Only reset states if this was the active utterance
        if (utteranceRef.current === utterance) {
          updateSpeechState({
            activeSpeakingId: null,
            isPlaying: false,
            isSpeechLoading: false,
            isSpeechPaused: false,
          });
          utteranceRef.current = null;
        }
      };

      utterance.onpause = () => {
        updateSpeechState({ isSpeechPaused: true, isPlaying: false });
      };

      utterance.onresume = () => {
        updateSpeechState({ isSpeechPaused: false, isPlaying: true });
      };

      window.speechSynthesis.speak(utterance);
    },
    [updateSpeechState]
  );

  // Stop TTS when the hook/component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Task 1.7: Return state properties
  return {
    activeSpeakingId,
    isPlaying,
    isSpeechLoading,
    isSpeechPaused,
    speak,
    stop,
    pause,
    resume,
  };
}

function stripMarkdown(text: string): string {
  if (!text) return "";

  let cleanText = text;

  // 1. Remove code blocks (block of ```...```)
  cleanText = cleanText.replace(/```[\s\S]*?```/g, "");

  // 2. Remove inline code backticks
  cleanText = cleanText.replace(/`([^`]+)`/g, "$1");

  // 3. Remove markdown headers (# Title)
  cleanText = cleanText.replace(/^\s*#{1,6}\s+/gm, "");

  // 4. Replace links [Text](URL) with just Text
  cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 5. Remove bold and italic formatting (* or _ or ** or __)
  cleanText = cleanText.replace(/(\*\*|__)(.*?)\1/g, "$2");
  cleanText = cleanText.replace(/(\*|_)(.*?)\1/g, "$2");

  // 6. Remove blockquote markers (> )
  cleanText = cleanText.replace(/^\s*>\s+/gm, "");

  // 7. Remove list bullet points (*, -, +) or numbers (1., 2.) at start of lines
  cleanText = cleanText.replace(/^\s*[\*\-\+]\s+/gm, "");
  cleanText = cleanText.replace(/^\s*\d+\.\s+/gm, "");

  // 8. Remove absolute URLs
  cleanText = cleanText.replace(/https?:\/\/\S+/gi, "");

  // 9. Clean up extra whitespace and newlines
  cleanText = cleanText.replace(/\n+/g, " ");
  cleanText = cleanText.trim();

  return cleanText;
}
