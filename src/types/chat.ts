export interface ChatMessage {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface Chat {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ModelProvider = "openai" | "anthropic";

export interface ModelOption {
  id: string;
  name: string;
  provider: ModelProvider;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  // GPT-5.2 family (latest — Dec 2025)
  { id: "gpt-5.2", name: "GPT-5.2 Thinking", provider: "openai" },
  { id: "gpt-5.2-chat-latest", name: "GPT-5.2 Instant", provider: "openai" },
  { id: "gpt-5.2-codex", name: "GPT-5.2 Codex", provider: "openai" },

  // GPT-4.1 family
  { id: "gpt-4.1", name: "GPT-4.1", provider: "openai" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "openai" },

  // Reasoning models
  { id: "o3-mini", name: "o3 Mini", provider: "openai" },
  { id: "o4-mini", name: "o4 Mini", provider: "openai" },

  // Legacy
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" },

  // Anthropic
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "anthropic" },
  { id: "claude-opus-4-20250514", name: "Claude Opus 4", provider: "anthropic" },
];
