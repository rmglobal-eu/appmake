import { type ModelMessage } from "ai";
import { streamChat } from "@/lib/llm/stream-chat";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { messages as messagesTable, chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ModelProvider } from "@/types/chat";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

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

  const result = streamChat({
    messages,
    modelId,
    provider,
    projectContext,
    planMode,
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
