"use client";

import React from "react";
import { Bot, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import { Message } from "@/types/chat.types";

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  pdfStates: Record<
    string,
    "idle" | "generating" | "uploading" | "downloading" | "success" | "error"
  >;
  handleDownloadPDF: (messageId: string) => Promise<void>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatMessageList({
  messages,
  isLoading,
  pdfStates,
  handleDownloadPDF,
  messagesEndRef,
}: ChatMessageListProps) {
  return (
    <div className="flex-1 min-h-0 overflow-hidden relative">
      <ScrollArea className="h-full w-full">
        <div className="w-full max-w-3xl mx-auto space-y-6 pb-6 p-3 sm:p-6 md:p-8">
          {messages.map((message) => {
            const isUser = message.role === "user";
            const showModelHeader = message.role === "model";

            return (
              <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex items-end gap-3 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar size={"sm"} className="shrink-0 mb-1">
                    {isUser ? (
                      <AvatarFallback className="bg-sky-500/10 text-sky-600">U</AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-sky-500 text-white">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div
                    className={`flex flex-col gap-2 overflow-x-auto ${isUser ? "items-end" : "items-start"}`}
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
                        className={`rounded-2xl sm:rounded-3xl px-3 sm:px-5 py-2.5 sm:py-3.5 leading-relaxed text-[14px] sm:text-[15px] shadow-sm ${
                          isUser
                            ? "bg-sky-500 text-white rounded-br-sm"
                            : "bg-card border border-border rounded-bl-sm text-foreground"
                        }`}
                      >
                        {showModelHeader && (
                          <div className="flex items-center justify-between gap-1.5 mb-2">
                            <div className="flex items-center gap-1.5 text-sky-600 font-bold text-sm">
                              <Bot className="w-4 h-4" /> AI Buddy
                            </div>
                          </div>
                        )}

                        {!isUser ? (
                          <div className="w-full text-foreground space-y-1 overflow-hidden font-medium">
                            {message.isImage ? (
                              <Image
                                src={message.content}
                                alt="Generated Illustration"
                                width={400}
                                height={400}
                                className="rounded-xl max-w-full md:max-w-xs shadow-sm"
                                unoptimized
                              />
                            ) : (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({ children }) => (
                                    <h1 className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 mt-4 mb-2 first:mt-0 flex items-center gap-1.5">
                                      {children}
                                    </h1>
                                  ),
                                  h2: ({ children }) => (
                                    <h2 className="text-lg sm:text-xl font-bold text-sky-700 dark:text-sky-300 mt-3.5 mb-2 first:mt-0 flex items-center gap-1.5">
                                      {children}
                                    </h2>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className="text-base sm:text-lg font-bold text-sky-800 dark:text-sky-200 mt-3 mb-1 first:mt-0">
                                      {children}
                                    </h3>
                                  ),
                                  p: ({ children }) => (
                                    <p className="mb-3 last:mb-0 leading-relaxed text-[15px] text-slate-700 dark:text-slate-300 font-medium">
                                      {children}
                                    </p>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="list-disc pl-6 my-3 space-y-2 text-slate-700 dark:text-slate-300 font-medium">
                                      {children}
                                    </ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="list-decimal pl-6 my-3 space-y-2 text-slate-700 dark:text-slate-300 font-medium">
                                      {children}
                                    </ol>
                                  ),
                                  li: ({ children }) => (
                                    <li className="pl-1 leading-relaxed">{children}</li>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className="font-extrabold text-slate-900 dark:text-white">
                                      {children}
                                    </strong>
                                  ),
                                  em: ({ children }) => (
                                    <em className="italic text-slate-800 dark:text-slate-200">
                                      {children}
                                    </em>
                                  ),
                                  blockquote: ({ children }) => (
                                    <blockquote className="border-l-4 border-sky-400 dark:border-sky-600 pl-4 py-1.5 my-4 bg-sky-500/5 dark:bg-sky-500/10 rounded-r-2xl italic text-slate-600 dark:text-slate-400 font-medium">
                                      {children}
                                    </blockquote>
                                  ),
                                  code: ({ children, className }) => {
                                    const codeString = String(children).replace(/\n$/, "");
                                    const isInline = !codeString.includes("\n");

                                    if (isInline) {
                                      return (
                                        <code className="bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded-md font-mono text-[13px] font-bold">
                                          {codeString}
                                        </code>
                                      );
                                    }

                                    return (
                                      <pre className="bg-slate-950 text-slate-100 p-4 rounded-2xl font-mono text-sm overflow-x-auto my-4 border border-slate-800/80 shadow-md">
                                        <code className={className}>{codeString}</code>
                                      </pre>
                                    );
                                  },
                                  a: ({ href, children }) => (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sky-500 hover:text-sky-600 underline font-bold transition-colors cursor-pointer"
                                    >
                                      {children}
                                    </a>
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            )}

                            {message.isPdfRequest && (
                              <div className="mt-4 p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="sm:w-10 sm:h-10 bg-sky-500/20 rounded-full flex items-center justify-center text-sky-600 shrink-0">
                                    {pdfStates[message.id] === "success" ? (
                                      <span className="text-lg">🎉</span>
                                    ) : pdfStates[message.id] === "error" ? (
                                      <span className="text-lg text-destructive">❌</span>
                                    ) : pdfStates[message.id] &&
                                      pdfStates[message.id] !== "idle" ? (
                                      <Spinner className="w-4 h-4 text-sky-600 animate-spin" />
                                    ) : (
                                      <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-foreground m-0">
                                      {pdfStates[message.id] === "generating"
                                        ? "Creating Educational PDF"
                                        : pdfStates[message.id] === "uploading"
                                          ? "Saving to Cloud Library"
                                          : pdfStates[message.id] === "downloading"
                                            ? "Downloading material"
                                            : pdfStates[message.id] === "success"
                                              ? "Successfully Downloaded!"
                                              : pdfStates[message.id] === "error"
                                                ? "Generation Failed"
                                                : "Your PDF is ready"}
                                    </p>
                                    <p className="text-sm text-muted-foreground m-0">
                                      {pdfStates[message.id] === "generating"
                                        ? "Designing pages, wrapping text, formatting lists..."
                                        : pdfStates[message.id] === "uploading"
                                          ? "Uploading the PDF to your student folder..."
                                          : pdfStates[message.id] === "downloading"
                                            ? "Pushing the document to your local machine..."
                                            : pdfStates[message.id] === "success"
                                              ? "Check your downloads folder! 🚀"
                                              : pdfStates[message.id] === "error"
                                                ? "Something went wrong. Let's try again."
                                                : "Click to download the formatted PDF"}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => handleDownloadPDF(message.id)}
                                  disabled={
                                    pdfStates[message.id] &&
                                    pdfStates[message.id] !== "idle" &&
                                    pdfStates[message.id] !== "error"
                                  }
                                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all shrink-0 ${
                                    pdfStates[message.id] === "success"
                                      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                      : pdfStates[message.id] === "error"
                                        ? "bg-destructive hover:bg-destructive/90 text-white"
                                        : pdfStates[message.id] && pdfStates[message.id] !== "idle"
                                          ? "bg-sky-400 text-white cursor-not-allowed opacity-80"
                                          : "bg-sky-500 hover:bg-sky-600 text-white hover:scale-[1.02] active:scale-95"
                                  }`}
                                >
                                  {pdfStates[message.id] === "generating" && "Generating..."}
                                  {pdfStates[message.id] === "uploading" && "Saving..."}
                                  {pdfStates[message.id] === "downloading" && "Downloading..."}
                                  {pdfStates[message.id] === "success" && "Downloaded! ✓"}
                                  {pdfStates[message.id] === "error" && "Retry"}
                                  {(!pdfStates[message.id] || pdfStates[message.id] === "idle") &&
                                    "Download PDF"}
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
                    )}
                  </div>
                </div>
              </div>
            );
          })}

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
                  <span className="text-muted-foreground text-sm font-medium">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
