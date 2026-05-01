"use client";
import { useState } from "react";
import { Send, Mic, Bot, Sparkles, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Navbar from "./Navbar";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const suggestions = ["Help with Math", "Tell a Space Story", "Practice Spanish"];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      const aiText =
        data?.aiResponse ??
        data?.response ??
        data?.message ??
        data?.text ??
        "No response generated";

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: aiText,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex bg-white w-full overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <main className="flex-1 flex flex-col justify-between h-full overflow-hidden relative bg-white min-h-0">
        <header className="sticky top-0 z-50 w-full h-16 bg-white border-b flex items-center px-6 font-bold text-sky-600 justify-between shrink-0">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="text-slate-500 hover:text-slate-700 mr-2"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </Button>
            )}
            <Link href="/" className="flex items-center gap-3">
              <div className="text-sky-600">ChatGPT Kids</div>
            </Link>
          </div>
          <Navbar />
        </header>

        {messages.length === 0 ? (
          <div className="flex-1 overflow-auto min-h-0">
            <div className="w-full max-w-4xl mx-auto text-center pt-16 p-4 md:p-8">
              <div className="w-20 h-20 bg-sky-500 rounded-3xl mx-auto flex items-center justify-center text-white mb-6 shadow-sm">
                <Sparkles className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black mb-4 text-slate-800">
                What should we explore today?
              </h2>
              <p className="text-slate-500 mb-10 text-lg">
                Ask me anything and let’s learn together.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                {suggestions.map((item) => (
                  <Card
                    key={item}
                    className="cursor-pointer hover:bg-sky-50 hover:border-sky-200 transition-colors shadow-sm"
                    onClick={() => setInput(item)}
                  >
                    <CardContent className="p-4 flex items-center justify-center min-h-25">
                      <h3 className="font-semibold text-slate-700 text-center">{item}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Chat state */
          <div className="flex-1 min-h-0 overflow-hidden relative">
            <ScrollArea className="h-full w-full">
              <div className="w-full max-w-3xl mx-auto space-y-6 pb-6 p-4 md:p-8">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex items-end gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <Avatar size={"sm"} className="shrink-0 mb-1">
                        {message.role === "user" ? (
                          <AvatarFallback className="bg-sky-100 text-sky-700">U</AvatarFallback>
                        ) : (
                          <AvatarFallback className="bg-sky-500 text-white">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div
                        className={`rounded-3xl px-5 py-3.5 leading-relaxed text-[15px] shadow-sm ${message.role === "user" ? "bg-sky-500 text-white rounded-br-sm" : "bg-white border rounded-bl-sm text-slate-700"}`}
                      >
                        {message.role === "assistant" && (
                          <div className="flex items-center gap-1.5 mb-1 text-sky-600 font-bold text-sm">
                            <Bot className="w-4 h-4" /> AI Buddy
                          </div>
                        )}
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-100 prose-pre:text-slate-800">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p>{message.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-end gap-3">
                      <Avatar size={"sm"} className="shrink-0 mb-1">
                        <AvatarFallback className="bg-sky-500 text-white">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="rounded-3xl rounded-bl-sm px-5 py-3.5 bg-white border flex items-center gap-3 shadow-sm">
                        <Spinner />
                        <span className="text-slate-500 text-sm font-medium">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        <footer className="bg-white p-4 pb-6 shrink-0 border-t md:border-none shadow-[0_-10px_40px_rgba(255,255,255,0.9)] z-10">
          <div className="w-full max-w-3xl mx-auto flex items-end gap-2 relative">
            <div className="relative flex-1 flex items-end bg-slate-50 border rounded-3xl overflow-hidden focus-within:ring-1 focus-within:ring-sky-500 transition-shadow">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 bottom-1 text-slate-400 hover:text-slate-600 rounded-full h-10 w-10"
              >
                <Mic className="w-5 h-5" />
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your buddy anything..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="rounded-3xl border-0 bg-transparent min-h-13 h-auto pl-14 pr-14 py-3 shadow-none focus-visible:ring-0 text-base"
              />

              <Button
                onClick={sendMessage}
                size="icon"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-1 h-10 w-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-50 disabled:bg-slate-300 transition-colors"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
          </div>
          <div className="text-center mt-3 text-xs text-slate-400">
            ChatGPT Kid can make mistakes. Consider verifying important information.
          </div>
        </footer>
      </main>
    </div>
  );
}
