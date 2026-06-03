"use client";

import React from "react";
import { Card, CardContent } from "@/components/shared/ui/card";

interface ChatSuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
}

export default function ChatSuggestions({ suggestions, onSelectSuggestion }: ChatSuggestionsProps) {
  return (
    <div className="flex flex-1 items-center justify-center overflow-auto min-h-0">
      <div className="w-full max-w-4xl mx-auto text-center p-4 sm:p-6 md:p-8">
        <h2 className="text-2xl sm:text-3xl font-black mb-4 text-foreground animate-fade-in">
          What should we explore today?
        </h2>

        <p className="text-muted-foreground mb-6 sm:mb-10 text-base sm:text-lg">
          Ask me anything and let’s learn together.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {suggestions.map((item) => (
            <Card
              key={item}
              className="cursor-pointer hover:bg-sky-500/10 hover:border-sky-500/30 transition-all shadow-sm bg-card border-border/50 active:scale-95 hover:scale-[1.02] duration-200"
              onClick={() => onSelectSuggestion(item)}
            >
              <CardContent className="p-3 sm:p-4 flex items-center justify-center min-h-[70px] sm:min-h-[100px]">
                <h3 className="font-semibold text-foreground text-center text-sm sm:text-base">
                  {item}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
