"use client";

import React from "react";
import { Bot, Check, Copy, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import { Message } from "@/types/common";
import type { UserProfile } from "@/types/user";
import { getSignedResourceUrl } from "@/lib/services/shared/storage.actions";
import { IoPersonCircleOutline } from "react-icons/io5";

interface ChatMessageItemProps {
  message: Message;
  isUser: boolean;
  showModelHeader: boolean;
  pdfState: "idle" | "generating" | "uploading" | "downloading" | "success" | "error";
  handleDownloadPDF: (messageId: string) => Promise<void>;
  isCopied: boolean;
  handleCopy: (messageId: string, content: string) => void;
  isUserLoggedIn: boolean;
  userProfile: UserProfile | null;
}

const ChatMessageItem = React.memo(
  function ChatMessageItem({
    message,
    isUser,
    showModelHeader,
    pdfState,
    handleDownloadPDF,
    isCopied,
    handleCopy,
    isUserLoggedIn,
    userProfile,
  }: ChatMessageItemProps) {
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
    const [previewImageUrl, setPreviewImageUrl] = React.useState("");
    const [resolvedImageUrl, setResolvedImageUrl] = React.useState<string | null>(null);
    const [resolvedGeneratedImageUrl, setResolvedGeneratedImageUrl] = React.useState<string | null>(
      null
    );

    React.useEffect(() => {
      let active = true;
      if (message.uploadedImage) {
        if (message.uploadedImage.includes("/object/public/materials/")) {
          const relativePath = message.uploadedImage.split("/object/public/materials/")[1];
          getSignedResourceUrl(relativePath)
            .then((url) => {
              if (active) setResolvedImageUrl(url);
            })
            .catch((err) => {
              console.error("Failed to sign user image:", err);
              if (active) setResolvedImageUrl(message.uploadedImage!);
            });
        } else {
          setResolvedImageUrl(message.uploadedImage);
        }
      } else {
        setResolvedImageUrl(null);
      }
      return () => {
        active = false;
      };
    }, [message.uploadedImage]);

    React.useEffect(() => {
      let active = true;
      if (message.isImage && message.content) {
        if (message.content.includes("/object/public/materials/")) {
          const relativePath = message.content.split("/object/public/materials/")[1];
          getSignedResourceUrl(relativePath)
            .then((url) => {
              if (active) setResolvedGeneratedImageUrl(url);
            })
            .catch((err) => {
              console.error("Failed to sign generated image:", err);
              if (active) setResolvedGeneratedImageUrl(message.content);
            });
        } else {
          setResolvedGeneratedImageUrl(message.content);
        }
      } else {
        setResolvedGeneratedImageUrl(null);
      }
      return () => {
        active = false;
      };
    }, [message.isImage, message.content]);

    const handleDownloadImage = React.useCallback(async (url: string) => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `illustration_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error("Failed to download image:", error);
      }
    }, []);

    return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`flex items-end gap-3 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
          <Avatar size={"sm"} className="shrink-0 mb-1">
            {isUser ? (
              <>
                {isUserLoggedIn && userProfile?.avatar_url ? (
                  <AvatarImage
                    src={userProfile.avatar_url}
                    alt={userProfile.first_name || "User"}
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <AvatarFallback className="bg-sky-500/10 text-sky-600 font-bold uppercase">
                  {isUserLoggedIn && userProfile?.first_name ? (
                    userProfile.first_name.charAt(0)
                  ) : (
                    <IoPersonCircleOutline />
                  )}
                </AvatarFallback>
              </>
            ) : (
              <AvatarFallback className="bg-sky-500 text-white">
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            )}
          </Avatar>

          <div
            className={`flex flex-col gap-2 overflow-x-auto ${isUser ? "items-end" : "items-start"}`}
          >
            {resolvedImageUrl && (
              <div className="relative group cursor-pointer overflow-hidden rounded-2xl">
                <Image
                  src={resolvedImageUrl}
                  alt="Uploaded"
                  width={128}
                  height={128}
                  className="w-32 h-32 object-cover rounded-2xl shadow-sm border border-border transition-transform duration-300 group-hover:scale-[1.02]"
                  unoptimized
                  onClick={() => {
                    setPreviewImageUrl(resolvedImageUrl);
                    setIsPreviewOpen(true);
                  }}
                />
              </div>
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
                  <div className="flex items-center gap-1.5 text-sky-600 font-bold text-sm mb-2">
                    <Bot className="w-4 h-4" /> AI Buddy
                  </div>
                )}

                {!isUser ? (
                  <div className="w-full text-foreground space-y-1 overflow-hidden font-medium">
                    {message.isImage && resolvedGeneratedImageUrl ? (
                      <div className="flex flex-col gap-2">
                        <div className="relative group cursor-pointer overflow-hidden rounded-xl">
                          <Image
                            src={resolvedGeneratedImageUrl}
                            alt="Generated Illustration"
                            width={400}
                            height={400}
                            className="rounded-xl max-w-full md:max-w-xs shadow-sm transition-transform duration-300 group-hover:scale-[1.02]"
                            unoptimized
                            onClick={() => {
                              setPreviewImageUrl(resolvedGeneratedImageUrl);
                              setIsPreviewOpen(true);
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleDownloadImage(resolvedGeneratedImageUrl)}
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-1.5 w-fit rounded-lg text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 mt-1"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Image
                        </Button>
                      </div>
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
                            {pdfState === "success" ? (
                              <span className="text-lg">🎉</span>
                            ) : pdfState === "error" ? (
                              <span className="text-lg text-destructive">❌</span>
                            ) : pdfState && pdfState !== "idle" ? (
                              <Spinner className="w-4 h-4 text-sky-600 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground m-0">
                              {pdfState === "generating"
                                ? "Creating Educational PDF"
                                : pdfState === "uploading"
                                  ? "Saving to Cloud Library"
                                  : pdfState === "downloading"
                                    ? "Downloading material"
                                    : pdfState === "success"
                                      ? "Successfully Downloaded!"
                                      : pdfState === "error"
                                        ? "Generation Failed"
                                        : "Your PDF is ready"}
                            </p>
                            <p className="text-sm text-muted-foreground m-0">
                              {pdfState === "generating"
                                ? "Designing pages, wrapping text, formatting lists..."
                                : pdfState === "uploading"
                                  ? "Uploading the PDF to your student folder..."
                                  : pdfState === "downloading"
                                    ? "Pushing the document to your local machine..."
                                    : pdfState === "success"
                                      ? "Check your downloads folder! 🚀"
                                      : pdfState === "error"
                                        ? "Something went wrong. Let's try again."
                                        : "Click to download the formatted PDF"}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDownloadPDF(message.id)}
                          disabled={pdfState && pdfState !== "idle" && pdfState !== "error"}
                          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all shrink-0 ${
                            pdfState === "success"
                              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                              : pdfState === "error"
                                ? "bg-destructive hover:bg-destructive/90 text-white"
                                : pdfState && pdfState !== "idle"
                                  ? "bg-sky-400 text-white cursor-not-allowed opacity-80"
                                  : "bg-sky-500 hover:bg-sky-600 text-white hover:scale-[1.02] active:scale-95"
                          }`}
                        >
                          {pdfState === "generating" && "Generating..."}
                          {pdfState === "uploading" && "Saving..."}
                          {pdfState === "downloading" && "Downloading..."}
                          {pdfState === "success" && "Downloaded! ✓"}
                          {pdfState === "error" && "Retry"}
                          {(!pdfState || pdfState === "idle") && "Download PDF"}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {message.content && <p className="m-0 leading-relaxed">{message.content}</p>}
                    {message.fileName && (
                      <div className="flex items-center gap-2 p-2 bg-white/20 rounded-xl text-xs font-bold w-fit mt-1">
                        <FileText className="w-3 h-3" /> {message.fileName}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Actions Row BELOW the Bubble */}
            {message.content && !message.isImage && (
              <div
                className={`flex items-center gap-2 px-1.5 text-slate-400 dark:text-slate-500 mt-0.5 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleCopy(message.id, message.content)}
                  className="flex items-center justify-center p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-150"
                  title={isCopied ? "Copied!" : "Copy message"}
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {isPreviewOpen && (
          <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm p-4 cursor-zoom-out"
            onClick={() => setIsPreviewOpen(false)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white rounded-full p-2.5 transition-all duration-200"
                aria-label="Close preview"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Preview image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImageUrl}
                alt="Image Preview"
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />

              {/* Action buttons inside preview */}
              <div className="mt-4 flex gap-3">
                <Button
                  onClick={() => handleDownloadImage(previewImageUrl)}
                  className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-4 py-2 font-semibold flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download
                </Button>
                <Button
                  onClick={() => setIsPreviewOpen(false)}
                  variant="secondary"
                  className="rounded-xl px-4 py-2 font-semibold"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.uploadedImage === nextProps.message.uploadedImage &&
      prevProps.message.attachmentUrl === nextProps.message.attachmentUrl &&
      prevProps.message.fileName === nextProps.message.fileName &&
      prevProps.message.isImage === nextProps.message.isImage &&
      prevProps.message.isPdfRequest === nextProps.message.isPdfRequest &&
      prevProps.message.pdfContent === nextProps.message.pdfContent &&
      prevProps.message.pdfTheme === nextProps.message.pdfTheme &&
      prevProps.pdfState === nextProps.pdfState &&
      prevProps.isCopied === nextProps.isCopied &&
      prevProps.isUserLoggedIn === nextProps.isUserLoggedIn &&
      prevProps.userProfile?.avatar_url === nextProps.userProfile?.avatar_url &&
      prevProps.userProfile?.first_name === nextProps.userProfile?.first_name
    );
  }
);

ChatMessageItem.displayName = "ChatMessageItem";

export default ChatMessageItem;
