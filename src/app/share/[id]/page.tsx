import { Message, ChatMessageRow } from "@/types/chat.types";
import { Bot, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  let messages: Message[] = [];
  try {
    const { data: dbMessages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    messages = (dbMessages || []).map((m: ChatMessageRow) => {
      const isImage = m.content.includes("https://pollinations.ai/p/");
      const isPdf = m.content.startsWith("data:application/pdf;base64,");
      return {
        id: m.id,
        role: (m.sender_role as string) === "assistant" ? "model" : m.sender_role,
        content: m.content,
        isImage,
        isPdfRequest: isPdf,
        pdfContent: isPdf ? m.content : undefined,
      };
    });
  } catch (error) {
    console.error("Failed to load shared messages:", error);
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="h-16 border-b flex items-center px-6 justify-between shrink-0">
        <Link href="/" className="flex items-center gap-2 font-bold text-sky-600">
          <div className="h-8 w-8 rounded-xl bg-sky-500 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          ChatGPT Kids (Shared)
        </Link>
      </header>

      <main className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No messages found or link expired.
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex items-end gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <Avatar className="shrink-0 mb-1">
                      {message.role === "user" ? (
                        <AvatarFallback className="bg-sky-500/10 text-sky-600">U</AvatarFallback>
                      ) : (
                        <AvatarFallback className="bg-sky-500 text-white">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="flex flex-col gap-2 overflow-x-auto">
                      <div
                        className={`rounded-2xl px-4 py-3 leading-relaxed text-[15px] shadow-sm ${message.role === "user" ? "bg-sky-500 text-white" : "bg-card border border-border"}`}
                      >
                        {message.isImage ? (
                          <Image
                            src={message.content}
                            alt="Shared Illustration"
                            width={400}
                            height={400}
                            className="rounded-xl"
                            unoptimized
                          />
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </main>
    </div>
  );
}
