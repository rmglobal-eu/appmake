"use client";

import { useCallback, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { VersionHistory } from "./VersionHistory";
import { useChatStore } from "@/lib/stores/chat-store";
import { useEditorStore } from "@/lib/stores/editor-store";
import { useUpdateCardStore } from "@/lib/stores/update-card-store";
import { usePreviewErrorStore } from "@/lib/stores/preview-error-store";
import { useGhostFix } from "@/hooks/useGhostFix";
import { MessageParser } from "@/lib/parser/message-parser";
import type { ChatMessage } from "@/types/chat";
import type { UpdateCard } from "@/types/update-card";
import { useBuilderStore } from "@/lib/stores/builder-store";
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
  initialMessages?: ChatMessage[];
}

export function ChatPanel({ chatId, initialMessages = [] }: ChatPanelProps) {
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
  const abortRef = useRef<AbortController | null>(null);
  const { planMode } = useBuilderStore();
  const streamingParserRef = useRef<MessageParser | null>(null);
  const subtaskCounterRef = useRef(0);

  // Silent ghost-fix for preview errors (replaces old auto-fix)
  useGhostFix();

  // Initialize messages from props
  if (messages.length === 0 && initialMessages.length > 0) {
    setMessages(initialMessages);
  }

  const handleSend = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: uuid(),
        chatId,
        role: "user",
        content,
        createdAt: new Date(),
      };

      addMessage(userMessage);
      setIsStreaming(true);
      setStreamingContent("");
      setLiveCard(undefined);

      const updateCardStore = useUpdateCardStore.getState();
      updateCardStore.startThinking();
      updateCardStore.setCurrentStreamingFile(null);
      subtaskCounterRef.current = 0;

      // Capture previous files for revert
      const previousFiles = { ...useEditorStore.getState().generatedFiles };

      // Clear previous errors and reset ghost fix
      usePreviewErrorStore.getState().clearErrors();
      usePreviewErrorStore.getState().resetGhostFixAttempts();

      const abortController = new AbortController();
      abortRef.current = abortController;

      // Current live card being built during streaming
      const currentCardRef: { current: UpdateCard | null } = { current: null };

      // Create streaming parser for real-time updates
      const streamingParser = new MessageParser({
        onArtifactOpen: ({ id, title }) => {
          updateCardStore.stopThinking();
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
              : action.type === "shell" || action.type === "start"
              ? action.command
              : "Unknown";
          const subtask = {
            id: subtaskId,
            label,
            type: action.type,
            filePath: action.type === "file" ? action.filePath : undefined,
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

          // Real-time file addition
          if (action.type === "file" && action.filePath && action.content) {
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

      streamingParserRef.current = streamingParser;

      try {
        const allMessages = [...messages, userMessage];
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: allMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            chatId,
            modelId: selectedModel.id,
            provider: selectedModel.provider,
            planMode,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) throw new Error("Chat request failed");
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setStreamingContent(fullContent);

          // Feed only the new chunk to the streaming parser
          streamingParser.push(chunk);
        }

        streamingParser.end();

        // Add completed message
        const assistantMessage: ChatMessage = {
          id: uuid(),
          chatId,
          role: "assistant",
          content: fullContent,
          createdAt: new Date(),
        };
        addMessage(assistantMessage);

        // Extract file actions and push to editor (safety net)
        extractAndOpenFiles(fullContent);

        // Save snapshot
        const currentFiles = useEditorStore.getState().generatedFiles;
        if (Object.keys(currentFiles).length > 0) {
          fetch("/api/snapshots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chatId,
              title: currentCardRef.current?.title ?? "AI Update",
              files: currentFiles,
              messageId: assistantMessage.id,
              artifactId: currentCardRef.current?.artifactId,
            }),
          }).catch(() => {}); // Best-effort
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Chat error:", err);
          toast.error("Failed to get response. Please try again.");
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        setLiveCard(undefined);
        abortRef.current = null;
        streamingParserRef.current = null;
        updateCardStore.stopThinking();
        updateCardStore.setCurrentStreamingFile(null);
      }
    },
    [chatId, messages, selectedModel, planMode, addMessage, setIsStreaming]
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
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
      />
      <VersionHistory chatId={chatId} />
    </div>
  );
}
