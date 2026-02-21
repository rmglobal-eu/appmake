import Docker from "dockerode";
import { db } from "@/lib/db";
import { sandboxes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { SandboxTemplate } from "@/types/sandbox";

const docker = new Docker({
  socketPath: process.env.DOCKER_HOST || "/var/run/docker.sock",
});

const RESOURCE_LIMITS = {
  Memory: 512 * 1024 * 1024, // 512MB
  NanoCpus: 1_000_000_000, // 1 CPU
  PidsLimit: 100,
};

const IMAGE_MAP: Record<SandboxTemplate, string> = {
  node: "appmake-sandbox-node",
  python: "appmake-sandbox-python",
  static: "appmake-sandbox-static",
};

export async function createSandbox(
  projectId: string,
  template: SandboxTemplate = "node"
) {
  const image = IMAGE_MAP[template] || IMAGE_MAP.node;

  // Create DB record
  const [sandbox] = await db
    .insert(sandboxes)
    .values({ projectId, status: "creating" })
    .returning();

  try {
    // Create container
    const container = await docker.createContainer({
      Image: image,
      Cmd: ["/bin/bash"],
      Tty: true,
      OpenStdin: true,
      WorkingDir: "/workspace",
      HostConfig: {
        Memory: RESOURCE_LIMITS.Memory,
        NanoCpus: RESOURCE_LIMITS.NanoCpus,
        PidsLimit: RESOURCE_LIMITS.PidsLimit,
        NetworkMode: "bridge",
        AutoRemove: false,
        SecurityOpt: ["no-new-privileges"],
        CapDrop: ["ALL"],
        CapAdd: ["CHOWN", "SETUID", "SETGID", "NET_BIND_SERVICE"],
        ReadonlyRootfs: false,
      },
      Labels: {
        "appmake.project": projectId,
        "appmake.sandbox": sandbox.id,
      },
    });

    await container.start();

    // Update DB
    await db
      .update(sandboxes)
      .set({ containerId: container.id, status: "running" })
      .where(eq(sandboxes.id, sandbox.id));

    return { ...sandbox, containerId: container.id, status: "running" as const };
  } catch (error) {
    await db
      .update(sandboxes)
      .set({ status: "destroyed" })
      .where(eq(sandboxes.id, sandbox.id));
    throw error;
  }
}

export async function destroySandbox(sandboxId: string) {
  const sandbox = await db.query.sandboxes.findFirst({
    where: eq(sandboxes.id, sandboxId),
  });

  if (!sandbox?.containerId) return;

  try {
    const container = docker.getContainer(sandbox.containerId);
    await container.stop().catch(() => {}); // May already be stopped
    await container.remove().catch(() => {});
  } catch {
    // Container may not exist
  }

  await db
    .update(sandboxes)
    .set({ status: "destroyed" })
    .where(eq(sandboxes.id, sandboxId));
}

export async function getSandbox(projectId: string) {
  return db.query.sandboxes.findFirst({
    where: eq(sandboxes.projectId, projectId),
  });
}

export async function touchSandbox(sandboxId: string) {
  await db
    .update(sandboxes)
    .set({ lastActiveAt: new Date() })
    .where(eq(sandboxes.id, sandboxId));
}

export function getDockerClient() {
  return docker;
}
