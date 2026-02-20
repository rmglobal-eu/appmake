import { exec } from "./docker-exec";

const PREVIEW_DOMAIN = process.env.SANDBOX_PREVIEW_DOMAIN || "preview.appmake.dk";

/**
 * Get the preview URL for a sandbox.
 */
export function getPreviewUrl(sandboxId: string, port: number = 3000): string {
  return `https://${sandboxId}.${PREVIEW_DOMAIN}`;
}

/**
 * Detect which ports are listening inside the container.
 */
export async function detectPorts(containerId: string): Promise<number[]> {
  const result = await exec(
    containerId,
    "ss -tlnp 2>/dev/null | grep LISTEN | awk '{print $4}' | grep -oP '\\d+$' | sort -u"
  );

  if (result.exitCode !== 0 || !result.stdout.trim()) {
    return [];
  }

  return result.stdout
    .trim()
    .split("\n")
    .map((p) => parseInt(p, 10))
    .filter((p) => !isNaN(p) && p > 0);
}

/**
 * Wait for a port to become available.
 */
export async function waitForPort(
  containerId: string,
  port: number,
  timeoutMs: number = 30000
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ports = await detectPorts(containerId);
    if (ports.includes(port)) return true;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}
