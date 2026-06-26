"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SpeechRecognitionEventLocal {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventLocal {
  readonly error: string;
  readonly message?: string;
}

interface SpeechRecognitionLocal extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((ev: SpeechRecognitionEventLocal) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEventLocal) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLocal;
    webkitSpeechRecognition?: new () => SpeechRecognitionLocal;
  }
}

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  currentSessionId: string | null;
  disabled?: boolean;
}

export interface VoiceInputRef {
  stop: () => void;
}

export default forwardRef<VoiceInputRef, VoiceInputProps>(function VoiceInput(
  { onTranscript, currentSessionId, disabled },
  ref
) {
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLocal | null>(null);

  // Store the latest transcript callback in a ref to avoid re-running the initialization useEffect
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // Initialize Speech Recognition ONCE on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      setIsVoiceSupported(true);
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: SpeechRecognitionEventLocal) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          }
        }
        if (finalTranscript) {
          onTranscriptRef.current(finalTranscript);
        }
      };

      rec.onerror = (e: SpeechRecognitionErrorEventLocal) => {
        console.error("Speech recognition error:", e.error, e.message);
        setIsListening(false);
        if (e.error === "not-allowed") {
          toast.error(
            "Microphone permission denied. Please allow microphone access in your browser settings."
          );
        } else if (e.error !== "no-speech") {
          toast.error(`Speech recognition error: ${e.error}`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Stop recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Stop voice input when session changes
  const lastSessionIdRef = useRef(currentSessionId);
  useEffect(() => {
    if (currentSessionId !== lastSessionIdRef.current) {
      lastSessionIdRef.current = currentSessionId;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        setIsListening(false);
      }
    }
  }, [currentSessionId]);

  // Expose stop function to parent
  useImperativeHandle(ref, () => ({
    stop: () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        setIsListening(false);
      }
    },
  }));

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    try {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        recognitionRef.current.start();
        setIsListening(true);
      }
    } catch (err) {
      console.error("Speech recognition toggle error:", err);
      if (err instanceof Error && err.message.includes("already started")) {
        setIsListening(true);
      } else {
        setIsListening(false);
      }
    }
  };

  return (
    <>
      {isVoiceSupported && (
        <Button
          type="button"
          onClick={toggleVoiceInput}
          variant="ghost"
          size="icon"
          disabled={disabled}
          className={cn(
            "h-8 w-8 sm:h-10 sm:w-10 rounded-full transition-all shrink-0 active:scale-95",
            isListening
              ? "bg-red-500 text-white hover:bg-red-600 animate-pulse shadow-md"
              : "hover:bg-muted text-muted-foreground"
          )}
          suppressHydrationWarning={true}
          title={isListening ? "Stop listening" : "Start voice typing"}
        >
          {isListening ? (
            <Square className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 fill-current" />
          ) : (
            <Mic className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
          )}
        </Button>
      )}
    </>
  );
});
