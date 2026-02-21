import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { projectFiles, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id: projectId } = await params;

  // Verify ownership
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, session.user.id)),
  });
  if (!project) {
    return new Response("Not found", { status: 404 });
  }

  const row = await db.query.projectFiles.findFirst({
    where: eq(projectFiles.projectId, projectId),
  });

  if (!row) {
    return Response.json({ files: {} });
  }

  return Response.json({ files: JSON.parse(row.files) });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id: projectId } = await params;

  // Verify ownership
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, session.user.id)),
  });
  if (!project) {
    return new Response("Not found", { status: 404 });
  }

  const { files } = (await req.json()) as { files: Record<string, string> };
  const filesJson = JSON.stringify(files);

  // Upsert: insert or update on conflict
  const existing = await db.query.projectFiles.findFirst({
    where: eq(projectFiles.projectId, projectId),
  });

  if (existing) {
    await db
      .update(projectFiles)
      .set({ files: filesJson, updatedAt: new Date() })
      .where(eq(projectFiles.projectId, projectId));
  } else {
    await db.insert(projectFiles).values({
      projectId,
      files: filesJson,
    });
  }

  return Response.json({ ok: true });
}
