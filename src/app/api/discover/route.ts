import { SHOWCASE_PROJECTS } from "@/lib/discover/showcase-projects";
import { db } from "@/lib/db";
import { projects, users, likes } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const showcase = SHOWCASE_PROJECTS;

  let publicProjects: unknown[] = [];
  try {
    publicProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        category: projects.category,
        authorName: users.name,
        createdAt: projects.createdAt,
        likeCount: sql<number>`coalesce(count(${likes.id}), 0)`.as("like_count"),
      })
      .from(projects)
      .leftJoin(users, eq(projects.userId, users.id))
      .leftJoin(likes, eq(projects.id, likes.projectId))
      .where(eq(projects.isPublic, 1))
      .groupBy(projects.id, users.name)
      .orderBy(sql`like_count desc`);
  } catch {
    // DB not available — fall back to showcase only
  }

  return Response.json({ showcase, projects: publicProjects });
}
