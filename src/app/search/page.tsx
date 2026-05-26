"use client";

import { useState } from "react";
import { Search, MessageSquare, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-background overflow-hidden p-6 md:p-10">
      <div className="max-w-3xl w-full mx-auto space-y-8 flex-1 flex flex-col">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-foreground">Search Chats</h1>
          <p className="text-muted-foreground">
            Search through your chat history by keywords, titles, or messages.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for messages like 'Python API issue' or 'docker error'..."
            className="pl-12 py-6 text-lg rounded-2xl border-2 border-sidebar-border bg-card shadow-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {query ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Search className="w-8 h-8 mb-4 opacity-50" />
              <p>Searching index for &quot;{query}&quot;...</p>
              <p className="text-sm mt-2 opacity-70">
                (Search indexing functionality is under development)
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <Card className="bg-sky-500/5 border-sky-500/20 shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="w-5 h-5 text-sky-500" />
                    <h3 className="font-bold text-sky-700">Semantic Search</h3>
                  </div>
                  <p className="text-sm text-sky-600/80">
                    Find chats even if you don&apos;t remember the exact words.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-bold text-emerald-700">Fast Indexing</h3>
                  </div>
                  <p className="text-sm text-emerald-600/80">
                    All your recent messages are quickly indexed for fast retrieval.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
