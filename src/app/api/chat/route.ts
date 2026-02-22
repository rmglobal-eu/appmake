import { type ModelMessage } from "ai";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { messages as messagesTable, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ModelProvider } from "@/types/chat";
import { classifyIntent } from "@/lib/llm/intent-classifier";
import { trackEvent } from "@/lib/analytics/collector";
import { startGeneration } from "@/lib/generation/generation-manager";

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
    projectId,
    modelId = "gpt-4o",
    provider = "openai",
    projectContext,
    planMode = false,
  } = body as {
    messages: ModelMessage[];
    chatId: string;
    projectId: string;
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

  // ── Start background generation ─────────────────────────────────────
  const generationId = await startGeneration({
    chatId,
    userId,
    projectId,
    messages,
    modelId,
    provider,
    projectContext,
    planMode,
    intent: classified.intent,
    lastUserMessage,
  });

  return Response.json({ generationId });
}
