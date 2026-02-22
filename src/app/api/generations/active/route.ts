import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { generations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  findActiveGeneration,
  getGenerationState,
} from "@/lib/generation/generation-manager";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const url = new URL(req.url);
  const chatId = url.searchParams.get("chatId");

  if (!chatId) {
    return Response.json({ error: "chatId required" }, { status: 400 });
  }

  // 1. Check in-memory first
  const active = findActiveGeneration(chatId, userId);
  if (active) {
    return Response.json({
      generationId: active.id,
      status: active.status,
    });
  }

  // 2. Check DB for streaming rows (server may have lost them on restart)
  try {
    const row = await db.query.generations.findFirst({
      where: and(
        eq(generations.chatId, chatId),
        eq(generations.userId, userId),
        eq(generations.status, "streaming")
      ),
    });

    if (row) {
      // Found in DB but not in memory — server restarted. Mark as error.
      await db
        .update(generations)
        .set({
          status: "error",
          error: "Server genstartet under generation",
          completedAt: new Date(),
        })
        .where(eq(generations.id, row.id));

      return Response.json({
        generationId: row.id,
        status: "error",
        partialContent: row.content || null,
      });
    }
  } catch {
    // Best-effort
  }

  return Response.json({ generationId: null });
}
