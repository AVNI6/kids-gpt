"use client";
import { useState, useEffect, useRef, useCallback } from "react";
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
import ShareLink from "./ShareLink";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addMessage, setMessages, setCurrentSessionId, addSession } from "@/store/slice/chat.slice";
import {
  fetchSessionMessages,
  saveChatMessage,
  createChatSession,
  trackDailyUsage,
  saveGeneratedMaterial,
  uploadFileToStorage,
} from "@/actions/chat.actions";
import { Message, ChatMessageRow } from "@/types/chat.types";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const suggestions = ["Help with Math", "Tell a Space Story", "Practice Spanish"];

export default function ChatInterface() {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((state) => state.chat.messages);
  const currentSessionId = useAppSelector((state) => state.chat.currentSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const urlSessionId = searchParams?.get("id") || null;

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

  // Sync Redux with URL session ID
  useEffect(() => {
    if (urlSessionId !== currentSessionId) {
      dispatch(setCurrentSessionId(urlSessionId));
    }
  }, [urlSessionId, currentSessionId, dispatch]);

  // Load messages when currentSessionId changes
  useEffect(() => {
    if (currentSessionId) {
      const loadMessages = async () => {
        try {
          const dbMessages = await fetchSessionMessages(currentSessionId);
          const mappedMessages: Message[] = dbMessages.map((m: ChatMessageRow) => {
            const isImage =
              m.content.includes("supabase.co/storage/") || m.attachment_url?.includes("image/");
            const isPdf =
              m.attachment_url?.includes(".pdf") ||
              (m.content.includes("pdf/") && m.content.includes(".pdf"));

            return {
              id: m.id,
              role: (m.sender_role as string) === "assistant" ? "model" : m.sender_role,
              content: m.content,
              isImage,
              isPdfRequest: isPdf,
              pdfContent: m.content, // Restore as fallback for PDF generation
              attachmentUrl: m.attachment_url,
            };
          });
          dispatch(setMessages(mappedMessages));
        } catch (error) {
          console.error("Failed to load messages:", error);
        }
      };
      loadMessages();
    } else {
      dispatch(setMessages([]));
    }
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleDownloadPDF = useCallback(
    async (messageId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      // If we have a stored attachment URL, force download it
      if (message.attachmentUrl) {
        try {
          const response = await fetch(message.attachmentUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `kids-learning-${messageId.slice(0, 5)}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (err) {
          console.error("Direct download failed, opening in new tab:", err);
          window.open(message.attachmentUrl, "_blank");
        }
        return;
      }

      try {
        const { pdf } = await import("@react-pdf/renderer");
        const { PdfDocument } = await import("./PdfDocument");

        const blob = await pdf(
          <PdfDocument content={message.pdfContent || message.content} />
        ).toBlob();

        // Upload to storage if not already there
        if (currentSessionId && isUserLoggedIn && !message.pdfContent?.startsWith("http")) {
          const fileName = `pdf/${currentSessionId}_${Date.now()}.pdf`;
          const storageUrl = await uploadFileToStorage(blob, fileName);

          await saveGeneratedMaterial(currentSessionId, "pdf", "application/pdf", storageUrl, {
            originalMessageId: messageId,
            tokens: Math.round(message.content.length / 4),
          });

          console.log("PDF uploaded to storage:", storageUrl);
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "kids-learning-material.pdf";
        a.click();

        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("PDF generation failed:", error);
      }
    },
    [messages, currentSessionId, isUserLoggedIn]
  );

  const sendMessage = useCallback(async () => {
    if (!input.trim() && !image) return;

    const currentInput = input;
    const currentImage = image;
    let sessionId = currentSessionId;

    // 1. Create session and save user message if it doesn't exist
    if (!sessionId && isUserLoggedIn) {
      try {
        const newSession = await createChatSession(currentInput.slice(0, 30) + "...");
        sessionId = newSession.id;

        // 1. Save user message to DB FIRST so it's there when we switch sessions
        const userTokens = Math.round(currentInput.length / 4);
        await saveChatMessage(sessionId, "user", currentInput, { tokens: userTokens });
        await trackDailyUsage(userTokens);

        // 2. Now update UI and URL
        dispatch(addSession(newSession));
        dispatch(setCurrentSessionId(sessionId));
        router.push(`/?id=${sessionId}`);
      } catch (error) {
        console.error("Failed to create session/save message:", error);
      }
    } else if (sessionId && isUserLoggedIn) {
      // 2. Save user message for existing session
      const userTokens = Math.round(currentInput.length / 4);
      saveChatMessage(sessionId, "user", currentInput, { tokens: userTokens }).catch(console.error);
      trackDailyUsage(userTokens).catch(console.error);
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

    try {
      const isImageRequest =
        /(generate|create|draw|make|show).*(image|picture|photo|illustration|drawing|painting)/i.test(
          currentInput
        ) ||
        (/image|picture|drawing|illustration/i.test(currentInput) && currentInput.length < 50);

      const apiUrl = isImageRequest ? "/api/generate-image" : "/api/chat";
      const bodyPayload = isImageRequest
        ? { prompt: currentInput }
        : { message: currentInput, image: currentImage };

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      let aiResponseContent = "";
      let isImageResponse = false;
      const rawTokens =
        data.usage?.totalTokenCount || data.message?.length / 4 || data.text?.length / 4 || 0;
      const tokens = Math.round(rawTokens);

      if (data.type === "image") {
        aiResponseContent = data.image;
        isImageResponse = true;
      } else {
        aiResponseContent =
          data?.message ??
          data?.aiResponse ??
          data?.response ??
          data?.text ??
          "No response generated";

        // Robust JSON parsing for tool calls
        try {
          const jsonMatch = aiResponseContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const toolData = JSON.parse(jsonMatch[0]);
            if (toolData.action === "dalle.text2im" || toolData.action === "generate_image") {
              let prompt = "";
              const input = toolData.action_input;
              if (typeof input === "string") {
                if (input.startsWith("{")) {
                  try {
                    prompt = JSON.parse(input).prompt;
                  } catch {
                    prompt = input;
                  }
                } else {
                  prompt = input;
                }
              } else {
                prompt = input?.prompt || toolData.thought;
              }

              if (prompt) {
                aiResponseContent = `https://pollinations.ai/p/${encodeURIComponent(prompt)}`;
                isImageResponse = true;
              }
            }
          }
        } catch (_e) {
          // Not a valid JSON tool call
        }
      }

      // Upload if needed
      let attachmentUrl: string | undefined = undefined;
      let finalContent = aiResponseContent;

      if (sessionId && isUserLoggedIn) {
        if (isImageResponse) {
          try {
            const imgRes = await fetch(aiResponseContent);
            const imgBlob = await imgRes.blob();
            const fileName = `image/${sessionId}_${Date.now()}.jpg`;
            attachmentUrl = await uploadFileToStorage(imgBlob, fileName);

            // For images, we keep the URL in content as well so the <img> tag can use it
            finalContent = attachmentUrl;

            await saveGeneratedMaterial(sessionId, "image", "image/jpeg", attachmentUrl, {
              prompt: currentInput,
            });
            await trackDailyUsage(Math.round(100), { isImage: true });
          } catch (_e) {
            console.error("Failed to upload image:", _e);
          }
        }

        if (data.isPdfRequest && data.pdfContent) {
          try {
            const { pdf } = await import("@react-pdf/renderer");
            const { PdfDocument } = await import("./PdfDocument");
            const pdfBlob = await pdf(<PdfDocument content={data.pdfContent} />).toBlob();
            const fileName = `pdf/${sessionId}_${Date.now()}.pdf`;
            attachmentUrl = await uploadFileToStorage(pdfBlob, fileName);

            await saveGeneratedMaterial(sessionId, "pdf", "application/pdf", attachmentUrl, {
              prompt: currentInput,
            });
            await trackDailyUsage(tokens, { isPdf: true });
          } catch (_e) {
            console.error("Failed to upload pdf:", _e);
          }
        }
      }

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "model",
        content: finalContent,
        isImage: isImageResponse,
        pdfContent: data?.isPdfRequest ? data.pdfContent : undefined,
        isPdfRequest: data?.isPdfRequest,
        token_used: tokens,
        attachmentUrl: attachmentUrl,
      };

      dispatch(addMessage(aiMessage));
      setIsLoading(false);

      if (sessionId && isUserLoggedIn) {
        // Save model message to DB
        await saveChatMessage(sessionId, "model", finalContent, {
          tokens,
          model: isImageRequest ? "image-preview" : "gemini-flash",
          attachmentUrl: attachmentUrl,
        }).catch(console.error);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errResponse = "Sorry, something went wrong. Please try again.";
      const errMessage: Message = {
        id: crypto.randomUUID(),
        role: "model",
        content: errResponse,
      };
      dispatch(addMessage(errMessage));
    } finally {
      setIsLoading(false);
    }
  }, [
    input,
    image,
    currentSessionId,
    isUserLoggedIn,
    dispatch,
    router,
    setMessages,
    setCurrentSessionId,
    addSession,
    fetchSessionMessages,
    saveChatMessage,
    createChatSession,
    trackDailyUsage,
    saveGeneratedMaterial,
    uploadFileToStorage,
  ]);

  return (
    <div className="fixed inset-0 flex bg-background w-full overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <main className="flex-1 flex flex-col justify-between h-full overflow-hidden relative bg-background min-h-0">
        <header className="sticky top-0 z-50 w-full h-16 bg-background border-b border-border flex items-center px-4 md:px-6 font-bold text-sky-600 justify-between shrink-0">
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
              <div className="text-sky-600 truncate max-w-30 sm:max-w-none">
                ChatGPT <span className="hidden sm:inline">Kids</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {currentSessionId && <ShareLink sessionId={currentSessionId} />}
            <Navbar />
          </div>
        </header>

        {messages.length === 0 ? (
          <div className="flex justify-center overflow-auto min-h-0">
            <div className="w-full max-w-4xl mx-auto text-center pt-16 p-4 md:p-8">
              <h2 className="text-3xl font-black mb-4 text-foreground">
                What should we explore today?
              </h2>
              <p className="text-muted-foreground mb-10 text-lg">
                Ask me anything and let’s learn together.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                {suggestions.map((item) => (
                  <Card
                    key={item}
                    className="cursor-pointer hover:bg-sky-500/10 hover:border-sky-500/30 transition-colors shadow-sm bg-card border-border/50"
                    onClick={() => setInput(item)}
                  >
                    <CardContent className="p-4 flex items-center justify-center min-h-25">
                      <h3 className="font-semibold text-foreground text-center">{item}</h3>
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
                          <AvatarFallback className="bg-sky-500/10 text-sky-600">U</AvatarFallback>
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
                            className="w-32 h-32 object-cover rounded-2xl shadow-sm border border-border"
                            unoptimized
                          />
                        )}
                        {(message.content || message.isImage || message.role === "model") && (
                          <div
                            className={`rounded-2xl sm:rounded-3xl px-3 sm:px-5 py-2.5 sm:py-3.5 leading-relaxed text-[14px] sm:text-[15px] shadow-sm ${message.role === "user" ? "bg-sky-500 text-white rounded-br-sm" : "bg-card border border-border rounded-bl-sm text-foreground"}`}
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
                                <div className="prose prose-sm max-w-none prose-p:leading-relaxed dark:prose-invert prose-pre:bg-muted prose-pre:text-foreground">
                                  <ReactMarkdown>{message.content}</ReactMarkdown>
                                  {message.isPdfRequest && (
                                    <div className="mt-4 p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className=" sm:w-10 sm:h-10 bg-sky-500/20 rounded-full flex items-center justify-center text-sky-600">
                                          <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <div>
                                          <p className="font-semibold text-foreground m-0">
                                            Your PDF is ready
                                          </p>
                                          <p className="text-sm text-muted-foreground m-0">
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

                      <div className="rounded-3xl rounded-bl-sm px-5 py-3.5 bg-card border border-border flex items-center gap-3 shadow-sm">
                        <Spinner />
                        <span className="text-muted-foreground text-sm font-medium">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
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
