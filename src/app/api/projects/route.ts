import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { projects, chats, starredProjects } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: projects.id,
      userId: projects.userId,
      name: projects.name,
      template: projects.template,
      isPublic: projects.isPublic,
      description: projects.description,
      category: projects.category,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      starredId: starredProjects.id,
    })
    .from(projects)
    .leftJoin(
      starredProjects,
      and(
        eq(starredProjects.projectId, projects.id),
        eq(starredProjects.userId, session.user.id)
      )
    )
    .where(eq(projects.userId, session.user.id))
    .orderBy(desc(projects.updatedAt));

  const userProjects = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    name: r.name,
    template: r.template,
    isPublic: r.isPublic,
    description: r.description,
    category: r.category,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    starred: r.starredId !== null,
  }));

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
