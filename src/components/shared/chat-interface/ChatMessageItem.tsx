"use client";

import React from "react";
import {
  Bot,
  Check,
  Copy,
  Download,
  FileText,
  Volume2,
  Square,
  Pause,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import { Message } from "@/types/common";
import { IoPersonCircleOutline } from "react-icons/io5";
import { DownloadCard } from "./DownloadCard";
import { useUser, useSpeech, useDownloads, useChatSession } from "./chatStore";

// Task 3.1: Create cleanTerminationContent utility function
function cleanTerminationContent(content: string): string {
  if (!content) return "";

  return content
    .replace(/\n\n\*\(Generation stopped by user\.\)\*/g, "")
    .replace(/Generation stopped by user\./g, "")
    .replace(/\n\n\*\(Session has been terminated\.\)\*/g, "")
    .replace(/Session has been terminated\./g, "")
    .trim();
}

interface ChatMessageItemProps {
  message: Message;
  isUser: boolean;
  showModelHeader: boolean;
}

const markdownComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children }) => (
    <h1 className="text-section-title text-sky-600 dark:text-sky-400 mt-4 mb-2 first:mt-0 flex items-center gap-1.5">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-card-title text-sky-700 dark:text-sky-300 mt-3.5 mb-2 first:mt-0 flex items-center gap-1.5">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-body-lg font-bold text-sky-800 dark:text-sky-200 mt-3 mb-1 first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-relaxed text-body-md text-slate-700 dark:text-slate-350 font-medium">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 my-3 space-y-2 text-body-md text-slate-700 dark:text-slate-300 font-medium">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 my-3 space-y-2 text-body-md text-slate-700 dark:text-slate-300 font-medium">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-extrabold text-slate-900 dark:text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-slate-800 dark:text-slate-200">{children}</em>,
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
      <pre className="bg-slate-950 text-slate-100 p-4 rounded-2xl font-mono text-sm whitespace-pre-wrap break-words my-4 border border-slate-800/80 shadow-md">
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
};

const ChatMessageItem = React.memo(
  function ChatMessageItem({ message, isUser, showModelHeader }: ChatMessageItemProps) {
    // If it's a model message with no content and not failed/image/document, don't render it
    const hasNoDisplayContent =
      !isUser &&
      !message.content?.trim() &&
      !message.isImage &&
      !message.isPdfRequest &&
      !message.isDocRequest &&
      message.status !== "failed";

    const { userProfile } = useUser();
    const { sessionOwnerProfile, onRetry } = useChatSession();
    const { pdfStates, docxStates, handleDownloadPDF, handleDownloadDocx } = useDownloads();
    const {
      activeSpeakingId,
      isPlaying,
      isSpeechLoading,
      isSpeechPaused,
      speak: onSpeak,
      stop: onStop,
      pause: onPause,
      resume: onResume,
    } = useSpeech();

    const [isCopied, setIsCopied] = React.useState(false);
    const handleCopy = React.useCallback(async (messageId: string, content: string) => {
      if (!content) return;
      try {
        await navigator.clipboard.writeText(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1200);
      } catch (error) {
        console.error("Failed to copy message:", error);
      }
    }, []);

    const pdfState = pdfStates[message.id] || "idle";
    const docxState = docxStates[message.id] || "idle";
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
    const [previewImageUrl, setPreviewImageUrl] = React.useState("");
    const [resolvedImageUrl, setResolvedImageUrl] = React.useState<string | null>(null);
    const [resolvedGeneratedImageUrl, setResolvedGeneratedImageUrl] = React.useState<string | null>(
      null
    );

    React.useEffect(() => {
      if (message.uploadedImage) {
        setResolvedImageUrl(message.uploadedImage);
      } else {
        setResolvedImageUrl(null);
      }
    }, [message.uploadedImage]);

    React.useEffect(() => {
      if (message.isImage && message.content) {
        setResolvedGeneratedImageUrl(message.content);
      } else {
        setResolvedGeneratedImageUrl(null);
      }
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

    const resolvedProfile = message.senderProfile
      ? message.senderProfile
      : message.userId && sessionOwnerProfile && message.userId === sessionOwnerProfile.user_id
        ? sessionOwnerProfile
        : userProfile;

    // Task 3.2: Update termination detection logic
    const isStoppedByUser =
      message.status === "failed" &&
      !!message.content &&
      (message.content.includes("stopped by user") || message.content.includes("terminated"));

    // Task 3.3: Apply content cleaning
    const cleanContent = isStoppedByUser
      ? cleanTerminationContent(message.content)
      : message.content;

    const speakText =
      message.status === "failed"
        ? isStoppedByUser
          ? cleanContent
            ? `${cleanContent}. Session has been terminated.`
            : "Session has been terminated."
          : "Sorry, something went wrong and I couldn't finish generating that response. Please try again."
        : message.content || "";

    if (hasNoDisplayContent) {
      return null;
    }

    return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`flex items-end gap-2 sm:gap-3 max-w-[95%] sm:max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
          <Avatar size={"sm"} className="hidden sm:flex shrink-0 mb-1">
            {isUser ? (
              <>
                {resolvedProfile?.avatar_url ? (
                  <AvatarImage
                    src={resolvedProfile.avatar_url}
                    alt={resolvedProfile.first_name || "User"}
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <AvatarFallback className="bg-sky-500/10 text-sky-600 font-bold uppercase">
                  {resolvedProfile?.first_name ? (
                    resolvedProfile.first_name.charAt(0)
                  ) : (
                    <IoPersonCircleOutline size={20} />
                  )}
                </AvatarFallback>
              </>
            ) : (
              <AvatarFallback className="bg-sky-500 text-white">
                <Bot className="icon-sm" />
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
                className={`rounded-2xl sm:rounded-3xl px-3 sm:px-5 py-2.5 sm:py-3.5 leading-relaxed text-body-md shadow-sm ${
                  isUser
                    ? "bg-sky-500 text-white rounded-br-sm"
                    : "bg-card border border-border rounded-bl-sm text-foreground"
                }`}
              >
                {showModelHeader && (
                  <div className="flex items-center gap-1.5 text-sky-600 font-bold text-body-sm mb-2">
                    <Bot className="icon-sm" /> AI Buddy
                  </div>
                )}

                {!isUser ? (
                  <div className="w-full text-foreground space-y-1 overflow-hidden font-medium">
                    {message.status === "failed" ? (
                      <div className="flex flex-col gap-3 py-1">
                        {isStoppedByUser ? (
                          <div className="space-y-3">
                            {cleanContent && (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                              >
                                {cleanContent}
                              </ReactMarkdown>
                            )}
                            {/* Task 3.4: Single, unified termination message */}
                            <div className="text-slate-600 dark:text-slate-400 text-body-sm">
                              <span>Session has been terminated.</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-red-500 font-semibold text-body-sm">
                              Sorry, something went wrong and I couldn&apos;t finish generating that
                              response. Please try again.
                            </p>
                            {onRetry && (
                              <Button
                                onClick={onRetry}
                                variant="outline"
                                size="sm"
                                className="w-fit border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl font-semibold cursor-pointer"
                              >
                                Retry
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    ) : message.isImage && resolvedGeneratedImageUrl ? (
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
                          className="flex items-center gap-1.5 w-fit rounded-lg text-body-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 mt-1"
                        >
                          <Download className="icon-xs" /> Download Image
                        </Button>
                      </div>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {message.content}
                      </ReactMarkdown>
                    )}

                    {message.isPdfRequest && (
                      <DownloadCard
                        type="pdf"
                        state={pdfState}
                        onDownload={() => handleDownloadPDF(message.id)}
                      />
                    )}

                    {message.isDocRequest && (
                      <DownloadCard
                        type="docx"
                        state={docxState}
                        onDownload={() => handleDownloadDocx(message.id)}
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {message.content && <p className="m-0 leading-relaxed">{message.content}</p>}
                    {message.fileName &&
                      (message.attachmentUrl ? (
                        <a
                          href={message.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-white/20 hover:bg-white/30 rounded-xl text-body-xs font-bold w-fit mt-1 transition-colors cursor-pointer text-current"
                          title="Open attachment"
                        >
                          <FileText className="icon-xs" /> {message.fileName}
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-white/20 rounded-xl text-body-xs font-bold w-fit mt-1">
                          <FileText className="icon-xs" /> {message.fileName}
                        </div>
                      ))}
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
                {!isUser && (
                  <div className="flex items-center gap-1">
                    {activeSpeakingId === message.id ? (
                      <>
                        {isSpeechLoading ? (
                          <div className="flex items-center justify-center p-1 rounded-lg text-sky-500">
                            <Loader2 className="icon-xs animate-spin" />
                          </div>
                        ) : isPlaying ? (
                          <button
                            type="button"
                            onClick={() => onPause && onPause()}
                            className="flex items-center justify-center p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-150"
                            title="Pause"
                          >
                            <Pause className="icon-xs" />
                          </button>
                        ) : isSpeechPaused ? (
                          <button
                            type="button"
                            onClick={() => onResume && onResume()}
                            className="flex items-center justify-center p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-150 text-sky-500"
                            title="Resume"
                          >
                            <Volume2 className="icon-xs" />
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => onStop && onStop()}
                          className="flex items-center justify-center p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500 hover:text-red-600 transition-colors duration-150"
                          title="Stop"
                        >
                          <Square className="icon-xs fill-current" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSpeak && onSpeak(message.id, speakText)}
                        className="flex items-center justify-center p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-150"
                        title="Read aloud"
                      >
                        <Volume2 className="icon-xs" />
                      </button>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleCopy(message.id, message.content)}
                  className="flex items-center justify-center p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-150"
                  title={isCopied ? "Copied!" : "Copy message"}
                >
                  {isCopied ? (
                    <Check className="icon-xs text-emerald-500" />
                  ) : (
                    <Copy className="icon-xs" />
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
      prevProps.isUser === nextProps.isUser &&
      prevProps.showModelHeader === nextProps.showModelHeader &&
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.userId === nextProps.message.userId &&
      prevProps.message.senderProfile?.avatar_url === nextProps.message.senderProfile?.avatar_url &&
      prevProps.message.senderProfile?.first_name === nextProps.message.senderProfile?.first_name &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.uploadedImage === nextProps.message.uploadedImage &&
      prevProps.message.attachmentUrl === nextProps.message.attachmentUrl &&
      prevProps.message.fileName === nextProps.message.fileName &&
      prevProps.message.isImage === nextProps.message.isImage &&
      prevProps.message.isPdfRequest === nextProps.message.isPdfRequest &&
      prevProps.message.pdfContent === nextProps.message.pdfContent &&
      prevProps.message.pdfTheme === nextProps.message.pdfTheme &&
      prevProps.message.status === nextProps.message.status
    );
  }
);

ChatMessageItem.displayName = "ChatMessageItem";

export default ChatMessageItem;
