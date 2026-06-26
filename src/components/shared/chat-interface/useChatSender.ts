"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
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
import { Message, UserRole, ChatSessionRow } from "@/types/common";
import { generatePdfBlob } from "@/hooks/shared/pdf-helper";
import { generateDocxBlob } from "@/hooks/shared/docx-helper";
import { getSessionManager } from "@/lib/ai/session-manager";
import { getUniqueStoragePath } from "./chat-utils";
import { createClient } from "@/lib/supabase/client";
import { uploadChatAttachment } from "@/lib/storage/attachments";
import { useChatStore } from "./chatStore";

interface UseChatSenderArgs {
  messages: Message[];
  currentSessionId: string | null;
  isLoadingAuth: boolean;
  user: User | null;
  age?: number;
  userRole: UserRole | null;
  justCreatedSessionRef: React.MutableRefObject<boolean>;
}

export function useChatSender({
  messages,
  currentSessionId,
  isLoadingAuth,
  user,
  age,
  userRole,
  justCreatedSessionRef,
}: UseChatSenderArgs) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const userProfile = useAppSelector((state) => state.auth.userProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [requestType] = useState<"pdf" | "docx" | "image" | "regular">("regular");
  const [loadingText, setLoadingText] = useState("Thinking...");

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const steps = {
      pdf: [
        "Analyzing your PDF request...",
        "Gathering the best learning info...",
        "Organizing PDF page layouts...",
        "Creating beautiful PDF sections...",
      ],
      docx: [
        "Analyzing your document request...",
        "Researching educational details...",
        "Organizing headings & content structure...",
        "Writing the Word Document content...",
      ],
      image: [
        "Reading your creative request...",
        "Setting up the drawing canvas...",
        "Drawing the outlines & shapes...",
        "Adding colorful details & textures...",
      ],
      regular: ["Thinking...", "Almost ready..."],
    }[requestType];

    let index = 0;

    const interval = setInterval(() => {
      if (index < steps.length - 1) {
        index++;
        setLoadingText(steps[index]);
      } else {
        clearInterval(interval);
      }
    }, 4000);

    return () => {
      clearInterval(interval);
      setLoadingText("Thinking...");
    };
  }, [isLoading, requestType]);

  const pendingSendRef = useRef(false);

  const pendingInputRef = useRef<string>("");
  const pendingImageRef = useRef<string | null>(null);
  const pendingFileContentRef = useRef<string | null>(null);
  const pendingFileNameRef = useRef<string | null>(null);
  const pendingVoiceInputRef = useRef<boolean | undefined>(false);
  const pendingRawFileRef = useRef<File | null>(null);

  const sendMessage = useCallback(
    async (
      currentInput: string,
      currentImage: string | null,
      currentFileContent: string | null,
      currentFileName: string | null,
      isVoiceInput?: boolean,
      attachedFile?: File | null,
      isResume?: boolean
    ) => {
      if (isLoading) return;
      if (isLoadingAuth) {
        pendingSendRef.current = true;
        pendingInputRef.current = currentInput;
        pendingImageRef.current = currentImage;
        pendingFileContentRef.current = currentFileContent;
        pendingFileNameRef.current = currentFileName;
        pendingVoiceInputRef.current = isVoiceInput;
        pendingRawFileRef.current = attachedFile || null;
        return;
      }

      let sessionId = currentSessionId;
      const canPersist = !!user?.id;
      let lastUserMsg: Message | undefined = undefined;

      if (isResume) {
        if (messages.length === 0) return;
        lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
        if (!lastUserMsg) return;

        currentInput = lastUserMsg.content;
        currentImage = lastUserMsg.uploadedImage || null;
        currentFileContent = null;
        currentFileName = lastUserMsg.fileName || null;
      } else {
        if (!currentInput.trim() && !currentImage && !currentFileContent && !currentFileName) {
          return;
        }
      }

      // Combine input with file content if present
      const finalInputForAI = currentFileContent
        ? `${currentInput}\n\n[Attachment: ${currentFileName}]\n${currentFileContent}`
        : currentInput;

      const savedContent = currentFileName
        ? `[File: ${currentFileName}] ${currentInput}`
        : currentInput;

      setIsLoading(true);
      setIsGenerating(true);

      const userMessageId = isResume && lastUserMsg ? lastUserMsg.id : crypto.randomUUID();

      const userMessage: Message = {
        id: userMessageId,
        userId: user?.id || undefined,
        senderProfile: userProfile || undefined,
        role: "user",
        content: currentInput,
        uploadedImage: currentImage || undefined,
        attachmentUrl: undefined,
        fileName: currentFileName || undefined,
        isVoiceInput: isResume && lastUserMsg ? lastUserMsg.isVoiceInput : isVoiceInput,
        // Task 5.2: Set initial status to "pending" for user message
        status: "pending",
      };

      if (!isResume) {
        dispatch(addMessage(userMessage));

        // Task 5.2: Mark user message as "completed" immediately after adding
        // (since user messages don't stream, they're complete as soon as they're added)
        dispatch(
          updateMessage({
            id: userMessageId,
            status: "completed",
          })
        );
      }

      let userAttachmentUrl: string | undefined = undefined;

      // 1. Upload user attachment if exists (Images, PDFs, or Text files)
      if (!isResume && canPersist && (currentImage || attachedFile || currentFileContent)) {
        try {
          const supabaseClient = createClient();
          if (currentImage) {
            const res = await fetch(currentImage);
            const blob = await res.blob();
            if (!user?.id) throw new Error("Missing user id for image upload");
            const path = getUniqueStoragePath(user.id, sessionId || "new", "jpg", "image");
            const uploadResult = await uploadChatAttachment(supabaseClient, user.id, blob, path);
            if (!uploadResult.success || !uploadResult.publicUrl) {
              throw new Error(uploadResult.error || "Failed to upload image.");
            }
            userAttachmentUrl = uploadResult.publicUrl;
          } else if (attachedFile) {
            if (!user?.id) throw new Error("Missing user id for document upload");
            const fileExtension = attachedFile.name.split(".").pop() || "bin";
            const typePrefix = attachedFile.type.includes("pdf") ? "pdf" : "doc";
            const path = getUniqueStoragePath(
              user.id,
              sessionId || "new",
              fileExtension,
              typePrefix
            );
            const uploadResult = await uploadChatAttachment(
              supabaseClient,
              user.id,
              attachedFile,
              path
            );
            if (!uploadResult.success || !uploadResult.publicUrl) {
              throw new Error(uploadResult.error || "Failed to upload document.");
            }
            userAttachmentUrl = uploadResult.publicUrl;
          } else if (currentFileContent) {
            // Fallback for when raw attachedFile is not available but parsed text content is
            const blob = new Blob([currentFileContent], { type: "text/plain" });
            if (!user?.id) throw new Error("Missing user id for document upload");
            const path = getUniqueStoragePath(user.id, sessionId || "new", "txt", "doc");
            const uploadResult = await uploadChatAttachment(supabaseClient, user.id, blob, path);
            if (!uploadResult.success || !uploadResult.publicUrl) {
              throw new Error(uploadResult.error || "Failed to upload document.");
            }
            userAttachmentUrl = uploadResult.publicUrl;
          }

          if (userAttachmentUrl) {
            dispatch(
              updateMessage({
                id: userMessageId,
                attachmentUrl: userAttachmentUrl,
              })
            );
          }
        } catch (e) {
          console.error("User upload failed:", e);
        }
      } else if (isResume && lastUserMsg) {
        userAttachmentUrl = lastUserMsg.attachmentUrl || undefined;
      }

      // Prepare history for API including image context persistence
      // If we are resuming, slice out the last message (which is the current user prompt)
      const historySource = isResume ? messages.slice(0, -1) : messages;
      const chatHistory = historySource.slice(-20).map((m) => ({
        role: m.role === "user" ? "user" : "model",
        content: m.content,
        image: m.role === "user" ? m.uploadedImage : undefined,
        // Persist the AI-generated image URL so the backend can inject it back into context
        generatedImage: m.role === "model" && m.isImage ? m.content : undefined,
      }));

      // 2. Create session and save user message if it doesn't exist
      if (!isResume && !sessionId && canPersist) {
        try {
          const tempSessionId = crypto.randomUUID();
          sessionId = tempSessionId;

          const sessionTitle = currentInput;

          const newSession: ChatSessionRow = {
            id: tempSessionId,
            user_id: user?.id || "",
            title: sessionTitle,
            session_type: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true,
            deleted_at: null,
          };

          justCreatedSessionRef.current = true;
          dispatch(addSession(newSession));
          dispatch(setCurrentSessionId(sessionId));

          const targetUrl =
            typeof window !== "undefined" && window.location.pathname.startsWith("/chat/")
              ? `${window.location.pathname}?id=${sessionId}`
              : `/?id=${sessionId}`;
          router.replace(targetUrl);

          // Perform DB writes in the background to avoid blocking AI generation
          const userTokens = Math.round(currentInput.length / 4);
          (async () => {
            try {
              await createChatSession(sessionTitle, user?.id, tempSessionId);
              await Promise.all([
                saveChatMessage(
                  tempSessionId,
                  "user",
                  savedContent,
                  {
                    tokens: userTokens,
                    attachmentUrl: userAttachmentUrl,
                  },
                  user?.id
                ),
                trackDailyUsage(userTokens, {}, user?.id),
              ]);
            } catch (dbErr) {
              console.error("Failed to save new session/message to database in background:", dbErr);
            }
          })();
        } catch (error) {
          console.error("Failed to initialize session/message:", error);
        }
      } else if (!isResume && sessionId && canPersist) {
        const userTokens = Math.round(currentInput.length / 4);
        // Save user message and track usage in the background to avoid blocking generation
        Promise.all([
          saveChatMessage(
            sessionId,
            "user",
            savedContent,
            {
              tokens: userTokens,
              attachmentUrl: userAttachmentUrl,
            },
            user?.id
          ),
          trackDailyUsage(userTokens, {}, user?.id),
        ]).catch((dbErr) => {
          console.error("Failed to save user message or track usage in background:", dbErr);
        });
      }

      setIsLoading(true);
      setIsGenerating(true);

      // Reuse the existing model message ID if resuming or retrying, otherwise generate a new one
      let aiMessageId = crypto.randomUUID();
      if (isResume && messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === "model") {
          aiMessageId = lastMsg.id;
        }
      }

      useChatStore.getState().setActiveMessageId(aiMessageId);

      const sessionManager = getSessionManager();
      const requestId = crypto.randomUUID();
      const signal = sessionManager.registerRequest(requestId);

      try {
        const bodyPayload = {
          message: finalInputForAI,
          image: currentImage,
          history: chatHistory,
          role: userRole || "kid",
          age: age,
          sessionId: sessionId || undefined,
          aiMessageId: aiMessageId,
        };

        const apiStartTime = Date.now();
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
          signal,
        });

        const isStream = res.headers.get("content-type")?.includes("text/event-stream");

        if (isStream && res.body) {
          // 2. Dispatch initial empty message to UI immediately!
          // Task 5.2: Bot message starts with "pending" status
          const initialAiMessage: Message = {
            id: aiMessageId,
            role: "model",
            content: "",
            status: "pending",
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
            if (!signal.aborted) {
              flushStreamUpdate(); // Final flush to guarantee latest text state is synced to Redux
            }
            reader.releaseLock();
          }

          if (signal.aborted) {
            return;
          }

          const responseTime = Date.now() - apiStartTime;

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
            pdfTheme: data?.isPdfRequest ? data.pdfTheme : undefined,
            isDocRequest: data?.isDocRequest,
            docContent: data?.isDocRequest ? data.docContent : undefined,
            docTheme: data?.isDocRequest ? data.docTheme : undefined,
            suggestedTitle: data?.suggestedTitle,
            token_used: tokens,
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

                // Asynchronously compile and upload Word documents (.docx) in the background
                if (data.isDocRequest && data.docContent) {
                  (async () => {
                    try {
                      const docxBlob = await generateDocxBlob(data.docContent);
                      if (!user?.id) throw new Error("Missing user id for Word upload");
                      const storageFileName = getUniqueStoragePath(
                        user.id,
                        sessionId,
                        "docx",
                        "doc"
                      );
                      const docxAttachmentUrl = await uploadFileToStorage(
                        docxBlob,
                        storageFileName,
                        user.id
                      );

                      // Update Redux state and cache with the permanent Word URL
                      dispatch(
                        updateMessage({
                          id: aiMessageId,
                          content: finalContent,
                          attachmentUrl: docxAttachmentUrl,
                        })
                      );

                      // Update DB with the permanent Word URL
                      await updateChatMessageAttachment(aiMessageId, docxAttachmentUrl);

                      // Save to generated materials table
                      await saveGeneratedMaterial(
                        sessionId,
                        "doc",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        docxAttachmentUrl,
                        { prompt: currentInput },
                        user?.id
                      );

                      // Track daily usage for Word Document (increment pdfs_generated metric too)
                      await trackDailyUsage(
                        tokens,
                        { isPdf: true, durationMs: responseTime },
                        user?.id
                      );
                    } catch (docxUploadErr) {
                      console.error(
                        "[ChatInterface] Background Word upload failed:",
                        docxUploadErr
                      );
                    }
                  })();
                }

                // Track non-image/non-pdf/non-doc usage
                if (!isImageResponse && !data.isPdfRequest && !data.isDocRequest) {
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
        setIsGenerating(false);
        useChatStore.getState().setActiveMessageId(null);
      }
    },
    [
      isLoading,
      isLoadingAuth,
      currentSessionId,
      user,
      age,
      userRole,
      userProfile,
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
        pendingFileNameRef.current,
        pendingVoiceInputRef.current,
        pendingRawFileRef.current || undefined
      );
      // Clear values after trigger
      pendingInputRef.current = "";
      pendingImageRef.current = null;
      pendingFileContentRef.current = null;
      pendingFileNameRef.current = null;
      pendingVoiceInputRef.current = false;
      pendingRawFileRef.current = null;
    }, 0);
    return () => clearTimeout(timer);
  }, [isLoadingAuth, sendMessage]);

  const stopGenerating = useCallback(() => {
    const sessionManager = getSessionManager();
    sessionManager.abortActiveRequest();

    let activeMsgId = useChatStore.getState().activeMessageId;
    if (!activeMsgId) {
      const lastMsg = messagesRef.current[messagesRef.current.length - 1];
      if (
        lastMsg &&
        lastMsg.role === "model" &&
        (lastMsg.status === "streaming" || !lastMsg.status)
      ) {
        activeMsgId = lastMsg.id;
      }
    }

    if (activeMsgId) {
      void fetch("/api/chat/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: activeMsgId, sessionId: currentSessionId }),
      }).catch((e) => console.error("Failed to stop server-side generation:", e));

      // Retrieve the current message content for the active AI message and append termination note
      const currentMsg = messagesRef.current.find((m) => m.id === activeMsgId);
      const text = currentMsg?.content || "";
      const hasTerminationMsg =
        text.includes("Session has been terminated") || text.includes("terminated");

      const stopText = hasTerminationMsg
        ? text
        : text.trim()
          ? `${text}\n\n*(Session has been terminated.)*`
          : "Session has been terminated.";

      if (currentMsg) {
        dispatch(
          updateMessage({
            id: activeMsgId,
            content: stopText,
            status: "failed",
          })
        );
      } else {
        dispatch(
          addMessage({
            id: activeMsgId,
            role: "model",
            content: stopText,
            status: "failed",
          })
        );
      }
    }

    setIsLoading(false);
    setIsGenerating(false);
  }, [dispatch, currentSessionId]);

  return { isLoading, isGenerating, loadingText, sendMessage, stopGenerating };
}
