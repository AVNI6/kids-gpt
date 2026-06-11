"use client";

import React, { useEffect } from "react";
import { X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

interface HintOverlayProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function HintOverlay({ imageUrl, isOpen, onClose }: HintOverlayProps) {
  useEffect(() => {
    if (!isOpen) return;

    // Auto-close hint after exactly 3 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-[32px] bg-slate-950/75 p-4 backdrop-blur-sm select-none"
        >
          <div className="relative w-full max-w-md aspect-square bg-slate-900 border-4 border-white/90 rounded-2xl overflow-hidden shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Solved puzzle preview"
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 px-3 py-1 rounded-full text-xs font-black text-white backdrop-blur-xs shadow-sm">
              <Eye className="size-3.5 text-white animate-pulse" />
              Previewing...
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="absolute top-3 right-3 size-8 p-0 rounded-full bg-white/20 text-white hover:bg-white/40 border border-white/20 backdrop-blur-xs shadow-md transition-all cursor-pointer flex items-center justify-center"
              aria-label="Close Preview"
            >
              <X className="size-4" />
            </Button>
          </div>
          <p className="mt-4 text-sm font-bold text-white text-center drop-shadow-md select-none animate-bounce">
            Take a quick look! Sneak peek ends in 3 seconds... ⏱️
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
