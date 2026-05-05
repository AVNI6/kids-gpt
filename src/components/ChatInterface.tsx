"use client";
import { useState, useEffect, useCallback } from "react";
import { Bot, Sparkles, PanelLeftOpen, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import Navbar from "./Navbar";
import ChatFooter from "./ChatFooter";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addMessage,
  setMessages,
  setCurrentSessionId,
  updateSessionTitleInList,
} from "@/store/slice/chat.slice";
import {
  fetchSessionMessages,
  saveChatMessage,
  createChatSession,
  updateSessionTitle,
  type ChatMessageRow,
} from "@/lib/supabase/chat";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Message = {
  id: string;
  role: "user" | "model";
  content: string;
  pdfContent?: string;
  isPdfRequest?: boolean;
  isImage?: boolean;
  uploadedImage?: string;
};

const suggestions = ["Help with Math", "Tell a Space Story", "Practice Spanish"];

export default function ChatInterface() {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((state) => state.chat.messages);
  const currentSessionId = useAppSelector((state) => state.chat.currentSessionId);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  // Check login status
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsUserLoggedIn(!!user);
    };
    checkUser();
  }, []);

  // Fetch messages when session changes
  useEffect(() => {
    const loadMessages = async () => {
      if (currentSessionId) {
        setIsLoading(true);
        try {
          const dbMessages = await fetchSessionMessages(currentSessionId);
          const mappedMessages: Message[] = dbMessages.map((m: ChatMessageRow) => ({
            id: m.id,
            role: m.sender_role,
            content: m.content,
          }));
          dispatch(setMessages(mappedMessages));
        } catch (error) {
          console.error("Failed to load messages:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        dispatch(setMessages([]));
      }
    };
    loadMessages();
  }, [currentSessionId, dispatch]);

  // Close sidebar on mobile by default
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleDownloadPDF = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { PdfDocument } = await import("./PdfDocument");

      const blob = await pdf(
        <PdfDocument content={message.pdfContent || message.content} />
      ).toBlob();

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "kids-learning-material.pdf";
      a.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation failed:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !image) return;

    const currentInput = input;
    const currentImage = image;
    let sessionId = currentSessionId;

    // 1. Create session if it doesn't exist and user is logged in
    if (!sessionId && isUserLoggedIn) {
      try {
        const newSession = await createChatSession(currentInput.slice(0, 30) + "...");
        sessionId = newSession.id;
        dispatch(setCurrentSessionId(sessionId));
        dispatch(updateSessionTitleInList({ id: sessionId, title: newSession.title }));
      } catch (error) {
        console.error("Failed to create session:", error);
      }
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: currentInput,
      uploadedImage: currentImage || undefined,
    };

    dispatch(addMessage(userMessage));
    setInput("");
    setImage(null);
    setIsLoading(true);

    // Save user message to DB
    if (sessionId && isUserLoggedIn) {
      const sid = sessionId; // Narrowing
      saveChatMessage(sid, "user", currentInput).catch(console.error);
    }

    try {
      const trimmedInput = currentInput.trim().toLowerCase();
      const isVagueImageRequest =
        /^(generate|make|create|draw|show)\s+(an?\s+)?(image|picture|photo|drawing|illustration)$/i.test(
          trimmedInput
        ) || trimmedInput === "image";
      const isVaguePdfRequest =
        /^(generate|make|create|download|give\s+me)\s+(a\s+)?pdf$/i.test(trimmedInput) ||
        trimmedInput === "pdf";

      if (isVagueImageRequest || isVaguePdfRequest) {
        const topicType = isVagueImageRequest ? "picture" : "PDF document";
        const aiResponse = `I'd love to help you with that! 🎨✨ But I need to know what topic you'd like me to use. What should the ${topicType} be about? 🚀`;

        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: "model",
          content: aiResponse,
        };
        dispatch(addMessage(aiMessage));

        if (sessionId && isUserLoggedIn) {
          const sid = sessionId;
          saveChatMessage(sid, "model", aiResponse).catch(console.error);
        }

        setIsLoading(false);
        return;
      }

      const isEditRequest = /edit|modify|recreate|transform/i.test(currentInput);
      const isImageGeneration =
        /(generate|create|draw|make).*(image|picture|photo|illustration|drawing)/i.test(
          currentInput
        ) &&
        !isEditRequest &&
        !/pdf/i.test(currentInput);

      const apiUrl = isImageGeneration ? "/api/generate-image" : "/api/chat";
      const bodyPayload = isImageGeneration
        ? { prompt: currentInput }
        : { message: currentInput, image: currentImage };

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      let aiResponseContent = "";
      let isImage = false;

      if (data.type === "image") {
        aiResponseContent = data.image;
        isImage = true;
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: "model",
          content: aiResponseContent,
          isImage: true,
        };
        dispatch(addMessage(aiMessage));
      } else {
        aiResponseContent =
          data?.message ??
          data?.aiResponse ??
          data?.response ??
          data?.text ??
          "No response generated";

        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: "model",
          content: aiResponseContent,
          pdfContent: data?.pdfContent,
          isPdfRequest: data?.isPdfRequest,
        };
        dispatch(addMessage(aiMessage));
      }

      // Save assistant message to DB
      if (sessionId && isUserLoggedIn) {
        const sid = sessionId;
        saveChatMessage(sid, "model", aiResponseContent).catch(console.error);

        // Update title if it's the first message
        if (messages.length === 1) {
          // 1 user message already added
          const newTitle = currentInput.slice(0, 40);
          updateSessionTitle(sid, newTitle).catch(console.error);
          dispatch(updateSessionTitleInList({ id: sid, title: newTitle }));
        }
      }
    } catch (_error) {
      const errResponse = "Sorry, something went wrong. Please try again.";
      const errMessage: Message = {
        id: crypto.randomUUID(),
        role: "model",
        content: errResponse,
      };
      dispatch(addMessage(errMessage));

      if (sessionId && isUserLoggedIn) {
        const sid = sessionId;
        saveChatMessage(sid, "model", errResponse).catch(console.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex bg-white w-full overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <main className="flex-1 flex flex-col justify-between h-full overflow-hidden relative bg-white min-h-0">
        <header className="sticky top-0 z-50 w-full h-16 bg-white border-b flex items-center px-4 md:px-6 font-bold text-sky-600 justify-between shrink-0">
          <div className="flex items-center gap-3">
            {(!isSidebarOpen || isMobile) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className={`text-slate-500 hover:text-slate-700 mr-2 ${isSidebarOpen ? "hidden" : "flex"}`}
              >
                <PanelLeftOpen className="w-5 h-5" />
              </Button>
            )}
            <Link href="/" className="flex items-center gap-2">
              {!isSidebarOpen && (
                <div className="h-8 w-8 rounded-xl bg-sky-500 flex items-center justify-center text-white shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              <div className="text-sky-600 truncate max-w-[120px] sm:max-w-none">
                ChatGPT <span className="hidden sm:inline">Kids</span>
              </div>
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
          <div className="flex-1 min-h-0 overflow-hidden relative">
            <ScrollArea className="h-full w-full">
              <div className="w-full max-w-3xl mx-auto space-y-6 pb-6 p-3 sm:p-6 md:p-8">
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
                        className={`flex flex-col gap-2 overflow-x-auto ${message.role === "user" ? "items-end" : "items-start"}`}
                      >
                        {message.uploadedImage && (
                          <Image
                            src={message.uploadedImage}
                            alt="Uploaded"
                            width={128}
                            height={128}
                            className="w-32 h-32 object-cover rounded-2xl shadow-sm border border-slate-200"
                            unoptimized
                          />
                        )}
                        {(message.content || message.isImage || message.role === "model") && (
                          <div
                            className={`rounded-2xl sm:rounded-3xl px-3 sm:px-5 py-2.5 sm:py-3.5 leading-relaxed text-[14px] sm:text-[15px] shadow-sm ${message.role === "user" ? "bg-sky-500 text-white rounded-br-sm" : "bg-white border rounded-bl-sm text-slate-700"}`}
                          >
                            {message.role === "model" && (
                              <div className="flex items-center justify-between gap-1.5 mb-2">
                                <div className="flex items-center gap-1.5 text-sky-600 font-bold text-sm">
                                  <Bot className="w-4 h-4" /> AI Buddy
                                </div>
                              </div>
                            )}
                            <div id={`msg-${message.id}`}>
                              {message.isImage ? (
                                <Image
                                  src={message.content}
                                  alt="Generated"
                                  width={400}
                                  height={400}
                                  className="rounded-xl max-w-full md:max-w-xs shadow-sm"
                                  unoptimized
                                />
                              ) : message.role === "model" ? (
                                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-100 prose-pre:text-slate-800">
                                  <ReactMarkdown>{message.content}</ReactMarkdown>
                                  {message.isPdfRequest && (
                                    <div className="mt-4 p-4 bg-sky-50 border border-sky-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className=" sm:w-10 sm:h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-600">
                                          <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <div>
                                          <p className="font-semibold text-slate-800 m-0">
                                            Your PDF is ready
                                          </p>
                                          <p className="text-sm text-slate-500 m-0">
                                            Click to download the document
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        onClick={() => handleDownloadPDF(message.id)}
                                        className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl"
                                      >
                                        Download PDF
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p>{message.content}</p>
                              )}
                            </div>
                          </div>
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

        <ChatFooter
          input={input}
          setInput={setInput}
          onSend={sendMessage}
          isLoading={isLoading}
          image={image}
          setImage={setImage}
        />
      </main>
    </div>
  );
}
