import type { FileEntry } from "@/types/sandbox";

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "__pycache__",
  ".venv",
  "venv",
]);

const MAX_FILE_SIZE = 50_000; // chars
const MAX_TOTAL_SIZE = 200_000; // chars

export function buildFileContext(
  files: { path: string; content: string }[]
): string {
  let totalSize = 0;
  const parts: string[] = [];

  for (const file of files) {
    if (totalSize + file.content.length > MAX_TOTAL_SIZE) break;
    if (file.content.length > MAX_FILE_SIZE) {
      parts.push(
        `--- ${file.path} (truncated, ${file.content.length} chars) ---\n${file.content.slice(0, MAX_FILE_SIZE)}\n...`
      );
      totalSize += MAX_FILE_SIZE;
    } else {
      parts.push(`--- ${file.path} ---\n${file.content}`);
      totalSize += file.content.length;
    }
  }

  return parts.join("\n\n");
}

export function buildFileTreeString(entries: FileEntry[], indent = ""): string {
  const lines: string[] = [];

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;

    if (entry.type === "directory") {
      lines.push(`${indent}${entry.name}/`);
      if (entry.children) {
        lines.push(buildFileTreeString(entry.children, indent + "  "));
      }
    } else {
      lines.push(`${indent}${entry.name}`);
    }
  }

  return lines.join("\n");
}
