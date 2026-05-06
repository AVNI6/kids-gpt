"use client";

import { useState, useEffect } from "react";
import { Send, Plus, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  isLoading: boolean;
  image: string | null;
  setImage: (val: string | null) => void;
};

export default function ChatFooter({ input, setInput, onSend, isLoading, image, setImage }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();

    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);

    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImage(base64);
    };

    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
  };

  return (
    <div
      className="relative"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
    >
      <footer className="bg-background p-2 sm:p-4 pb-4 sm:pb-6">
        <div className="w-full max-w-3xl mx-auto">
          <div className="relative bg-muted/30 border border-border rounded-[28px] overflow-hidden focus-within:ring-2 focus-within:ring-sky-400 transition-all">
            <input
              type="file"
              accept="image/*"
              id="imageUpload"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            {image && (
              <div className="px-3 pt-3">
                <div className="relative inline-block">
                  <Image
                    src={image}
                    alt="preview"
                    width={112}
                    height={112}
                    className="w-28 h-28 rounded-2xl object-cover border border-border"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-background border border-border shadow flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => document.getElementById("imageUpload")?.click()}
                className="ml-2 rounded-full"
              >
                <Plus className="w-5 h-5" />
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything"
                onKeyDown={(e) => e.key === "Enter" && onSend()}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-14"
              />

              <Button
                onClick={onSend}
                size="icon"
                disabled={(!input.trim() && !image) || isLoading}
                className="mr-2 rounded-full bg-sky-500 hover:bg-sky-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="text-center mt-3 text-xs text-muted-foreground">
            ChatGPT Kid can make mistakes. Verify important information.
          </div>
        </div>
      </footer>

      {isDragging && (
        <div className="fixed inset-0 bg-sky-500/20 backdrop-blur-sm flex items-center justify-center z-50 border-2 border-dashed border-sky-400 pointer-events-none">
          <p className="text-sky-600 font-semibold text-lg">Drop your image here 📸</p>
        </div>
      )}
    </div>
  );
}
