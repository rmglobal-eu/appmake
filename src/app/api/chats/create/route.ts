import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";

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
