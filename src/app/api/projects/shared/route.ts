import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { collaborators, projects, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      template: projects.template,
      description: projects.description,
      category: projects.category,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      ownerName: users.name,
      ownerImage: users.image,
      role: collaborators.role,
      joinedAt: collaborators.joinedAt,
    })
    .from(collaborators)
    .innerJoin(projects, eq(projects.id, collaborators.projectId))
    .innerJoin(users, eq(users.id, projects.userId))
    .where(eq(collaborators.userId, session.user.id))
    .orderBy(desc(collaborators.joinedAt));

  return NextResponse.json(rows);
}
