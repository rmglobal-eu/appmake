import { db } from "@/lib/db";
import {
  generations,
  messages as messagesTable,
  chats,
  projectFiles,
  fileSnapshots,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { streamChat } from "@/lib/llm/stream-chat";
import { logUsage } from "@/lib/llm/cost-tracker";
import { MessageParser } from "@/lib/parser/message-parser";
import type { ModelProvider } from "@/types/chat";
import type { ModelMessage } from "ai";
import type { DesignScheme } from "@/types/design-scheme";

// ─── Types ──────────────────────────────────────────────────────────

interface GenerationState {
  id: string;
  chatId: string;
  userId: string;
  projectId: string;
  status: "streaming" | "completed" | "error" | "cancelled";
  chunks: string[];
  fullContent: string;
  lastDbFlushIndex: number;
  dbFlushTimer: ReturnType<typeof setTimeout> | null;
  abortController: AbortController;
  subscribers: Set<(chunk: string, done: boolean) => void>;
  modelId: string;
  provider: ModelProvider;
  inputMessages: ModelMessage[];
  lastUserMessage: ModelMessage | undefined;
}

interface StartGenerationParams {
  chatId: string;
  userId: string;
  projectId: string;
  messages: ModelMessage[];
  modelId: string;
  provider: ModelProvider;
  projectContext?: string;
  lastUserMessage: ModelMessage | undefined;
  designScheme?: DesignScheme | null;
}

// ─── In-memory store ────────────────────────────────────────────────

const activeGenerations = new Map<string, GenerationState>();

const DB_FLUSH_INTERVAL = 2000; // 2 seconds
const CLEANUP_DELAY = 5 * 60 * 1000; // 5 minutes after completion

// ─── Public API ─────────────────────────────────────────────────────

export async function startGeneration(params: StartGenerationParams): Promise<string> {
  const {
    chatId,
    userId,
    projectId,
    messages,
    modelId,
    provider,
    projectContext,
    lastUserMessage,
    designScheme,
  } = params;

  // 1. Insert DB row
  const [row] = await db
    .insert(generations)
    .values({
      chatId,
      userId,
      projectId,
      status: "streaming",
      content: "",
      modelId,
      provider,
    })
    .returning({ id: generations.id });

  const generationId = row.id;

  // 2. Create in-memory state
  const abortController = new AbortController();
  const state: GenerationState = {
    id: generationId,
    chatId,
    userId,
    projectId,
    status: "streaming",
    chunks: [],
    fullContent: "",
    lastDbFlushIndex: 0,
    dbFlushTimer: null,
    abortController,
    subscribers: new Set(),
    modelId,
    provider,
    inputMessages: messages,
    lastUserMessage,
  };

  activeGenerations.set(generationId, state);

  // 3. Start AI stream in detached async (fire-and-forget)
  runGeneration(state, {
    messages,
    modelId,
    provider,
    projectContext,
    designScheme,
  }).catch((err) => {
    console.error(`[generation-manager] Unhandled error in generation ${generationId}:`, err);
  });

  return generationId;
}

export function subscribe(
  generationId: string,
  fromChunk: number,
  callback: (chunk: string, done: boolean) => void
): (() => void) | null {
  const state = activeGenerations.get(generationId);
  if (!state) return null;

  // Replay chunks from `fromChunk` onwards
  for (let i = fromChunk; i < state.chunks.length; i++) {
    callback(state.chunks[i], false);
  }

  // If already done, send done signal immediately
  if (state.status !== "streaming") {
    callback("", true);
    return () => {};
  }

  // Subscribe to future chunks
  state.subscribers.add(callback);
  return () => {
    state.subscribers.delete(callback);
  };
}

export async function cancelGeneration(generationId: string, userId: string): Promise<boolean> {
  const state = activeGenerations.get(generationId);
  if (!state || state.userId !== userId) return false;

  state.abortController.abort();
  state.status = "cancelled";

  // Flush current content to DB
  await flushToDb(state);
  await db
    .update(generations)
    .set({ status: "cancelled", completedAt: new Date() })
    .where(eq(generations.id, generationId));

  // Save partial assistant message
  const cleanText = state.fullContent.replace(/<tool-activity[^/]*\/>\n?/g, "");
  if (cleanText.trim()) {
    try {
      await db.insert(messagesTable).values({
        chatId: state.chatId,
        role: "assistant",
        content: cleanText,
      });
    } catch {
      // Best-effort
    }
  }

  // Notify subscribers
  for (const sub of state.subscribers) {
    sub("", true);
  }
  state.subscribers.clear();

  scheduleCleanup(generationId);
  return true;
}

export function getGenerationState(generationId: string): GenerationState | null {
  return activeGenerations.get(generationId) ?? null;
}

export function findActiveGeneration(chatId: string, userId: string): GenerationState | null {
  for (const state of activeGenerations.values()) {
    if (state.chatId === chatId && state.userId === userId && state.status === "streaming") {
      return state;
    }
  }
  return null;
}

export async function markStaleGenerationsOnStartup(): Promise<void> {
  try {
    await db
      .update(generations)
      .set({
        status: "error",
        error: "Server genstartet under generation",
        completedAt: new Date(),
      })
      .where(eq(generations.status, "streaming"));
  } catch (err) {
    console.error("[generation-manager] Failed to mark stale generations:", err);
  }
}

// ─── Internal: AI Stream Loop ───────────────────────────────────────

async function runGeneration(
  state: GenerationState,
  opts: {
    messages: ModelMessage[];
    modelId: string;
    provider: ModelProvider;
    projectContext?: string;
    designScheme?: DesignScheme | null;
  }
) {
  try {
    const result = streamChat({
      messages: opts.messages,
      modelId: opts.modelId,
      provider: opts.provider,
      projectContext: opts.projectContext,
      designScheme: opts.designScheme,
      abortSignal: state.abortController.signal,
    });

    for await (const part of result.fullStream) {
      if (state.status !== "streaming") break;

      let chunk = "";
      switch (part.type) {
        case "text-delta": {
          chunk = part.text;
          break;
        }
        case "tool-call": {
          const argsStr = JSON.stringify(part.input);
          chunk = `<tool-activity name="${part.toolName}" status="calling" args="${argsStr.replace(/"/g, "&quot;")}" />\n`;
          break;
        }
        case "tool-result": {
          const resultStr =
            typeof part.output === "string" ? part.output : JSON.stringify(part.output);
          const summary =
            resultStr.length > 200 ? resultStr.slice(0, 200) + "..." : resultStr;
          chunk = `<tool-activity name="${part.toolName}" status="complete" result="${summary.replace(/"/g, "&quot;")}" />\n`;
          break;
        }
        case "tool-error": {
          chunk = `<tool-activity name="${part.toolName}" status="error" result="Tool execution failed" />\n`;
          break;
        }
      }

      if (chunk) {
        state.chunks.push(chunk);
        state.fullContent += chunk;

        // Notify all live subscribers
        for (const sub of state.subscribers) {
          sub(chunk, false);
        }

        // Schedule debounced DB flush
        scheduleDbFlush(state);
      }
    }

    // Stream completed successfully
    if (state.status === "streaming") {
      state.status = "completed";
      await finalizeGeneration(state);
    }
  } catch (err: unknown) {
    if ((err as Error).name === "AbortError" || state.status === "cancelled") {
      // Cancellation — already handled in cancelGeneration()
      return;
    }

    console.error(`[generation-manager] Generation ${state.id} failed:`, err);
    state.status = "error";

    await db
      .update(generations)
      .set({
        status: "error",
        error: (err as Error).message ?? "Unknown error",
        content: state.fullContent,
        completedAt: new Date(),
      })
      .where(eq(generations.id, state.id));
  } finally {
    // Clear flush timer
    if (state.dbFlushTimer) {
      clearTimeout(state.dbFlushTimer);
      state.dbFlushTimer = null;
    }

    // Notify all subscribers that we're done
    for (const sub of state.subscribers) {
      sub("", true);
    }
    state.subscribers.clear();

    scheduleCleanup(state.id);
  }
}

// ─── Internal: Finalize ─────────────────────────────────────────────

async function finalizeGeneration(state: GenerationState) {
  const cleanText = state.fullContent.replace(/<tool-activity[^/]*\/>\n?/g, "");

  // 1. Save assistant message
  try {
    await db.insert(messagesTable).values({
      chatId: state.chatId,
      role: "assistant",
      content: cleanText,
    });
  } catch {
    // Best-effort
  }

  // 2. Update chat title if needed
  try {
    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, state.chatId),
    });
    if (chat && chat.title === "New Chat" && state.inputMessages.length <= 2) {
      const userContent =
        state.lastUserMessage && typeof state.lastUserMessage.content === "string"
          ? state.lastUserMessage.content
          : "";
      const title = userContent.slice(0, 80) || "New Chat";
      await db
        .update(chats)
        .set({ title, updatedAt: new Date() })
        .where(eq(chats.id, state.chatId));
    }
  } catch {
    // Best-effort
  }

  // 3. Log token usage
  const estimatedInputTokens = Math.ceil(
    JSON.stringify(state.inputMessages).length / 4
  );
  const estimatedOutputTokens = Math.ceil(state.fullContent.length / 4);
  logUsage({
    userId: state.userId,
    model: state.modelId,
    inputTokens: estimatedInputTokens,
    outputTokens: estimatedOutputTokens,
  }).catch(() => {});

  // 4. Extract and save files server-side
  try {
    const files = extractFilesFromContent(cleanText);
    if (Object.keys(files).length > 0) {
      const existing = await db.query.projectFiles.findFirst({
        where: eq(projectFiles.projectId, state.projectId),
      });
      const mergedFiles = {
        ...(existing ? JSON.parse(existing.files) : {}),
        ...files,
      };
      const mergedJson = JSON.stringify(mergedFiles);

      if (existing) {
        await db
          .update(projectFiles)
          .set({ files: mergedJson, updatedAt: new Date() })
          .where(eq(projectFiles.projectId, state.projectId));
      } else {
        await db.insert(projectFiles).values({
          projectId: state.projectId,
          files: mergedJson,
        });
      }

      // Save snapshot
      await db.insert(fileSnapshots).values({
        chatId: state.chatId,
        title: "AI Update",
        files: mergedJson,
      });
    }
  } catch (err) {
    console.error("[generation-manager] Failed to save files:", err);
  }

  // 5. Update generation row
  await db
    .update(generations)
    .set({
      status: "completed",
      content: cleanText,
      completedAt: new Date(),
    })
    .where(eq(generations.id, state.id));
}

// ─── Internal: File Extraction ──────────────────────────────────────

function extractFilesFromContent(content: string): Record<string, string> {
  const files: Record<string, string> = {};

  const parser = new MessageParser({
    onActionClose: (_artifactId, action) => {
      if (action.type === "file" && action.filePath && action.content) {
        files[action.filePath] = action.content;
      }
    },
  });

  parser.push(content);
  parser.end();

  return files;
}

// ─── Internal: DB Flush ─────────────────────────────────────────────

function scheduleDbFlush(state: GenerationState) {
  if (state.dbFlushTimer) return; // Already scheduled

  state.dbFlushTimer = setTimeout(async () => {
    state.dbFlushTimer = null;
    await flushToDb(state);
  }, DB_FLUSH_INTERVAL);
}

async function flushToDb(state: GenerationState) {
  if (state.lastDbFlushIndex >= state.chunks.length) return;

  state.lastDbFlushIndex = state.chunks.length;

  try {
    await db
      .update(generations)
      .set({ content: state.fullContent })
      .where(eq(generations.id, state.id));
  } catch {
    // Best-effort — the in-memory state is the source of truth
  }
}

// ─── Internal: Cleanup ──────────────────────────────────────────────

function scheduleCleanup(generationId: string) {
  setTimeout(() => {
    activeGenerations.delete(generationId);
  }, CLEANUP_DELAY);
}
