import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  // Only allow deleting own projects
  const [deleted] = await db
    .delete(projects)
    .where(
      and(eq(projects.id, id), eq(projects.userId, session.user.id))
    )
    .returning({ id: projects.id });

  if (!deleted) {
    return new Response("Project not found", { status: 404 });
  }

  return Response.json({ ok: true });
}
