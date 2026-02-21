import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { fileSnapshots } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifyChatOwnership } from "@/lib/auth/ownership";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { chatId, title, files, messageId, artifactId } = body as {
    chatId: string;
    title: string;
    files: Record<string, string>;
    messageId?: string;
    artifactId?: string;
  };

  const owns = await verifyChatOwnership(chatId, session.user.id);
  if (!owns) {
    return new Response("Forbidden", { status: 403 });
  }

  await db.insert(fileSnapshots).values({
    chatId,
    messageId: messageId ?? null,
    artifactId: artifactId ?? null,
    title,
    files: JSON.stringify(files),
  });

  return Response.json({ ok: true });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");
  if (!chatId) {
    return Response.json({ snapshots: [] });
  }

  const owns = await verifyChatOwnership(chatId, session.user.id);
  if (!owns) {
    return new Response("Forbidden", { status: 403 });
  }

  const rows = await db
    .select()
    .from(fileSnapshots)
    .where(eq(fileSnapshots.chatId, chatId))
    .orderBy(desc(fileSnapshots.createdAt));

  const snapshots = rows.map((r) => ({
    id: r.id,
    title: r.title,
    files: JSON.parse(r.files),
    createdAt: r.createdAt.toISOString(),
  }));

  return Response.json({ snapshots });
}
