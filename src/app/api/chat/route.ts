import { type ModelMessage } from "ai";
import { streamChat } from "@/lib/llm/stream-chat";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { messages as messagesTable, chats, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ModelProvider } from "@/types/chat";
import { classifyIntent } from "@/lib/llm/intent-classifier";
import { logUsage } from "@/lib/llm/cost-tracker";
import { trackEvent } from "@/lib/analytics/collector";

const DEFAULT_DAILY_LIMIT = 20;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const body = await req.json();
  const {
    messages,
    chatId,
    modelId = "gpt-4o",
    provider = "openai",
    projectContext,
    planMode = false,
  } = body as {
    messages: ModelMessage[];
    chatId: string;
    modelId: string;
    provider: ModelProvider;
    projectContext?: string;
    planMode?: boolean;
  };

  // ── Usage limit check ──────────────────────────────────────────────
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  let { dailyMessageCount, messageCountResetAt } = user;
  const DAILY_LIMIT = user.messageLimit ?? DEFAULT_DAILY_LIMIT;
  const now = new Date();
  const msSinceReset = now.getTime() - messageCountResetAt.getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  // Reset count if 24h have passed
  if (msSinceReset >= twentyFourHours) {
    dailyMessageCount = 0;
    messageCountResetAt = now;
    await db
      .update(users)
      .set({ dailyMessageCount: 0, messageCountResetAt: now })
      .where(eq(users.id, userId));
  }

  if (dailyMessageCount >= DAILY_LIMIT) {
    const resetsAt = new Date(messageCountResetAt.getTime() + twentyFourHours);
    return Response.json(
      {
        error: "daily_limit",
        used: dailyMessageCount,
        limit: DAILY_LIMIT,
        resetsAt: resetsAt.toISOString(),
      },
      { status: 429 }
    );
  }

  // Increment count
  await db
    .update(users)
    .set({ dailyMessageCount: dailyMessageCount + 1 })
    .where(eq(users.id, userId));

  // Save user message
  const lastUserMessage = messages[messages.length - 1];
  if (lastUserMessage?.role === "user") {
    await db.insert(messagesTable).values({
      chatId,
      role: "user",
      content:
        typeof lastUserMessage.content === "string"
          ? lastUserMessage.content
          : JSON.stringify(lastUserMessage.content),
    });
  }

  // ── Intent classification ────────────────────────────────────────────
  const lastContent = typeof lastUserMessage.content === "string"
    ? lastUserMessage.content
    : JSON.stringify(lastUserMessage.content);
  const classified = classifyIntent(lastContent);

  // Track analytics event (best-effort)
  trackEvent({
    userId: userId,
    eventType: "chat_message",
    metadata: {
      intent: classified.intent,
      complexity: classified.complexity,
      model: modelId,
      provider,
    },
  }).catch(() => {});

  const result = streamChat({
    messages,
    modelId,
    provider,
    projectContext,
    planMode,
    intent: classified.intent,
    abortSignal: req.signal,
  });

  // Build a custom stream from fullStream that includes tool events as XML tags
  const encoder = new TextEncoder();
  let fullText = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const part of result.fullStream) {
          switch (part.type) {
            case "text-delta": {
              fullText += part.text;
              controller.enqueue(encoder.encode(part.text));
              break;
            }
            case "tool-call": {
              const argsStr = JSON.stringify(part.input);
              const tag = `<tool-activity name="${part.toolName}" status="calling" args="${argsStr.replace(/"/g, "&quot;")}" />\n`;
              fullText += tag;
              controller.enqueue(encoder.encode(tag));
              break;
            }
            case "tool-result": {
              const resultStr = typeof part.output === "string"
                ? part.output
                : JSON.stringify(part.output);
              const summary = resultStr.length > 200 ? resultStr.slice(0, 200) + "..." : resultStr;
              const tag = `<tool-activity name="${part.toolName}" status="complete" result="${summary.replace(/"/g, "&quot;")}" />\n`;
              fullText += tag;
              controller.enqueue(encoder.encode(tag));
              break;
            }
            case "tool-error": {
              const tag = `<tool-activity name="${part.toolName}" status="error" result="Tool execution failed" />\n`;
              fullText += tag;
              controller.enqueue(encoder.encode(tag));
              break;
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }

      // Save assistant message after streaming completes (strip tool tags for storage)
      const cleanText = fullText.replace(/<tool-activity[^/]*\/>\n?/g, "");

      // Log token usage (estimate based on text length)
      const estimatedInputTokens = Math.ceil(JSON.stringify(messages).length / 4);
      const estimatedOutputTokens = Math.ceil(fullText.length / 4);
      logUsage({
        userId: userId,
        model: modelId,
        inputTokens: estimatedInputTokens,
        outputTokens: estimatedOutputTokens,
        intent: classified.intent,
      }).catch(() => {});

      try {
        await db.insert(messagesTable).values({
          chatId,
          role: "assistant",
          content: cleanText,
        });

        const chat = await db.query.chats.findFirst({
          where: eq(chats.id, chatId),
        });
        if (chat && chat.title === "New Chat" && messages.length <= 2) {
          const userContent =
            typeof lastUserMessage.content === "string"
              ? lastUserMessage.content
              : "";
          const title = userContent.slice(0, 80) || "New Chat";
          await db.update(chats).set({ title, updatedAt: new Date() }).where(eq(chats.id, chatId));
        }
      } catch {
        // DB save is best-effort
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
