/**
 * Shared test utilities with factory functions for creating mock data.
 * Uses randomUUID for IDs and provides realistic default values.
 */

import { randomUUID } from "crypto";

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  files: Record<string, string>;
  framework: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  createdAt: Date;
}

export interface Chat {
  id: string;
  title: string;
  userId: string;
  projectId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a mock user with realistic defaults.
 */
export function createMockUser(overrides?: Partial<User>): User {
  const now = new Date();
  return {
    id: randomUUID(),
    name: "Test User",
    email: "testuser@example.com",
    image: "https://avatars.example.com/default.png",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a mock project with realistic defaults.
 */
export function createMockProject(overrides?: Partial<Project>): Project {
  const now = new Date();
  return {
    id: randomUUID(),
    name: "My App",
    description: "A sample React application",
    userId: randomUUID(),
    files: {
      "App.tsx": `export default function App() {\n  return <div>Hello World</div>;\n}`,
      "index.css": `body { margin: 0; font-family: sans-serif; }`,
    },
    framework: "react",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a mock chat message with realistic defaults.
 */
export function createMockMessage(
  overrides?: Partial<ChatMessage>
): ChatMessage {
  return {
    id: randomUUID(),
    chatId: randomUUID(),
    role: "user",
    content: "Build me a todo app with React and Tailwind CSS",
    model: undefined,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock chat with realistic defaults.
 */
export function createMockChat(overrides?: Partial<Chat>): Chat {
  const chatId = overrides?.id ?? randomUUID();
  const userId = overrides?.userId ?? randomUUID();
  const projectId = overrides?.projectId ?? randomUUID();
  const now = new Date();

  const defaultMessages: ChatMessage[] = [
    createMockMessage({
      chatId,
      role: "user",
      content: "Create a landing page",
    }),
    createMockMessage({
      chatId,
      role: "assistant",
      content:
        "I'll create a landing page for you with a hero section, features, and a footer.",
      model: "claude-sonnet-4-20250514",
    }),
  ];

  return {
    id: chatId,
    title: "New Chat",
    userId,
    projectId,
    messages: defaultMessages,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
