import { create } from "zustand";
import type { ChatMessage, ModelOption } from "@/types/chat";
import { AVAILABLE_MODELS } from "@/types/chat";

interface ChatStore {
  messages: ChatMessage[];
  isStreaming: boolean;
  selectedModel: ModelOption;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (content: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  setSelectedModel: (model: ModelOption) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isStreaming: false,
  selectedModel: AVAILABLE_MODELS[0],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content,
        };
      }
      return { messages };
    }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  clearMessages: () => set({ messages: [] }),
}));
