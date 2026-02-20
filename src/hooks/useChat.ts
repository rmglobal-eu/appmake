"use client";

import { useCallback, useRef, useState } from "react";
import { useChatStore } from "@/lib/stores/chat-store";
import type { ChatMessage } from "@/types/chat";
import { v4 as uuid } from "uuid";

export function useChat(chatId: string) {
  const {
    messages,
    isStreaming,
    selectedModel,
    addMessage,
    setIsStreaming,
  } = useChatStore();
  const [streamingContent, setStreamingContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
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

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            chatId,
            modelId: selectedModel.id,
            provider: selectedModel.provider,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) throw new Error("Chat failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          setStreamingContent(full);
        }

        addMessage({
          id: uuid(),
          chatId,
          role: "assistant",
          content: full,
          createdAt: new Date(),
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Chat error:", err);
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        abortRef.current = null;
      }
    },
    [chatId, messages, selectedModel, addMessage, setIsStreaming]
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    messages,
    isStreaming,
    streamingContent,
    sendMessage,
    stopGeneration,
  };
}
