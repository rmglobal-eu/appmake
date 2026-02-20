import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { projects, chats } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userProjects = await db.query.projects.findMany({
    where: eq(projects.userId, session.user.id),
    orderBy: [desc(projects.updatedAt)],
  });

  return NextResponse.json(userProjects);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, template = "node" } = (await req.json()) as {
    name: string;
    template?: string;
  };

  const [project] = await db
    .insert(projects)
    .values({
      userId: session.user.id,
      name,
      template,
    })
    .returning();

  // Create initial chat
  const [chat] = await db
    .insert(chats)
    .values({
      projectId: project.id,
      userId: session.user.id,
      title: "New Chat",
    })
    .returning();

  return NextResponse.json({ project, chatId: chat.id });
}
