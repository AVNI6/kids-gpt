"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Send, Plus, X, FileText, BrainCircuit, Camera } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import VoiceInput, { VoiceInputRef } from "./mic/VoiceInput";
import { toast } from "sonner";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Props = {
  onSend: (
    text: string,
    img: string | null,
    fileText: string | null,
    fileMeta: string | null
  ) => void;
  onStop?: () => void;
  isLoading: boolean;
  isAuthLoading?: boolean;
  currentSessionId: string | null;
};

export interface ChatFooterRef {
  setInputText: (text: string) => void;
}

const getWordCount = (text: string): number => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

export default forwardRef<ChatFooterRef, Props>(function ChatFooter(
  { onSend, onStop, isLoading, isAuthLoading = false, currentSessionId },
  ref
) {
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voiceInputRef = useRef<VoiceInputRef>(null);

  // Auto-grow height of textarea based on content
  useIsomorphicLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Temporarily hide overflow to prevent scrollbar flickering and layout/width reflow shifts
    const originalOverflowY = textarea.style.overflowY;
    textarea.style.overflowY = "hidden";
    textarea.style.height = "auto";

    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.min(scrollHeight, 180)}px`;

    // Restore overflow if content height exceeds the max height limit
    if (scrollHeight > 180) {
      textarea.style.overflowY = "auto";
    } else {
      textarea.style.overflowY = originalOverflowY;
    }
  }, [input]);

  // Expose imperative handle to set input externally (e.g. from suggestions click)
  useImperativeHandle(ref, () => ({
    setInputText: (text: string) => {
      setInput(text);
      // Auto focus textarea after selection
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    },
  }));

  // Auto-focus input on mount, when session changes, or when loading state finishes
  useEffect(() => {
    if (!isAuthLoading && !isLoading && !isParsing) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentSessionId, isAuthLoading, isLoading, isParsing]);

  // Global keydown listener to auto-focus textarea when user starts typing
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Ignore if user is already focusing an input, textarea, or contenteditable element
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      // Ignore if input is disabled due to loading
      if (isAuthLoading || isLoading || isParsing) return;

      // Focus only for single printable characters (length 1)
      if (e.key.length === 1) {
        textareaRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isAuthLoading, isLoading, isParsing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (getWordCount(input) > 2000) {
        toast.error("cant exceed 2000 words ..");
        return;
      }
      handleSend();
    }
  };

  // Sync inputs when session changes to prevent leaking data across sessions
  useEffect(() => {
    setInput("");
    setImage(null);
    setFileContent(null);
    setFileName(null);
    voiceInputRef.current?.stop();
  }, [currentSessionId]);

  // Sync native file inputs when image/fileName state is cleared
  useEffect(() => {
    if (!image && !fileName) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  }, [image, fileName]);

  const handleFile = useCallback(async (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
      setFileContent(null);
      setFileName(null);
    } else if (file.type === "application/pdf") {
      const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_PDF_SIZE) {
        alert("The PDF file is too large. Please upload a file smaller than 10MB.");
        return;
      }

      setIsParsing(true);
      try {
        const getPDFText = (await import("react-pdftotext")).default;

        // Wrap parsing with a 20-second timeout to prevent deadlocks
        const parsePromise = getPDFText(file);
        const timeoutPromise = new Promise<string>((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout (20s) exceeded while parsing the PDF.")),
            20000
          )
        );

        const text = await Promise.race([parsePromise, timeoutPromise]);
        setImage(null);
        setFileName(file.name);
        setFileContent(text);
      } catch (e) {
        console.error("PDF parsing failed:", e);
        const errorMsg = e instanceof Error ? e.message : "Failed to read PDF text.";
        alert(`${errorMsg} Please try another file.`);
      } finally {
        setIsParsing(false);
      }
    } else {
      const MAX_TEXT_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_TEXT_SIZE) {
        alert("The file is too large. Please upload a file smaller than 5MB.");
        return;
      }

      // Basic text file support
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(null);
        setFileName(file.name);
        setFileContent(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  }, []);

  const removeAttachment = () => {
    setImage(null);
    setFileContent(null);
    setFileName(null);
  };

  const handleSend = () => {
    if (getWordCount(input) > 2000) {
      toast.error("cant exceed 2000 words ..");
      return;
    }
    if ((!input.trim() && !image && !fileName) || isLoading || isParsing || isAuthLoading) {
      return;
    }
    voiceInputRef.current?.stop();
    onSend(input, image, fileContent, fileName);
    setInput("");
    setImage(null);
    setFileContent(null);
    setFileName(null);
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) {
        void handleFile(f);
      }
    },
    [handleFile]
  );

  useEffect(() => {
    const handleDocumentDragOver = (event: DragEvent) => {
      event.preventDefault();
    };

    const handleDocumentDrop = (event: DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
    };

    const handleDocumentDragEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener("dragover", handleDocumentDragOver);
    document.addEventListener("drop", handleDocumentDrop);
    document.addEventListener("dragend", handleDocumentDragEnd);

    return () => {
      document.removeEventListener("dragover", handleDocumentDragOver);
      document.removeEventListener("drop", handleDocumentDrop);
      document.removeEventListener("dragend", handleDocumentDragEnd);
    };
  }, []);

  return (
    <div
      className="relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <footer className="bg-background px-2 sm:px-4 pb-4 sm:pb-6">
        <div className="w-full max-w-3xl mx-auto">
          <div className="relative bg-muted/30 border border-border rounded-[28px] overflow-hidden">
            <input
              type="file"
              accept="image/*"
              ref={mediaInputRef}
              className="hidden"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
                setIsPopoverOpen(false);
              }}
            />
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              ref={fileInputRef}
              className="hidden"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
                setIsPopoverOpen(false);
              }}
            />

            {/* Previews */}
            {(image || fileName || isParsing) && (
              <div className="px-3 pt-3">
                <div className="relative inline-block group">
                  {isParsing ? (
                    <div className="w-28 h-28 rounded-2xl bg-muted border border-border flex flex-col items-center justify-center p-2">
                      <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-2" />
                      <span className="text-[10px] text-muted-foreground">Reading...</span>
                    </div>
                  ) : image ? (
                    <Image
                      src={image}
                      alt="preview"
                      width={112}
                      height={112}
                      className="w-28 h-28 rounded-2xl object-cover border border-border shadow-sm transition-opacity group-hover:opacity-90"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center p-2 text-center overflow-hidden">
                      <FileText className="w-8 h-8 text-blue-500 mb-1" />
                      <span className="text-[10px] font-medium text-blue-700 truncate w-full px-1">
                        {fileName}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={removeAttachment}
                    className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-destructive hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-end px-2 py-2 min-h-[56px]">
              <div className="mb-1 shrink-0">
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger
                    type="button"
                    suppressHydrationWarning={true}
                    className={cn(
                      "h-10 w-10 flex items-center justify-center rounded-full transition-all active:scale-90 hover:bg-muted",
                      isPopoverOpen && "bg-muted"
                    )}
                  >
                    <Plus
                      className={cn("w-5 h-5 transition-transform", isPopoverOpen && "rotate-45")}
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="start"
                    sideOffset={16}
                    className="w-48 p-1 rounded-2xl shadow-xl border-border bg-popover z-50 animate-in fade-in-50 zoom-in-95 duration-100"
                  >
                    <button
                      onClick={() => {
                        mediaInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-accent transition-colors text-left group"
                    >
                      <div className="p-2 rounded-lg shrink-0 transition-colors text-pink-500 group-hover:bg-white">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-foreground/80">Add Media</span>
                    </button>

                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-accent transition-colors text-left group"
                    >
                      <div className="p-2 rounded-lg shrink-0 transition-colors text-blue-500 group-hover:bg-white">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-foreground/80">Upload Files</span>
                    </button>

                    <button
                      onClick={() => {
                        setInput(
                          "Start Quiz: ask me one question at a time, wait for my answer, tell me if I'm right, then automatically ask the next question. Stop if I say stop, exit, quit, or end quiz."
                        );
                        setIsPopoverOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-accent transition-colors text-left group"
                    >
                      <div className="p-2 rounded-lg shrink-0 transition-colors text-amber-500 group-hover:bg-white">
                        <BrainCircuit className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-foreground/80">Start Quiz</span>
                    </button>
                  </PopoverContent>
                </Popover>
              </div>

              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything"
                className="flex-1 min-w-0 resize-none bg-transparent py-3 px-3 text-base border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 min-h-[40px] max-h-[180px] overflow-y-auto scrollbar-none text-foreground placeholder:text-muted-foreground/60 align-bottom leading-relaxed text-left whitespace-pre-wrap break-words"
                suppressHydrationWarning={true}
              />

              <div className="flex items-center gap-1.5 mb-1 shrink-0">
                <VoiceInput
                  ref={voiceInputRef}
                  onTranscript={(text) => setInput((prev) => prev + (prev ? " " : "") + text)}
                  currentSessionId={currentSessionId}
                />

                {isLoading ? (
                  <Button
                    onClick={onStop}
                    size="icon"
                    className="h-10 w-10 rounded-full transition-all shrink-0 active:scale-95 bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 cursor-pointer"
                    suppressHydrationWarning={true}
                  >
                    <span className="w-3 h-3 bg-current rounded-[2px]" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSend}
                    size="icon"
                    disabled={
                      (!input.trim() && !image && !fileName) ||
                      isParsing ||
                      isAuthLoading ||
                      getWordCount(input) > 2000
                    }
                    className={cn(
                      "h-8 w-8 sm:h-10 sm:w-10 rounded-full transition-all shrink-0 active:scale-95",
                      (input.trim() || image || fileName) && getWordCount(input) <= 2000
                        ? "bg-sky-500 hover:bg-sky-600 text-white shadow-md hover:shadow-lg cursor-pointer"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                    suppressHydrationWarning={true}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="text-center mt-3 text-[10px] sm:text-xs text-muted-foreground opacity-60">
            Kidoza can make mistakes. Verify important information.
          </div>
        </div>
      </footer>

      {isDragging && (
        <div className="fixed inset-0 z-100 flex items-center justify-center border-4 border-dashed border-sky-400 bg-sky-500/20 backdrop-blur-sm pointer-events-none">
          <p className="text-lg font-semibold text-sky-700">Drop your files here</p>
        </div>
      )}
    </div>
  );
});
