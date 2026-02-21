import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  createPresenceStream,
  updatePresence,
  getActiveUsers,
} from "@/lib/collaboration/presence";
import type { CursorPosition } from "@/lib/collaboration/presence";

/**
 * GET /api/collaboration/presence?projectId=xxx
 *
 * Server-Sent Events endpoint for real-time presence updates.
 * Returns a text/event-stream that emits "presence" events
 * whenever the active users list changes.
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing projectId parameter" },
      { status: 400 }
    );
  }

  const userId = session.user.id!;
  const userName = session.user.name ?? "Anonymous";
  const userAvatar = session.user.image ?? "";

  const stream = createPresenceStream(projectId, userId, userName, userAvatar);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * POST /api/collaboration/presence
 *
 * Update the authenticated user's presence (cursor position).
 * Body: { projectId: string, cursor?: { filePath, line, column } }
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { projectId?: string; cursor?: CursorPosition };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { projectId, cursor } = body;

  if (!projectId || typeof projectId !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid projectId" },
      { status: 400 }
    );
  }

  if (cursor) {
    if (
      typeof cursor.filePath !== "string" ||
      typeof cursor.line !== "number" ||
      typeof cursor.column !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid cursor format. Expected { filePath, line, column }" },
        { status: 400 }
      );
    }
  }

  updatePresence(projectId, session.user.id!, cursor);

  const activeUsers = getActiveUsers(projectId);

  return NextResponse.json({ ok: true, activeUsers });
}
