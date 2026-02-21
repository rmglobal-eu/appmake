import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { shares, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId, permission = "view" } = (await req.json()) as {
    projectId: string;
    permission?: "view" | "edit";
  };

  // Verify ownership
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, session.user.id)),
  });
  if (!project) {
    return new Response("Not found", { status: 404 });
  }

  const token = uuid();

  const [share] = await db
    .insert(shares)
    .values({
      projectId,
      token,
      permission,
      createdBy: session.user.id,
    })
    .returning();

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/share/${token}`;

  return Response.json({ share, shareUrl });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return Response.json({ shares: [] });
  }

  // Verify ownership
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, session.user.id)),
  });
  if (!project) {
    return new Response("Not found", { status: 404 });
  }

  const rows = await db
    .select()
    .from(shares)
    .where(eq(shares.projectId, projectId));

  return Response.json({ shares: rows });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { shareId } = (await req.json()) as { shareId: string };

  // Verify the share belongs to the user
  const share = await db.query.shares.findFirst({
    where: and(eq(shares.id, shareId), eq(shares.createdBy, session.user.id)),
  });
  if (!share) {
    return new Response("Not found", { status: 404 });
  }

  await db.delete(shares).where(eq(shares.id, shareId));

  return Response.json({ ok: true });
}
