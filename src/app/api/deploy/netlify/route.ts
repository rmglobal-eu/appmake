import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { deployments, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId, files, token, siteId } = (await req.json()) as {
    projectId: string;
    files: Record<string, string>;
    token: string;
    siteId?: string;
  };

  // Verify ownership
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, session.user.id)),
  });
  if (!project) {
    return new Response("Not found", { status: 404 });
  }

  if (!token) {
    return Response.json({ error: "Netlify API token required" }, { status: 400 });
  }

  // Create deployment record
  const [deployment] = await db
    .insert(deployments)
    .values({
      projectId,
      provider: "netlify",
      status: "building",
    })
    .returning();

  try {
    // Build file hashes for Netlify deploy API
    const encoder = new TextEncoder();
    const fileHashes: Record<string, string> = {};
    const fileContents: Record<string, Uint8Array> = {};

    for (const [path, content] of Object.entries(files)) {
      const data = encoder.encode(content);
      const hash = await crypto.subtle.digest("SHA-1", data);
      const hashHex = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const deployPath = `/${path}`;
      fileHashes[deployPath] = hashHex;
      fileContents[hashHex] = data;
    }

    // Create deploy
    const targetSite = siteId || project.name.toLowerCase().replace(/\s+/g, "-");
    const deployRes = await fetch(
      `https://api.netlify.com/api/v1/sites/${targetSite}/deploys`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: fileHashes }),
      }
    );

    if (!deployRes.ok) {
      const err = await deployRes.json();
      await db
        .update(deployments)
        .set({ status: "error" })
        .where(eq(deployments.id, deployment.id));
      return Response.json(
        { error: err.message || "Netlify deploy failed" },
        { status: 500 }
      );
    }

    const deployData = await deployRes.json();

    // Upload required files
    if (deployData.required?.length) {
      for (const hash of deployData.required) {
        const body = fileContents[hash];
        if (!body) continue;
        await fetch(
          `https://api.netlify.com/api/v1/deploys/${deployData.id}/files/${hash}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/octet-stream",
            },
            body: body as unknown as BodyInit,
          }
        );
      }
    }

    const url = deployData.ssl_url || deployData.deploy_ssl_url || `https://${deployData.subdomain}.netlify.app`;

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
