import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { generations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getGenerationState,
  subscribe,
} from "@/lib/generation/generation-manager";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id: generationId } = await params;
  const userId = session.user.id;
  const url = new URL(req.url);
  const fromChunk = parseInt(url.searchParams.get("from") ?? "0", 10);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      function sendEvent(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      // Check in-memory state first
      const state = getGenerationState(generationId);

      if (state) {
        // Verify ownership
        if (state.userId !== userId) {
          sendEvent("error", { error: "Unauthorized" });
          controller.close();
          return;
        }

        // Subscribe — this replays from `fromChunk` and subscribes to live chunks
        let chunkIndex = fromChunk;
        const unsubscribe = subscribe(generationId, fromChunk, (chunk, done) => {
          if (done) {
            sendEvent("done", { status: state.status });
            controller.close();
            return;
          }

          sendEvent("chunk", { text: chunk, index: chunkIndex });
          chunkIndex++;
        });

        if (!unsubscribe) {
          sendEvent("error", { error: "Generation not found" });
          controller.close();
          return;
        }

        // Clean up on client disconnect
        req.signal.addEventListener("abort", () => {
          unsubscribe();
        });
      } else {
        // Not in memory — try DB (server may have restarted)
        loadFromDb(generationId, userId, sendEvent).then(() => {
          controller.close();
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function loadFromDb(
  generationId: string,
  userId: string,
  sendEvent: (event: string, data: unknown) => void
) {
  try {
    const row = await db.query.generations.findFirst({
      where: eq(generations.id, generationId),
    });

    if (!row) {
      sendEvent("error", { error: "Generation not found" });
      return;
    }

    if (row.userId !== userId) {
      sendEvent("error", { error: "Unauthorized" });
      return;
    }

    // Send full content as catchup event
    sendEvent("catchup", {
      content: row.content,
      status: row.status,
      error: row.error,
    });

    sendEvent("done", { status: row.status });
  } catch {
    sendEvent("error", { error: "Internal server error" });
  }
}
