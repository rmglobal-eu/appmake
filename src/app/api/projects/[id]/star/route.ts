import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { starredProjects } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id: projectId } = await params;

  // Check if already starred
  const existing = await db
    .select()
    .from(starredProjects)
    .where(
      and(
        eq(starredProjects.userId, session.user.id),
        eq(starredProjects.projectId, projectId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Unstar
    await db
      .delete(starredProjects)
      .where(
        and(
          eq(starredProjects.userId, session.user.id),
          eq(starredProjects.projectId, projectId)
        )
      );
    return Response.json({ starred: false });
  }

  // Star
  await db
    .insert(starredProjects)
    .values({ userId: session.user.id, projectId });

  return Response.json({ starred: true });
}
