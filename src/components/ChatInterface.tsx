"use client";
import { useState, useEffect, useRef } from "react";
import { Bot, Menu, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Image from "next/image";
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
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { getSessionManager } from "@/lib/ai/session-manager";

const suggestions = ["Help with Math", "Tell a Space Story", "Practice Spanish"];

export default function ChatInterface() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const messages = useAppSelector((state) => state.chat.messages);
  const currentSessionId = useAppSelector((state) => state.chat.currentSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const { toggleSidebar, isSidebarOpen } = useSidebar();
  const { isUserLoggedIn, userRole } = useAuth();
  const searchParams = useSearchParams();
  const urlSessionId = searchParams?.get("id") || null;

  // Sync and load messages based on URL session ID
  useEffect(() => {
    if (urlSessionId) {
      // Sync Redux with URL session ID if they differ
      if (urlSessionId !== currentSessionId) {
        dispatch(setCurrentSessionId(urlSessionId));
      }

      // If messages are already loaded for this session, skip reloading from DB
      if (currentSessionId === urlSessionId && messages.length > 0) {
        return;
      }

      const loadMessages = async () => {
        try {
          const dbMessages = await fetchSessionMessages(urlSessionId);
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
              pdfContent: m.content,
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
      // No URL session ID: clear Redux state
      if (currentSessionId !== null) {
        dispatch(setCurrentSessionId(null));
      }
      dispatch(setMessages([]));
    }
  }, [urlSessionId, currentSessionId, messages.length, dispatch]);

  // Abort in-flight requests when component unmounts
  useEffect(() => {
    return () => {
      getSessionManager().abortActiveRequest();
    };
  }, []);

  // Close sidebar on mobile by default
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        // Mobile logic handled by MainLayout
      }
    };
    checkMobile();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Render nothing while chat is syncing to prevent showing old chat data
  if (!urlSessionId && currentSessionId) {
    return null; // Still syncing, don't render old chat
  }

  const handleDownloadPDF = async (messageId: string) => {
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
        <PdfDocument
          content={message.pdfContent || message.content}
          role={
            (message.pdfTheme === "clean" ? "parent" : message.pdfTheme || userRole || "kid") as
              | "kid"
              | "parent"
              | "teacher"
          }
        />
      ).toBlob();

      // Upload to storage if not already there
      if (currentSessionId && isUserLoggedIn && !message.pdfContent?.startsWith("http")) {
        const fileName = `pdf/${currentSessionId}.pdf`;
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
  };

  const sendMessage = async () => {
    const currentInput = input;
    const currentImage = image;
    const currentFileContent = fileContent;
    const currentFileName = fileName;
    let sessionId = currentSessionId;

    const isPdfRequest =
      /pdf/i.test(currentInput || "") &&
      /generate|create|make|build|download/i.test(currentInput || "");

    // Intercept PDF requests for unauthenticated (guest) users
    if (!isUserLoggedIn && isPdfRequest) {
      setIsLoading(true);
      setInput("");
      setImage(null);
      setFileContent(null);
      setFileName(null);

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: currentInput,
        uploadedImage: currentImage || undefined,
        fileName: currentFileName || undefined,
      };
      dispatch(addMessage(userMessage));

      setTimeout(() => {
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: "model",
          content: "cant generate pdf, please signin to generate pdf",
        };
        dispatch(addMessage(aiMessage));
        setIsLoading(false);
      }, 800);
      return;
    }

    // Combine input with file content if present
    const finalInputForAI = currentFileContent
      ? `${currentInput}\n\n[Attachment: ${currentFileName}]\n${currentFileContent}`
      : currentInput;

    setIsLoading(true);
    setInput("");
    setImage(null);
    setFileContent(null);
    setFileName(null);

    let userAttachmentUrl: string | undefined = undefined;

    // 1. Upload user attachment if exists (Images or PDFs)
    if (isUserLoggedIn && (currentImage || currentFileContent)) {
      try {
        if (currentImage) {
          const res = await fetch(currentImage);
          const blob = await res.blob();
          const path = `materials/image/${sessionId || "new"}_${Date.now()}.jpg`;
          userAttachmentUrl = await uploadFileToStorage(blob, path);
        } else if (currentFileContent) {
          // Upload PDF or Text file
          const blob = new Blob([currentFileContent], { type: "text/plain" });
          const path = `materials/docs/${sessionId || "new"}_${Date.now()}.txt`;
          userAttachmentUrl = await uploadFileToStorage(blob, path);
        }
      } catch (e) {
        console.error("User upload failed:", e);
      }
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: currentInput,
      uploadedImage: currentImage || undefined,
      attachmentUrl: userAttachmentUrl,
      fileName: currentFileName || undefined,
    };

    dispatch(addMessage(userMessage));

    // Prepare history for API
    const chatHistory = messages.slice(-10).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      content: m.content,
    }));

    // 2. Create session and save user message if it doesn't exist
    if (!sessionId && isUserLoggedIn) {
      try {
        const newSession = await createChatSession(currentInput.slice(0, 30) + "...");
        sessionId = newSession.id;

        const userTokens = Math.round(currentInput.length / 4);
        await saveChatMessage(sessionId, "user", currentInput, {
          tokens: userTokens,
          attachmentUrl: userAttachmentUrl,
        });
        await trackDailyUsage(userTokens);

        dispatch(addSession(newSession));
        dispatch(setCurrentSessionId(sessionId));
        // Replace URL without full reload to maintain state
        router.replace(`/?id=${sessionId}`, { scroll: false });
      } catch (error) {
        console.error("Failed to create session/save message:", error);
      }
    } else if (sessionId && isUserLoggedIn) {
      const userTokens = Math.round(currentInput.length / 4);
      saveChatMessage(sessionId, "user", currentInput, {
        tokens: userTokens,
        attachmentUrl: userAttachmentUrl,
      }).catch(console.error);
      trackDailyUsage(userTokens).catch(console.error);
    }

    setIsLoading(true);

    const sessionManager = getSessionManager();
    const requestId = crypto.randomUUID();
    const signal = sessionManager.registerRequest(requestId);

    try {
      const isImageRequest =
        !currentImage &&
        (/(generate|create|draw|make|show).*(image|picture|photo|illustration|drawing|painting)/i.test(
          currentInput
        ) ||
          (/image|picture|drawing|illustration/i.test(currentInput) && currentInput.length < 50));

      const apiUrl = isImageRequest ? "/api/generate-image" : "/api/chat";
      const bodyPayload = isImageRequest
        ? { prompt: currentInput }
        : {
            message: finalInputForAI,
            image: currentImage,
            history: chatHistory,
            role: userRole || "kid",
          };

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
        signal,
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
        } catch {
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
          } catch {
            console.error("Failed to upload image");
          }
        }

        if (data.isPdfRequest && data.pdfContent) {
          try {
            const { pdf } = await import("@react-pdf/renderer");
            const { PdfDocument } = await import("./PdfDocument");
            const pdfBlob = await pdf(
              <PdfDocument content={data.pdfContent} role={userRole || "kid"} />
            ).toBlob();
            const fileName = `pdf/${sessionId}_${Date.now()}.pdf`;
            attachmentUrl = await uploadFileToStorage(pdfBlob, fileName);

            await saveGeneratedMaterial(sessionId, "pdf", "application/pdf", attachmentUrl, {
              prompt: currentInput,
            });
            await trackDailyUsage(tokens, { isPdf: true });
          } catch {
            console.error("Failed to upload pdf");
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
        pdfTheme: data?.isPdfRequest ? data.pdfTheme : undefined,
      };

      dispatch(addMessage(aiMessage));
      setIsLoading(false);
      setFileContent(null);
      setFileName(null);

      if (sessionId && isUserLoggedIn) {
        // Save model message to DB
        await saveChatMessage(sessionId, "model", finalContent, {
          tokens,
          model: isImageRequest ? "image-preview" : "gemini-flash",
          attachmentUrl: attachmentUrl,
        }).catch(console.error);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        console.log("Request aborted gracefully");
        return;
      }
      console.error("Chat error:", error);
      const errResponse = "Sorry, something went wrong. Please try again.";
      const errMessage: Message = {
        id: crypto.randomUUID(),
        role: "model",
        content: errResponse,
      };
      dispatch(addMessage(errMessage));
    } finally {
      sessionManager.completeRequest(requestId);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-background overflow-hidden">
      <header className="sticky top-0 z-40 w-full h-16 bg-background border-b border-border flex items-center px-4 md:px-6 font-bold text-sky-600 justify-between shrink-0">
        <div className="flex items-center gap-3">
          {!isSidebarOpen && (
            <button
              onClick={toggleSidebar}
              title="Open Menu"
              className="md:hidden h-8 w-8 rounded-xl bg-sky-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform active:scale-95"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-sky-600 truncate max-w-[120px] sm:max-w-none font-black text-xl">
              ChatGPT <span className="hidden sm:inline">Kids</span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {currentSessionId && <ShareLink sessionId={currentSessionId} />}
          <Navbar />
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden min-h-0 bg-background">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center overflow-auto min-h-0">
            <div className="w-full max-w-4xl mx-auto text-center p-4 sm:p-6 md:p-8">
              <h2 className="text-2xl sm:text-3xl font-black mb-4 text-foreground">
                What should we explore today?
              </h2>

              <p className="text-muted-foreground mb-6 sm:mb-10 text-base sm:text-lg">
                Ask me anything and let’s learn together.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {suggestions.map((item) => (
                  <Card
                    key={item}
                    className="cursor-pointer hover:bg-sky-500/10 hover:border-sky-500/30 transition-all shadow-sm bg-card border-border/50 active:scale-95"
                    onClick={() => setInput(item)}
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
                                <div className="space-y-2">
                                  {message.content && <p>{message.content}</p>}
                                  {message.fileName && (
                                    <div className="flex items-center gap-2 p-2 bg-white/20 rounded-xl text-xs font-bold w-fit">
                                      <FileText className="w-3 h-3" /> {message.fileName}
                                    </div>
                                  )}
                                </div>
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
          setFileContent={setFileContent}
          setFileName={setFileName}
        />
      </main>
    </div>
  );
}
