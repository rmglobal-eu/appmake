import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  // Get the most recent chat for this project
  const chat = await db.query.chats.findFirst({
    where: and(
      eq(chats.projectId, projectId),
      eq(chats.userId, session.user.id)
    ),
    orderBy: [desc(chats.updatedAt)],
  });

  return NextResponse.json(chat ?? null);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = (await req.json()) as { projectId: string };

  const [chat] = await db
    .insert(chats)
    .values({
      projectId,
      userId: session.user.id,
      title: "New Chat",
    })
    .returning();

  return NextResponse.json(chat);
}
