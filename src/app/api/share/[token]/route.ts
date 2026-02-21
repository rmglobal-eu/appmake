import { db } from "@/lib/db";
import { shares, projects, projectFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
