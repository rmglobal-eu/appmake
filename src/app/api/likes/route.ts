import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { likes } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId } = (await req.json()) as { projectId: string };
  if (!projectId) {
    return new Response("Missing projectId", { status: 400 });
  }

  // Insert like, skip if already exists
  try {
    await db
      .insert(likes)
      .values({ userId: session.user.id, projectId })
      .onConflictDoNothing();
  } catch {
    return new Response("Could not like project", { status: 400 });
  }

  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId } = (await req.json()) as { projectId: string };
  if (!projectId) {
    return new Response("Missing projectId", { status: 400 });
  }

  await db
    .delete(likes)
    .where(and(eq(likes.userId, session.user.id), eq(likes.projectId, projectId)));

  return Response.json({ ok: true });
}
