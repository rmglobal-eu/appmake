import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { deployments, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId, files, token } = (await req.json()) as {
    projectId: string;
    files: Record<string, string>;
    token: string;
  };

  // Verify ownership
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, session.user.id)),
  });
  if (!project) {
    return new Response("Not found", { status: 404 });
  }

  if (!token) {
    return Response.json({ error: "Vercel API token required" }, { status: 400 });
  }

  // Create deployment record
  const [deployment] = await db
    .insert(deployments)
    .values({
      projectId,
      provider: "vercel",
      status: "building",
    })
    .returning();

  try {
    // Build the file structure for Vercel API
    const vercelFiles = Object.entries(files).map(([path, content]) => ({
      file: path,
      data: content,
    }));

    // Deploy to Vercel
    const res = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: project.name.toLowerCase().replace(/\s+/g, "-"),
        files: vercelFiles,
        projectSettings: {
          framework: null,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      await db
        .update(deployments)
        .set({ status: "error" })
        .where(eq(deployments.id, deployment.id));
      return Response.json(
        { error: err.error?.message || "Vercel deploy failed" },
        { status: 500 }
      );
    }

    const data = await res.json();
    const url = `https://${data.url}`;

    await db
      .update(deployments)
      .set({ status: "ready", url })
      .where(eq(deployments.id, deployment.id));

    return Response.json({ url, deploymentId: deployment.id });
  } catch (err) {
    await db
      .update(deployments)
      .set({ status: "error" })
      .where(eq(deployments.id, deployment.id));
    return Response.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
