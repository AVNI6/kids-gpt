"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Plus, X, FileText, BrainCircuit, Camera } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  isLoading: boolean;
  image: string | null;
  setImage: (val: string | null) => void;
  setFileContent: (val: string | null) => void;
  setFileName: (val: string | null) => void;
};

export default function ChatFooter({
  input,
  setInput,
  onSend,
  isLoading,
  image,
  setImage,
  setFileContent,
  setFileName,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [localFileName, setLocalFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  const handleFile = async (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
      setLocalFileName(null);
      setFileContent(null);
      setFileName(null);
    } else if (file.type === "application/pdf") {
      setIsParsing(true);
      try {
        const getPDFText = (await import("react-pdftotext")).default;
        const text = await getPDFText(file);
        setImage(null);
        setLocalFileName(file.name);
        setFileName(file.name);
        setFileContent(text);
      } catch (e) {
        console.error("PDF parsing failed:", e);
        alert("Failed to read PDF text. Please try another file.");
      } finally {
        setIsParsing(false);
      }
    } else {
      // Basic text file support
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(null);
        setLocalFileName(file.name);
        setFileName(file.name);
        setFileContent(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const removeAttachment = () => {
    setImage(null);
    setLocalFileName(null);
    setFileContent(null);
    setFileName(null);
  };

  return (
    <div
      className="relative"
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragging(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
    >
      <footer className="bg-background p-2 sm:p-4 pb-4 sm:pb-6">
        <div className="w-full max-w-3xl mx-auto">
          <div className="relative bg-muted/30 border border-border rounded-[28px] overflow-hidden focus-within:ring-2 focus-within:ring-sky-400 transition-all">
            <input
              type="file"
              accept="image/*"
              ref={mediaInputRef}
              className="hidden"
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
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
                setIsPopoverOpen(false);
              }}
            />

            {/* Previews */}
            {(image || localFileName || isParsing) && (
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
                        {localFileName}
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

            <div className="flex items-center">
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className={cn(
                        "ml-2 h-10 w-10 flex items-center justify-center rounded-full transition-all active:scale-90 hover:bg-muted shrink-0",
                        isPopoverOpen && "bg-muted"
                      )}
                    >
                      <Plus
                        className={cn("w-5 h-5 transition-transform", isPopoverOpen && "rotate-45")}
                      />
                    </button>
                  }
                />
                <PopoverContent
                  side="top"
                  align="start"
                  sideOffset={16}
                  className="w-48 p-1 rounded-2xl shadow-xl border-border bg-popover z-50"
                >
                  <button
                    onClick={() => {
                      mediaInputRef.current?.click();
                      setIsPopoverOpen(false);
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
                      setIsPopoverOpen(false);
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
                      setInput("Let's start a fun educational quiz!");
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

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything"
                onKeyDown={(e) => e.key === "Enter" && onSend()}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-14 text-base"
              />

              <Button
                onClick={onSend}
                size="icon"
                disabled={(!input.trim() && !image && !localFileName) || isLoading || isParsing}
                className="mr-2 rounded-full bg-sky-500 hover:bg-sky-600 active:scale-95 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="text-center mt-3 text-[10px] sm:text-xs text-muted-foreground opacity-60">
            ChatGPT Kid can make mistakes. Verify important information.
          </div>
        </div>
      </footer>

      {isDragging && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center border-4 border-dashed border-sky-400 bg-sky-500/20 backdrop-blur-sm pointer-events-none">
          <p className="text-lg font-semibold text-sky-700">Drop your files here</p>
        </div>
      )}
    </div>
  );
}
