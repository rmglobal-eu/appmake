import { db } from "@/lib/db";
import { shares, projects, projectFiles, collaborators } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth/config";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const share = await db.query.shares.findFirst({
    where: eq(shares.token, token),
  });

  if (!share) {
    return new Response("Not found", { status: 404 });
  }

  // Check expiry
  if (share.expiresAt && share.expiresAt < new Date()) {
    return new Response("Share link expired", { status: 410 });
  }

  // Auto-add authenticated user as collaborator
  const session = await auth();
  if (session?.user?.id) {
    const userId = session.user.id;

    // Get project to check ownership
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, share.projectId),
    });

    // Only add if user is NOT the project owner
    if (project && project.userId !== userId) {
      // Check if already a collaborator
      const existing = await db.query.collaborators.findFirst({
        where: and(
          eq(collaborators.projectId, share.projectId),
          eq(collaborators.userId, userId)
        ),
      });

      if (!existing) {
        await db.insert(collaborators).values({
          projectId: share.projectId,
          userId,
          role: share.permission === "edit" ? "editor" : "viewer",
        });
      }
    }
  }

  // Get project info
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, share.projectId),
  });

  // Get files
  const filesRow = await db.query.projectFiles.findFirst({
    where: eq(projectFiles.projectId, share.projectId),
  });

  const files = filesRow ? JSON.parse(filesRow.files) : {};

  return Response.json({
    projectName: project?.name || "Shared Project",
    permission: share.permission,
    files,
  });
}
