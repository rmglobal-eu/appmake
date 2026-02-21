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

/**
 * Build a smart context that prioritizes relevant files.
 * - Always includes: active file, App.tsx, files mentioned in the user's message
 * - For remaining files: includes only the file tree listing (paths, not content)
 * - Respects MAX_TOTAL_SIZE to keep API requests reasonable
 */
export function buildSmartContext(
  allFiles: Record<string, string>,
  userMessage: string,
  activeFilePath?: string | null
): string {
  const parts: string[] = [];
  let totalSize = 0;

  // Determine priority files
  const priorityPaths = new Set<string>();

  // Always include App.tsx
  for (const path of Object.keys(allFiles)) {
    if (/App\.(tsx|jsx|ts|js)$/.test(path)) {
      priorityPaths.add(path);
    }
  }

  // Include active file
  if (activeFilePath && allFiles[activeFilePath]) {
    priorityPaths.add(activeFilePath);
  }

  // Include files mentioned in the user message
  for (const path of Object.keys(allFiles)) {
    const fileName = path.split("/").pop() || path;
    if (userMessage.includes(fileName) || userMessage.includes(path)) {
      priorityPaths.add(path);
    }
  }

  // Add priority files with full content
  for (const path of priorityPaths) {
    const content = allFiles[path];
    if (!content) continue;
    if (totalSize + content.length > MAX_TOTAL_SIZE) break;
    parts.push(`--- ${path} ---\n${content}`);
    totalSize += content.length;
  }

  // Add remaining files with full content if space allows, otherwise just listing
  const remainingPaths = Object.keys(allFiles).filter((p) => !priorityPaths.has(p)).sort();

  if (remainingPaths.length > 0) {
    // Try to include remaining files with content
    const includedFull: string[] = [];
    const listingOnly: string[] = [];

    for (const path of remainingPaths) {
      const content = allFiles[path];
      if (totalSize + content.length <= MAX_TOTAL_SIZE) {
        includedFull.push(`--- ${path} ---\n${content}`);
        totalSize += content.length;
      } else {
        listingOnly.push(path);
      }
    }

    parts.push(...includedFull);

    if (listingOnly.length > 0) {
      parts.push(`\n--- Other files (content not shown) ---\n${listingOnly.join("\n")}`);
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
