import { db } from "@/lib/db";
import { projects, chats, sandboxes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Verify that a project belongs to the given user.
 */
export async function verifyProjectOwnership(
  projectId: string,
  userId: string
): Promise<boolean> {
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
  });
  return !!project;
}

/**
 * Verify that a chat belongs to the given user.
 */
export async function verifyChatOwnership(
  chatId: string,
  userId: string
): Promise<boolean> {
  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, userId)),
  });
  return !!chat;
}

/**
 * Verify that a sandbox belongs to the given user (via project).
 */
export async function verifySandboxOwnership(
  sandboxId: string,
  userId: string
): Promise<boolean> {
  const sandbox = await db.query.sandboxes.findFirst({
    where: eq(sandboxes.id, sandboxId),
  });
  if (!sandbox) return false;

  return verifyProjectOwnership(sandbox.projectId, userId);
}
