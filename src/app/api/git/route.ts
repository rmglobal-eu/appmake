import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { gitConnections, projectFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyProjectOwnership } from "@/lib/auth/ownership";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const owns = await verifyProjectOwnership(projectId, session.user.id);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const connection = await db.query.gitConnections.findFirst({
    where: eq(gitConnections.projectId, projectId),
  });

  return NextResponse.json({ connection: connection || null });
}

// Connect a repo
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, repoFullName, accessToken, branch } = (await req.json()) as {
    projectId: string;
    repoFullName: string;
    accessToken: string;
    branch?: string;
  };

  const owns = await verifyProjectOwnership(projectId, session.user.id);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify token by checking repo access
  const verifyRes = await fetch(`https://api.github.com/repos/${repoFullName}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" },
  });

  if (!verifyRes.ok) {
    return NextResponse.json({ error: "Cannot access repository. Check your token and repo name." }, { status: 400 });
  }

  // Upsert connection
  const existing = await db.query.gitConnections.findFirst({
    where: eq(gitConnections.projectId, projectId),
  });

  if (existing) {
    await db.update(gitConnections)
      .set({ repoFullName, accessToken, branch: branch || "main" })
      .where(eq(gitConnections.id, existing.id));
  } else {
    await db.insert(gitConnections).values({
      projectId,
      repoFullName,
      accessToken,
      branch: branch || "main",
    });
  }

  return NextResponse.json({ success: true });
}

// Push files to GitHub
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, commitMessage, files: clientFiles } = (await req.json()) as {
    projectId: string;
    commitMessage?: string;
    files?: Record<string, string>;
  };

  const owns = await verifyProjectOwnership(projectId, session.user.id);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const connection = await db.query.gitConnections.findFirst({
    where: eq(gitConnections.projectId, projectId),
  });

  if (!connection) {
    return NextResponse.json({ error: "No git connection" }, { status: 400 });
  }

  // Use client-provided files first, fall back to DB
  let files: Record<string, string> | null = null;
  if (clientFiles && Object.keys(clientFiles).length > 0) {
    files = clientFiles;
  } else {
    const filesRow = await db.query.projectFiles.findFirst({
      where: eq(projectFiles.projectId, projectId),
    });
    if (filesRow) {
      files = JSON.parse(filesRow.files);
    }
  }

  if (!files || Object.keys(files).length === 0) {
    return NextResponse.json({ error: "No files to push" }, { status: 400 });
  }
  const token = connection.accessToken;
  const repo = connection.repoFullName;
  const branch = connection.branch;

  try {
    // Get current commit SHA
    const refRes = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${branch}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
    });

    let baseSha: string | null = null;
    let baseTreeSha: string | null = null;

    if (refRes.ok) {
      const refData = await refRes.json();
      baseSha = refData.object.sha;
      const commitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits/${baseSha}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
      });
      const commitData = await commitRes.json();
      baseTreeSha = commitData.tree.sha;
    }

    // Create blobs for each file
    const tree = await Promise.all(
      Object.entries(files).map(async ([path, content]) => {
        const blobRes = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
          body: JSON.stringify({ content, encoding: "utf-8" }),
        });
        const blob = await blobRes.json();
        return { path, mode: "100644" as const, type: "blob" as const, sha: blob.sha };
      })
    );

    // Create tree
    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
      body: JSON.stringify({ tree, base_tree: baseTreeSha }),
    });
    const treeData = await treeRes.json();

    // Create commit
    const commitBody: Record<string, unknown> = {
      message: commitMessage || "Update from Appmake",
      tree: treeData.sha,
    };
    if (baseSha) commitBody.parents = [baseSha];

    const commitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
      body: JSON.stringify(commitBody),
    });
    const newCommit = await commitRes.json();

    // Update ref
    const updateRefMethod = baseSha ? "PATCH" : "POST";
    const updateRefUrl = baseSha
      ? `https://api.github.com/repos/${repo}/git/refs/heads/${branch}`
      : `https://api.github.com/repos/${repo}/git/refs`;
    const updateRefBody = baseSha
      ? { sha: newCommit.sha }
      : { ref: `refs/heads/${branch}`, sha: newCommit.sha };

    await fetch(updateRefUrl, {
      method: updateRefMethod,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
      body: JSON.stringify(updateRefBody),
    });

    // Update last pushed timestamp
    await db.update(gitConnections)
      .set({ lastPushedAt: new Date() })
      .where(eq(gitConnections.id, connection.id));

    return NextResponse.json({
      success: true,
      commitSha: newCommit.sha,
      url: `https://github.com/${repo}/commit/${newCommit.sha}`,
    });
  } catch (error) {
    console.error("Git push error:", error);
    return NextResponse.json({ error: "Failed to push to GitHub" }, { status: 500 });
  }
}
