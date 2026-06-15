"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import {
  addMessage,
  addSession,
  setCurrentSessionId,
  updateMessage,
} from "@/store/slices/chatSlice";
import {
  createChatSession,
  saveChatMessage,
  trackDailyUsage,
  uploadFileToStorage,
  saveGeneratedMaterial,
  updateChatMessageAttachment,
} from "@/lib/services/shared/chat.actions";
import { Message, UserRole } from "@/types/common";
import { generatePdfBlob } from "@/hooks/shared/pdf-helper";
import { getSessionManager } from "@/lib/ai/session-manager";
import { getUniqueStoragePath } from "./chat-utils";

interface UseChatSenderArgs {
  messages: Message[];
  currentSessionId: string | null;
  isUserLoggedIn: boolean;
  isLoadingAuth: boolean;
  user: User | null;
  age?: number;
  userRole: UserRole | null;
  justCreatedSessionRef: React.MutableRefObject<boolean>;
}

export function useChatSender({
  messages,
  currentSessionId,
  isUserLoggedIn,
  isLoadingAuth,
  user,
  age,
  userRole,
  justCreatedSessionRef,
}: UseChatSenderArgs) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const pendingSendRef = useRef(false);

  const pendingInputRef = useRef<string>("");
  const pendingImageRef = useRef<string | null>(null);
  const pendingFileContentRef = useRef<string | null>(null);
  const pendingFileNameRef = useRef<string | null>(null);

  const sendMessage = useCallback(
    async (
      currentInput: string,
      currentImage: string | null,
      currentFileContent: string | null,
      currentFileName: string | null
    ) => {
      if (isLoading) return;
      if (isLoadingAuth) {
        pendingSendRef.current = true;
        pendingInputRef.current = currentInput;
        pendingImageRef.current = currentImage;
        pendingFileContentRef.current = currentFileContent;
        pendingFileNameRef.current = currentFileName;
        return;
      }

      let sessionId = currentSessionId;
      const canPersist = !!user?.id;

      if (!currentInput.trim() && !currentImage && !currentFileContent && !currentFileName) {
        return;
      }

      const isAttachmentPresent =
        !!currentFileContent || /\[Attachment:.*\.pdf\]/i.test(currentInput || "");
      const isSummaryOrQuery =
        /summarize|summarise|summary|explain|read|analyze|analyse|outline|extract|review/i.test(
          currentInput || ""
        );

      const isPdfRequest =
        !isAttachmentPresent &&
        !isSummaryOrQuery &&
        /pdf/i.test(currentInput || "") &&
        /generate|create|make|build|download|export|convert/i.test(currentInput || "");

      // Intercept PDF requests for unauthenticated (guest) users
      if (!isUserLoggedIn && isPdfRequest) {
        setIsLoading(true);

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

      const savedContent = currentFileName
        ? `[File: ${currentFileName}] ${currentInput}`
        : currentInput;

      setIsLoading(true);

      let userAttachmentUrl: string | undefined = undefined;

      // 1. Upload user attachment if exists (Images or PDFs)
      if (canPersist && (currentImage || currentFileContent)) {
        try {
          if (currentImage) {
            const res = await fetch(currentImage);
            const blob = await res.blob();
            if (!user?.id) throw new Error("Missing user id for image upload");
            const path = getUniqueStoragePath(user.id, sessionId || "new", "jpg", "image");
            userAttachmentUrl = await uploadFileToStorage(blob, path, user.id);
          } else if (currentFileContent) {
            // Upload PDF or Text file
            const blob = new Blob([currentFileContent], { type: "text/plain" });
            if (!user?.id) throw new Error("Missing user id for document upload");
            const path = getUniqueStoragePath(user.id, sessionId || "new", "txt", "doc");
            userAttachmentUrl = await uploadFileToStorage(blob, path, user.id);
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

      // Prepare history for API including image context persistence
      const chatHistory = messages.slice(-20).map((m) => ({
        role: m.role === "user" ? "user" : "model",
        content: m.content,
        image: m.role === "user" ? m.uploadedImage : undefined,
        // Persist the AI-generated image URL so the backend can inject it back into context
        generatedImage: m.role === "model" && m.isImage ? m.content : undefined,
      }));

      // 2. Create session and save user message if it doesn't exist
      if (!sessionId && canPersist) {
        try {
          const newSession = await createChatSession(currentInput.slice(0, 30) + "...", user?.id);
          sessionId = newSession.id;

          const userTokens = Math.round(currentInput.length / 4);
          await saveChatMessage(
            sessionId,
            "user",
            savedContent,
            {
              tokens: userTokens,
              attachmentUrl: userAttachmentUrl,
            },
            user?.id
          );
          await trackDailyUsage(userTokens, {}, user?.id);

          justCreatedSessionRef.current = true;
          dispatch(addSession(newSession));
          dispatch(setCurrentSessionId(sessionId));
          const targetUrl =
            typeof window !== "undefined" && window.location.pathname.startsWith("/chat/")
              ? `${window.location.pathname}?id=${sessionId}`
              : `/?id=${sessionId}`;
          router.replace(targetUrl);
        } catch (error) {
          console.error("Failed to create session/save message:", error);
        }
      } else if (sessionId && canPersist) {
        const userTokens = Math.round(currentInput.length / 4);
        try {
          await saveChatMessage(
            sessionId,
            "user",
            savedContent,
            {
              tokens: userTokens,
              attachmentUrl: userAttachmentUrl,
            },
            user?.id
          );
          await trackDailyUsage(userTokens, {}, user?.id);
        } catch (dbErr) {
          console.error("Failed to save user message to database:", dbErr);
        }
      }

      setIsLoading(true);

      const sessionManager = getSessionManager();
      const requestId = crypto.randomUUID();
      const signal = sessionManager.registerRequest(requestId);

      try {
        // Detect explicit image creation requests.
        const queryLower = currentInput.trim().toLowerCase();

        const hasAnalysisIntent =
          /(explain|describe|what\s+is|tell\s+me|analyze|analyse|discuss|identify|who|why|how|where|when|detail|in\s+(the\s+)?(image|photo|picture|drawing|illustration)|about\s+(the\s+)?(image|photo|picture|drawing|illustration)|previous\s+(image|photo|picture|drawing|illustration)|above\s+(image|photo|picture|drawing|illustration))/i.test(
            queryLower
          );

        const hasDirectCreation =
          /(draw|paint|sketch|illustrate|render|visualize)\s+(a|an|the|some)?\s*[a-z0-9]/i.test(
            queryLower
          );

        const hasRequestVerb =
          /(draw|create|generate|make|show|paint|sketch|produce|design|illustrate|visualize|render|want|wanted|need|display|give\s+me|fetch)/i.test(
            queryLower
          );
        const hasVisualNoun =
          /(image|picture|drawing|painting|photo|illustration|artwork|graphic|visual|portrait|scene|diagram)/i.test(
            queryLower
          );

        const hasOfPattern =
          /(image|picture|photo|illustration|drawing|painting|sketch|graphic|portrait|diagram)\s+of/i.test(
            queryLower
          );

        const isShortVisualNoun = hasVisualNoun && queryLower.length < 40;

        const isImageRequest =
          !currentImage &&
          !hasAnalysisIntent &&
          (hasDirectCreation ||
            (hasRequestVerb && hasVisualNoun) ||
            hasOfPattern ||
            isShortVisualNoun);

        const apiUrl = isImageRequest ? "/api/generate-image" : "/api/chat";
        const bodyPayload = isImageRequest
          ? { prompt: currentInput }
          : {
              message: finalInputForAI,
              image: currentImage,
              history: chatHistory,
              role: userRole || "kid",
              age: age,
              sessionId: sessionId || undefined,
            };

        const apiStartTime = Date.now();
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
          signal,
        });

        if (!isImageRequest && !isPdfRequest && res.body) {
          // 1. Generate unique message ID
          const aiMessageId = crypto.randomUUID();

          // 2. Dispatch initial empty message to UI immediately!
          const initialAiMessage: Message = {
            id: aiMessageId,
            role: "model",
            content: "",
          };
          dispatch(addMessage(initialAiMessage));
          setIsLoading(false);

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let aiResponseContent = "";
          let buffer = "";

          // Batched Redux Updates: setup 50ms interval to write to Redux at most 20 times/second
          let lastDispatchedContent = "";
          let isImageStream = false;

          const flushStreamUpdate = () => {
            if (aiResponseContent !== lastDispatchedContent) {
              lastDispatchedContent = aiResponseContent;
              dispatch(
                updateMessage({
                  id: aiMessageId,
                  content: aiResponseContent,
                  isImage: isImageStream ? true : undefined,
                })
              );
            }
          };

          const flushInterval = setInterval(flushStreamUpdate, 50);

          try {
            while (true) {
              if (signal.aborted) {
                break;
              }
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                if (trimmed.startsWith("data: ")) {
                  const dataStr = trimmed.substring(6);
                  if (dataStr === "[DONE]") continue;

                  try {
                    const parsed = JSON.parse(dataStr);
                    const text = parsed.text || "";
                    const imageUrl = parsed.imageUrl || "";
                    if (imageUrl) {
                      aiResponseContent = imageUrl;
                      isImageStream = true;
                      // For image stream endpoints, flush immediately
                      flushStreamUpdate();
                    } else if (text) {
                      aiResponseContent += text;
                    }
                  } catch {
                    aiResponseContent += dataStr;
                  }
                } else {
                  aiResponseContent += trimmed;
                }
              }
            }

            // Flush remaining buffer
            if (buffer.trim()) {
              const trimmed = buffer.trim();
              let isStreamImage = false;
              if (trimmed.startsWith("data: ")) {
                const dataStr = trimmed.substring(6);
                if (dataStr !== "[DONE]") {
                  try {
                    const parsed = JSON.parse(dataStr);
                    const text = parsed.text || "";
                    const imageUrl = parsed.imageUrl || "";
                    if (imageUrl) {
                      aiResponseContent = imageUrl;
                      isStreamImage = true;
                    } else if (text) {
                      aiResponseContent += text;
                    }
                  } catch {
                    aiResponseContent += dataStr;
                  }
                }
              } else {
                aiResponseContent += trimmed;
              }
              if (isStreamImage) {
                isImageStream = true;
              }
            }
          } catch (streamErr) {
            console.error("[ChatInterface] Stream reading error:", streamErr);
          } finally {
            clearInterval(flushInterval);
            flushStreamUpdate(); // Final flush to guarantee latest text state is synced to Redux
            reader.releaseLock();
          }

          const responseTime = Date.now() - apiStartTime;
          const tokens = Math.round(aiResponseContent.length / 4);

          // 3. Process database persistence and daily tracking in the background
          if (sessionId && canPersist) {
            (async () => {
              try {
                const isImage =
                  aiResponseContent.startsWith("https://image.pollinations.ai/") ||
                  aiResponseContent.startsWith("https://pollinations.ai/") ||
                  aiResponseContent.startsWith("data:image/");

                if (isImage) {
                  try {
                    // INSERT the message row first so the subsequent UPDATE has a target
                    await saveChatMessage(
                      sessionId,
                      "model",
                      aiResponseContent,
                      {
                        id: aiMessageId,
                        tokens: Math.round(100),
                        model: "imagen",
                        responseTime: responseTime,
                      },
                      user?.id
                    );

                    let imgAttachmentUrl = aiResponseContent;

                    if (aiResponseContent.startsWith("data:image/")) {
                      const imgRes = await fetch(aiResponseContent);
                      const imgBlob = await imgRes.blob();
                      if (!user?.id) throw new Error("Missing user id for image upload");
                      const storageFileName = getUniqueStoragePath(
                        user.id,
                        sessionId,
                        "jpg",
                        "image"
                      );
                      imgAttachmentUrl = await uploadFileToStorage(
                        imgBlob,
                        storageFileName,
                        user.id
                      );
                    }

                    // Update Redux state and cache with the permanent URL so the local client has it
                    dispatch(
                      updateMessage({
                        id: aiMessageId,
                        content: imgAttachmentUrl,
                        attachmentUrl: imgAttachmentUrl,
                        isImage: true,
                      })
                    );

                    // Update DB with the permanent image URL
                    await updateChatMessageAttachment(aiMessageId, imgAttachmentUrl);

                    // Save to generated materials table
                    await saveGeneratedMaterial(
                      sessionId,
                      "image",
                      "image/jpeg",
                      imgAttachmentUrl,
                      { prompt: currentInput },
                      user?.id
                    );

                    // Track daily usage for image
                    await trackDailyUsage(
                      Math.round(100),
                      { isImage: true, durationMs: responseTime },
                      user?.id
                    );
                  } catch (imgUploadErr) {
                    console.error("[ChatInterface] Background image upload failed:", imgUploadErr);
                  }
                } else if (aiResponseContent.trim()) {
                  // Only save non-empty text responses
                  await saveChatMessage(
                    sessionId,
                    "model",
                    aiResponseContent,
                    {
                      id: aiMessageId,
                      tokens,
                      model: "gemini-2.5-flash",
                      responseTime: responseTime,
                    },
                    user?.id
                  );

                  await trackDailyUsage(tokens, { durationMs: responseTime }, user?.id);
                }
              } catch (backgroundErr) {
                console.error(
                  "[ChatInterface] Background DB persistence/tracking failed:",
                  backgroundErr
                );
              }
            })();
          }
        } else {
          const data = await res.json();
          const responseTime = Date.now() - apiStartTime;
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
                    try {
                      const imageRes = await fetch("/api/generate-image", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ prompt }),
                      });
                      if (imageRes.ok) {
                        const imageData = await imageRes.json();
                        if (imageData && imageData.image) {
                          aiResponseContent = imageData.image;
                          isImageResponse = true;
                        }
                      }
                    } catch (e) {
                      console.error("Failed to generate image from tool call:", e);
                      aiResponseContent = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true`;
                      isImageResponse = true;
                    }
                  }
                }
              }
            } catch {
              // Not a valid JSON tool call
            }
          }

          // 1. Generate unique message ID
          const aiMessageId = crypto.randomUUID();

          // 2. Dispatch initial/instant message to UI immediately!
          const initialAiMessage: Message = {
            id: aiMessageId,
            role: "model",
            content: aiResponseContent,
            isImage: isImageResponse,
            pdfContent: data?.isPdfRequest ? data.pdfContent : undefined,
            isPdfRequest: data?.isPdfRequest,
            token_used: tokens,
            pdfTheme: data?.isPdfRequest ? data.pdfTheme : undefined,
          };

          dispatch(addMessage(initialAiMessage));
          setIsLoading(false);

          // 3. Process database persistence, file uploads, and daily tracking asynchronously in the background
          if (sessionId && canPersist) {
            (async () => {
              const finalContent = aiResponseContent;

              try {
                // Save model message to DB instantly first to prevent page unmount/refresh desyncs
                const modelName =
                  data.model ||
                  data.modelUsed ||
                  (isImageResponse ? "imagen-4-fast-generate" : "gemini-2.5-flash");

                await saveChatMessage(
                  sessionId,
                  "model",
                  finalContent,
                  {
                    id: aiMessageId,
                    tokens,
                    model: modelName,
                    responseTime: responseTime,
                  },
                  user?.id
                );

                // Asynchronously compile and upload images in the background
                if (isImageResponse) {
                  (async () => {
                    try {
                      let imgAttachmentUrl = aiResponseContent;

                      if (aiResponseContent.startsWith("data:image/")) {
                        const imgRes = await fetch(aiResponseContent);
                        const imgBlob = await imgRes.blob();
                        if (!user?.id) throw new Error("Missing user id for image upload");
                        const storageFileName = getUniqueStoragePath(
                          user.id,
                          sessionId,
                          "jpg",
                          "image"
                        );
                        imgAttachmentUrl = await uploadFileToStorage(
                          imgBlob,
                          storageFileName,
                          user.id
                        );
                      }

                      // Update Redux state and cache with the permanent URL so the local client has it
                      dispatch(
                        updateMessage({
                          id: aiMessageId,
                          content: imgAttachmentUrl,
                          attachmentUrl: imgAttachmentUrl,
                        })
                      );

                      // Update DB with the permanent image URL
                      await updateChatMessageAttachment(aiMessageId, imgAttachmentUrl);

                      // Save to generated materials table
                      await saveGeneratedMaterial(
                        sessionId,
                        "image",
                        "image/jpeg",
                        imgAttachmentUrl,
                        { prompt: currentInput },
                        user?.id
                      );

                      // Track daily usage for image
                      await trackDailyUsage(
                        Math.round(100),
                        { isImage: true, durationMs: responseTime },
                        user?.id
                      );
                    } catch (imgUploadErr) {
                      console.error(
                        "[ChatInterface] Background image upload failed:",
                        imgUploadErr
                      );
                    }
                  })();
                }

                // Asynchronously compile and upload PDFs in the background
                if (data.isPdfRequest && data.pdfContent) {
                  (async () => {
                    try {
                      const resolvedRole = (userRole || "kid") as UserRole;
                      const pdfBlob = await generatePdfBlob(data.pdfContent, resolvedRole);
                      if (!user?.id) throw new Error("Missing user id for pdf upload");
                      const storageFileName = getUniqueStoragePath(
                        user.id,
                        sessionId,
                        "pdf",
                        "pdf"
                      );
                      const pdfAttachmentUrl = await uploadFileToStorage(
                        pdfBlob,
                        storageFileName,
                        user.id
                      );

                      // Update Redux state and cache with the permanent PDF URL
                      dispatch(
                        updateMessage({
                          id: aiMessageId,
                          content: finalContent,
                          attachmentUrl: pdfAttachmentUrl,
                        })
                      );

                      // Update DB with the permanent PDF URL
                      await updateChatMessageAttachment(aiMessageId, pdfAttachmentUrl);

                      // Save to generated materials table
                      await saveGeneratedMaterial(
                        sessionId,
                        "pdf",
                        "application/pdf",
                        pdfAttachmentUrl,
                        { prompt: currentInput },
                        user?.id
                      );

                      // Track daily usage for PDF
                      await trackDailyUsage(
                        tokens,
                        { isPdf: true, durationMs: responseTime },
                        user?.id
                      );
                    } catch (pdfUploadErr) {
                      console.error("[ChatInterface] Background PDF upload failed:", pdfUploadErr);
                    }
                  })();
                }

                // Track non-image/non-pdf usage
                if (!isImageResponse && !data.isPdfRequest) {
                  await trackDailyUsage(tokens, { durationMs: responseTime }, user?.id);
                }
              } catch (backgroundErr) {
                console.error(
                  "[ChatInterface] Background DB persistence/tracking failed:",
                  backgroundErr
                );
              }
            })();
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error(
          "[useChatSender] Chat error:",
          error instanceof Error ? error.message : String(error)
        );
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
    },
    [
      isLoading,
      isLoadingAuth,
      currentSessionId,
      user,
      age,
      userRole,
      isUserLoggedIn,
      messages,
      dispatch,
      router,
      justCreatedSessionRef,
    ]
  );

  useEffect(() => {
    if (!pendingSendRef.current) return;
    if (isLoadingAuth) return;

    pendingSendRef.current = false;
    const timer = setTimeout(() => {
      void sendMessage(
        pendingInputRef.current,
        pendingImageRef.current,
        pendingFileContentRef.current,
        pendingFileNameRef.current
      );
      // Clear values after trigger
      pendingInputRef.current = "";
      pendingImageRef.current = null;
      pendingFileContentRef.current = null;
      pendingFileNameRef.current = null;
    }, 0);
    return () => clearTimeout(timer);
  }, [isLoadingAuth, sendMessage]);

  const stopGenerating = useCallback(() => {
    const sessionManager = getSessionManager();
    sessionManager.abortActiveRequest();
    setIsLoading(false);
  }, []);

  return { isLoading, sendMessage, stopGenerating };
}
