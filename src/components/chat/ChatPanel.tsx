"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { VersionHistory } from "./VersionHistory";
import { useChatStore } from "@/lib/stores/chat-store";
import { useEditorStore } from "@/lib/stores/editor-store";
import { useUpdateCardStore } from "@/lib/stores/update-card-store";
import { MessageParser } from "@/lib/parser/message-parser";
import type { ChatMessage } from "@/types/chat";
import type { UpdateCard } from "@/types/update-card";
import type { UploadedImage } from "./ChatInput";
import { buildSmartContext } from "@/lib/llm/context-builder";
import { summarizeConversation } from "@/lib/llm/conversation-summarizer";
import { v4 as uuid } from "uuid";

/** Extract file actions from a completed message and push to the editor */
function extractAndOpenFiles(content: string) {
  const files: Record<string, string> = {};
  let firstFilePath: string | null = null;

  const parser = new MessageParser({
    onActionClose: (_artifactId, action) => {
      if (action.type === "file" && action.filePath && action.content) {
        files[action.filePath] = action.content;
        if (!firstFilePath) firstFilePath = action.filePath;
      } else if (action.type === "search-replace" && action.filePath && action.searchBlock) {
        // Apply search-replace to existing files
        const store = useEditorStore.getState();
        const existing = store.generatedFiles[action.filePath];
        if (existing && existing.includes(action.searchBlock)) {
          files[action.filePath] = existing.replace(action.searchBlock, action.replaceBlock);
          if (!firstFilePath) firstFilePath = action.filePath;
        }
      }
    },
  });

  parser.push(content);
  parser.end();

  if (Object.keys(files).length > 0) {
    const store = useEditorStore.getState();
    store.addGeneratedFiles(files);
    // Auto-open the first file
    if (firstFilePath) {
      store.openFile(firstFilePath, files[firstFilePath]);
    }
  }
}

interface ChatPanelProps {
  chatId: string;
  projectId: string;
  initialMessages?: ChatMessage[];
}

export function ChatPanel({ chatId, projectId, initialMessages = [] }: ChatPanelProps) {
  const { data: session } = useSession();
  const {
    messages,
    isStreaming,
    selectedModel,
    setMessages,
    addMessage,
    setIsStreaming,
    setSelectedModel,
  } = useChatStore();
  const [streamingContent, setStreamingContent] = useState("");
  const [resolvedPlans, setResolvedPlans] = useState<Record<string, "approved" | "rejected">>({});
  const [liveCard, setLiveCard] = useState<UpdateCard | undefined>(undefined);
  const [usageRefreshKey, setUsageRefreshKey] = useState(0);
  const streamingParserRef = useRef<MessageParser | null>(null);
  const subtaskCounterRef = useRef(0);
  const activeGenerationIdRef = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const fullContentRef = useRef("");

  // Initialize messages from props
  if (messages.length === 0 && initialMessages.length > 0) {
    setMessages(initialMessages);
  }

  // ── SSE Connection Helper ──────────────────────────────────────────

  const connectToGeneration = useCallback(
    (
      generationId: string,
      fromChunk: number,
      options?: {
        previousFiles?: Record<string, string>;
        currentCardRef?: { current: UpdateCard | null };
        streamingParser?: MessageParser;
      }
    ) => {
      // Close any existing connection
      eventSourceRef.current?.close();

      activeGenerationIdRef.current = generationId;
      const updateCardStore = useUpdateCardStore.getState();

      // Create a streaming parser if not provided (reconnect case)
      const parser =
        options?.streamingParser ??
        createStreamingParser(
          options?.previousFiles ?? { ...useEditorStore.getState().generatedFiles },
          options?.currentCardRef ?? { current: null },
          updateCardStore,
          subtaskCounterRef,
          setLiveCard
        );
      streamingParserRef.current = parser;

      const es = new EventSource(
        `/api/generations/${generationId}/stream?from=${fromChunk}`
      );
      eventSourceRef.current = es;

      es.addEventListener("chunk", (e) => {
        const { text } = JSON.parse(e.data);
        fullContentRef.current += text;
        setStreamingContent(fullContentRef.current);
        parser.push(text);
      });

      es.addEventListener("catchup", (e) => {
        const { content, status } = JSON.parse(e.data);
        fullContentRef.current = content;
        setStreamingContent(content);
        // Re-parse entire content for file extraction
        extractAndOpenFiles(content);
        if (status !== "streaming") {
          finalize(content);
          es.close();
        }
      });

      es.addEventListener("done", () => {
        es.close();
        finalize(fullContentRef.current);
      });

      es.addEventListener("error", () => {
        es.close();
        finalize(fullContentRef.current);
      });

      function finalize(content: string) {
        eventSourceRef.current = null;
        activeGenerationIdRef.current = null;

        parser.end();

        if (content.trim()) {
          const assistantMessage: ChatMessage = {
            id: uuid(),
            chatId,
            role: "assistant",
            content,
            createdAt: new Date(),
          };
          addMessage(assistantMessage);

          // Safety-net file extraction
          extractAndOpenFiles(content);
        }

        setIsStreaming(false);
        setStreamingContent("");
        setLiveCard(undefined);
        streamingParserRef.current = null;
        updateCardStore.stopThinking();
        updateCardStore.setCurrentStreamingFile(null);
        updateCardStore.endSession();
        setUsageRefreshKey((k) => k + 1);
      }
    },
    [chatId, addMessage, setIsStreaming]
  );

  // ── Reconnect on page load ─────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/generations/active?chatId=${chatId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;

        if (data.generationId && data.status === "streaming") {
          // Active generation found — reconnect
          setIsStreaming(true);
          fullContentRef.current = "";
          const updateCardStore = useUpdateCardStore.getState();
          updateCardStore.startSession();
          updateCardStore.startThinking();
          connectToGeneration(data.generationId, 0);
        } else if (data.partialContent) {
          // Server restarted — show partial content as message
          const msg: ChatMessage = {
            id: uuid(),
            chatId,
            role: "assistant",
            content: data.partialContent,
            createdAt: new Date(),
          };
          addMessage(msg);
          extractAndOpenFiles(data.partialContent);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [chatId, connectToGeneration, setIsStreaming, addMessage]);

  // ── handleSend ─────────────────────────────────────────────────────

  const handleSend = useCallback(
    async (content: string, images?: UploadedImage[]) => {
      // Build content with image references if any
      let messageContent = content;
      if (images && images.length > 0) {
        const imageRefs = images.map((img) => `[Uploaded image: ${img.url}]`).join("\n");
        messageContent = `${content}\n\n${imageRefs}`;
      }

      const userMessage: ChatMessage = {
        id: uuid(),
        chatId,
        role: "user",
        content: messageContent,
        createdAt: new Date(),
      };

      addMessage(userMessage);
      setIsStreaming(true);
      setStreamingContent("");
      setLiveCard(undefined);
      fullContentRef.current = "";

      const updateCardStore = useUpdateCardStore.getState();
      updateCardStore.startSession();
      updateCardStore.startThinking();
      updateCardStore.setCurrentStreamingFile(null);
      subtaskCounterRef.current = 0;

      // Capture previous files for revert
      const previousFiles = { ...useEditorStore.getState().generatedFiles };

      // Current live card being built during streaming
      const currentCardRef: { current: UpdateCard | null } = { current: null };

      // Create streaming parser for real-time updates
      const streamingParser = createStreamingParser(
        previousFiles,
        currentCardRef,
        updateCardStore,
        subtaskCounterRef,
        setLiveCard
      );
      streamingParserRef.current = streamingParser;

      try {
        const allMessages = [...messages, userMessage];

        // Build smart project context from generated files so the AI can see them
        const editorState = useEditorStore.getState();
        let projectContext: string | undefined;
        if (Object.keys(editorState.generatedFiles).length > 0) {
          projectContext = buildSmartContext(
            editorState.generatedFiles,
            content,
            editorState.activeFilePath
          );
        }

        // Summarize conversation if it's getting long
        const condensedMessages = summarizeConversation(
          allMessages.map((m) => ({ role: m.role, content: m.content }))
        );

        // Build messages, adding image blocks to the last message if images were uploaded
        const apiMessages = condensedMessages.map((m, i) => {
          // Attach images to the last message (the user message we just added)
          if (i === condensedMessages.length - 1 && m.role === "user" && images && images.length > 0) {
            const contentBlocks: Array<{ type: string; text?: string; image?: { url: string } }> = [
              { type: "text", text: typeof m.content === "string" ? m.content : content },
            ];
            for (const img of images) {
              contentBlocks.push({
                type: "image",
                image: { url: `${typeof window !== "undefined" ? window.location.origin : ""}${img.url}` },
              });
            }
            return { role: m.role, content: contentBlocks };
          }
          return { role: m.role, content: m.content };
        });

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            chatId,
            projectId,
            modelId: selectedModel.id,
            provider: selectedModel.provider,
            projectContext,
          }),
        });

        if (response.status === 429) {
          const data = await response.json();
          toast.error(
            `Daily message limit reached (${data.used}/${data.limit}). Try again later.`
          );
          setUsageRefreshKey((k) => k + 1);
          setIsStreaming(false);
          updateCardStore.endSession();
          return;
        }
        if (!response.ok) throw new Error("Chat request failed");

        const { generationId } = await response.json();

        // Connect to SSE stream
        connectToGeneration(generationId, 0, {
          previousFiles,
          currentCardRef,
          streamingParser,
        });
      } catch (err) {
        console.error("Chat error:", err);
        toast.error("Failed to get response. Please try again.");
        setIsStreaming(false);
        setStreamingContent("");
        setLiveCard(undefined);
        streamingParserRef.current = null;
        updateCardStore.stopThinking();
        updateCardStore.setCurrentStreamingFile(null);
        updateCardStore.endSession();
        setUsageRefreshKey((k) => k + 1);
      }
    },
    [chatId, projectId, messages, selectedModel, addMessage, setIsStreaming, connectToGeneration]
  );

  // ── Stop / Cancel ──────────────────────────────────────────────────

  const handleStop = useCallback(() => {
    const genId = activeGenerationIdRef.current;
    if (genId) {
      fetch(`/api/generations/${genId}/cancel`, { method: "POST" }).catch(() => {});
    }
    // Also close the SSE connection immediately for responsive UI
    eventSourceRef.current?.close();
  }, []);

  const handlePlanApprove = useCallback(
    (planTitle: string) => {
      setResolvedPlans((prev) => ({ ...prev, [planTitle]: "approved" }));
      handleSend("Plan approved. Proceed with the implementation.");
    },
    [handleSend]
  );

  const handlePlanReject = useCallback(
    (planTitle: string) => {
      setResolvedPlans((prev) => ({ ...prev, [planTitle]: "rejected" }));
      handleSend("Plan rejected. Please suggest a different approach.");
    },
    [handleSend]
  );

  // Listen for initial prompt dispatched from dashboard redirect
  useEffect(() => {
    const handler = (e: Event) => {
      const prompt = (e as CustomEvent<{ prompt: string }>).detail?.prompt;
      if (prompt) {
        handleSend(prompt);
      }
    };
    window.addEventListener("appmake:initial-prompt", handler);
    return () => window.removeEventListener("appmake:initial-prompt", handler);
  }, [handleSend]);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
        userName={session?.user?.name ?? undefined}
        userImage={session?.user?.image ?? undefined}
        onPlanApprove={handlePlanApprove}
        onPlanReject={handlePlanReject}
        resolvedPlans={resolvedPlans}
        onSendMessage={handleSend}
        liveCard={liveCard}
      />
      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        isStreaming={isStreaming}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        usageRefreshKey={usageRefreshKey}
      />
      <VersionHistory chatId={chatId} />
    </div>
  );
}

// ─── Helper: Create Streaming Parser ─────────────────────────────────

function createStreamingParser(
  previousFiles: Record<string, string>,
  currentCardRef: { current: UpdateCard | null },
  updateCardStore: ReturnType<typeof useUpdateCardStore.getState>,
  subtaskCounterRef: React.MutableRefObject<number>,
  setLiveCard: (card: UpdateCard | undefined) => void
): MessageParser {
  return new MessageParser({
    onToolActivity: (activity) => {
      if (activity.status === "calling") {
        updateCardStore.setSessionPhase("researching");
        updateCardStore.incrementToolCalls();
      }
    },
    onArtifactOpen: ({ id, title }) => {
      updateCardStore.stopThinking();
      updateCardStore.setSessionPhase("building");
      updateCardStore.openCard(id, title, previousFiles);
      currentCardRef.current = {
        id: `card-${Date.now()}`,
        artifactId: id,
        title,
        subtasks: [],
        status: "streaming",
        previousFiles,
        filesCreated: 0,
        filesModified: 0,
        createdAt: Date.now(),
      };
      setLiveCard({ ...currentCardRef.current });
    },
    onActionOpen: (artifactId, action) => {
      updateCardStore.stopThinking();
      const subtaskId = `subtask-${++subtaskCounterRef.current}`;
      const label =
        action.type === "file"
          ? action.filePath
          : action.type === "search-replace"
          ? action.filePath
          : action.type === "shell" || action.type === "start"
          ? action.command
          : "Unknown";
      const subtask = {
        id: subtaskId,
        label,
        type: action.type,
        filePath: (action.type === "file" || action.type === "search-replace") ? action.filePath : undefined,
        status: "streaming" as const,
      };
      updateCardStore.addSubtask(artifactId, subtask);

      if (action.type === "file") {
        updateCardStore.setCurrentStreamingFile(action.filePath);
      }

      if (currentCardRef.current) {
        currentCardRef.current.subtasks = [...currentCardRef.current.subtasks, subtask];
        setLiveCard({ ...currentCardRef.current });
      }
    },
    onActionClose: (artifactId, action) => {
      const subtaskId = `subtask-${subtaskCounterRef.current}`;
      updateCardStore.completeSubtask(artifactId, subtaskId);
      updateCardStore.setCurrentStreamingFile(null);

      // Real-time file addition / search-replace
      if (action.type === "search-replace" && action.filePath && action.searchBlock) {
        const editorStore = useEditorStore.getState();
        const existingContent = editorStore.generatedFiles[action.filePath];
        if (existingContent && existingContent.includes(action.searchBlock)) {
          const newContent = existingContent.replace(action.searchBlock, action.replaceBlock);
          editorStore.addGeneratedFile(action.filePath, newContent);
          updateCardStore.incrementFileStat(artifactId, "modified");
          if (currentCardRef.current) {
            currentCardRef.current.subtasks = currentCardRef.current.subtasks.map((s) =>
              s.id === subtaskId ? { ...s, status: "completed" as const } : s
            );
            currentCardRef.current.filesModified++;
            setLiveCard({ ...currentCardRef.current });
          }
        } else {
          console.warn("[search-replace] Search block not found in", action.filePath);
        }
      } else if (action.type === "file" && action.filePath && action.content) {
        const editorStore = useEditorStore.getState();
        const isNew = !previousFiles[action.filePath];
        editorStore.addGeneratedFile(action.filePath, action.content);
        updateCardStore.incrementFileStat(artifactId, isNew ? "created" : "modified");

        if (currentCardRef.current) {
          currentCardRef.current.subtasks = currentCardRef.current.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, status: "completed" as const } : s
          );
          if (isNew) currentCardRef.current.filesCreated++;
          else currentCardRef.current.filesModified++;
          setLiveCard({ ...currentCardRef.current });
        }
      } else if (currentCardRef.current) {
        currentCardRef.current.subtasks = currentCardRef.current.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, status: "completed" as const } : s
        );
        setLiveCard({ ...currentCardRef.current });
      }
    },
    onArtifactClose: (artifactId) => {
      updateCardStore.closeCard(artifactId);
      if (currentCardRef.current) {
        currentCardRef.current.status = "completed";
        setLiveCard({ ...currentCardRef.current });
      }
    },
  });
}
