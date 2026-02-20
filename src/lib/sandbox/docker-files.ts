import { getDockerClient } from "./docker-manager";
import { exec } from "./docker-exec";
import type { FileEntry } from "@/types/sandbox";
import * as path from "path";

/**
 * Write a file to a container using Docker tar archive API.
 */
export async function writeFile(
  containerId: string,
  filePath: string,
  content: string
) {
  const docker = getDockerClient();
  const container = docker.getContainer(filePath.startsWith("/") ? containerId : containerId);
  const absPath = filePath.startsWith("/") ? filePath : `/workspace/${filePath}`;
  const dir = path.dirname(absPath);
  const fileName = path.basename(absPath);

  // Ensure directory exists
  await exec(containerId, `mkdir -p ${dir}`);

  // Create tar archive with the file
  const { Readable } = await import("stream");
  const Pack = (await import("tar-stream")).pack;
  const pack = Pack();
  pack.entry({ name: fileName }, content);
  pack.finalize();

  // Use putArchive to write to container
  await container.putArchive(pack, { path: dir });
}

/**
 * Read a file from a container.
 */
export async function readFile(
  containerId: string,
  filePath: string
): Promise<string> {
  const absPath = filePath.startsWith("/") ? filePath : `/workspace/${filePath}`;
  const result = await exec(containerId, `cat "${absPath}"`);
  if (result.exitCode !== 0) {
    throw new Error(`Failed to read file: ${result.stderr}`);
  }
  return result.stdout;
}

/**
 * List files in a container directory as a tree.
 */
export async function listFiles(
  containerId: string,
  dirPath = "/workspace"
): Promise<FileEntry[]> {
  const result = await exec(
    containerId,
    `find "${dirPath}" -maxdepth 5 -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.next/*' -not -path '*/__pycache__/*' | sort`
  );

  if (result.exitCode !== 0) {
    return [];
  }

  const lines = result.stdout.split("\n").filter(Boolean);
  return buildTree(lines, dirPath);
}

function buildTree(paths: string[], rootDir: string): FileEntry[] {
  const root: FileEntry[] = [];
  const dirMap = new Map<string, FileEntry>();

  for (const fullPath of paths) {
    if (fullPath === rootDir) continue;

    const relativePath = fullPath.replace(rootDir + "/", "");
    const parts = relativePath.split("/");
    const name = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join("/");

    // Determine if it's a directory by checking if any other path starts with this one
    const isDir = paths.some(
      (p) => p !== fullPath && p.startsWith(fullPath + "/")
    );

    const entry: FileEntry = {
      name,
      path: fullPath,
      type: isDir ? "directory" : "file",
      children: isDir ? [] : undefined,
    };

    dirMap.set(relativePath, entry);

    if (!parentPath) {
      root.push(entry);
    } else {
      const parent = dirMap.get(parentPath);
      if (parent?.children) {
        parent.children.push(entry);
      }
    }
  }

  return root;
}

/**
 * Delete a file from a container.
 */
export async function deleteFile(containerId: string, filePath: string) {
  const absPath = filePath.startsWith("/") ? filePath : `/workspace/${filePath}`;
  await exec(containerId, `rm -rf "${absPath}"`);
}
