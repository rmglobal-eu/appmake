import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { collaborators, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyProjectOwnership } from "@/lib/auth/ownership";

// Get collaborators for a project
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ collaborators: [] });
  }

  // Must be owner or collaborator to see the list
  const owns = await verifyProjectOwnership(projectId, session.user.id);
  const isCollab = await db.query.collaborators.findFirst({
    where: and(eq(collaborators.projectId, projectId), eq(collaborators.userId, session.user.id)),
  });

  if (!owns && !isCollab) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const collabs = await db.select({
    id: collaborators.id,
    role: collaborators.role,
    joinedAt: collaborators.joinedAt,
    userId: collaborators.userId,
    userName: users.name,
    userEmail: users.email,
    userImage: users.image,
  })
    .from(collaborators)
    .innerJoin(users, eq(collaborators.userId, users.id))
    .where(eq(collaborators.projectId, projectId));

  return NextResponse.json({ collaborators: collabs });
}

// Add a collaborator by email
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, email, role } = (await req.json()) as {
    projectId: string;
    email: string;
    role?: "editor" | "viewer";
  };

  const owns = await verifyProjectOwnership(projectId, session.user.id);
  if (!owns) {
    return NextResponse.json({ error: "Only the project owner can add collaborators" }, { status: 403 });
  }

  // Find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return NextResponse.json({ error: "No user found with that email" }, { status: 404 });
  }

  if (user.id === session.user.id) {
    return NextResponse.json({ error: "You're already the owner" }, { status: 400 });
  }

  // Check if already a collaborator
  const existing = await db.query.collaborators.findFirst({
    where: and(eq(collaborators.projectId, projectId), eq(collaborators.userId, user.id)),
  });

  if (existing) {
    return NextResponse.json({ error: "User is already a collaborator" }, { status: 400 });
  }

  const [collab] = await db.insert(collaborators).values({
    projectId,
    userId: user.id,
    role: role || "editor",
  }).returning();

  return NextResponse.json({
    collaborator: {
      ...collab,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    },
  });
}

// Remove a collaborator
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { collaboratorId, projectId } = (await req.json()) as {
    collaboratorId: string;
    projectId: string;
  };

  const owns = await verifyProjectOwnership(projectId, session.user.id);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(collaborators).where(eq(collaborators.id, collaboratorId));
  return NextResponse.json({ success: true });
}
