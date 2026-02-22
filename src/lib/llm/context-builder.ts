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
const MAX_TOTAL_SIZE = 300_000; // chars (increased from 200K)

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
 * Get files imported by a given file's content.
 * Parses import statements and resolves to actual file paths.
 */
function getImportedFiles(
  content: string,
  allFiles: Record<string, string>
): Set<string> {
  const imports = new Set<string>();
  const allPaths = Object.keys(allFiles);

  // Match: import ... from './path' or import ... from '../path'
  const importRegex = /from\s+['"](\.[^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    const resolved = resolveImportPath(importPath, allPaths);
    if (resolved) imports.add(resolved);
  }

  return imports;
}

/**
 * Resolve an import path to an actual file in the project.
 * Handles missing extensions (.tsx, .ts, .jsx, .js) and index files.
 */
function resolveImportPath(
  importPath: string,
  allPaths: string[]
): string | null {
  // Normalize: strip leading ./ if present
  const normalized = importPath.replace(/^\.\//, "");

  // Try exact match first
  if (allPaths.includes(normalized)) return normalized;

  // Try with extensions
  const extensions = [".tsx", ".ts", ".jsx", ".js"];
  for (const ext of extensions) {
    const withExt = normalized + ext;
    if (allPaths.includes(withExt)) return withExt;
  }

  // Try as directory with index file
  for (const ext of extensions) {
    const indexPath = `${normalized}/index${ext}`;
    if (allPaths.includes(indexPath)) return indexPath;
  }

  return null;
}

/**
 * Check if a file is a CSS file.
 */
function isCssFile(path: string): boolean {
  return /\.(css|scss|sass|less)$/.test(path);
}

/**
 * Build a smart context that prioritizes relevant files.
 *
 * Priority order:
 * 1. Active file (always)
 * 2. Files imported by the active file
 * 3. App.tsx / main entry
 * 4. CSS files (globals.css, etc.)
 * 5. Files mentioned in the user's message
 * 6. Remaining files
 */
export function buildSmartContext(
  allFiles: Record<string, string>,
  userMessage: string,
  activeFilePath?: string | null
): string {
  const parts: string[] = [];
  let totalSize = 0;
  const included = new Set<string>();

  function addFile(path: string): boolean {
    if (included.has(path)) return true;
    const content = allFiles[path];
    if (!content) return false;
    if (totalSize + content.length > MAX_TOTAL_SIZE) return false;
    parts.push(`--- ${path} ---\n${content}`);
    totalSize += content.length;
    included.add(path);
    return true;
  }

  // 1. Active file (always first)
  if (activeFilePath && allFiles[activeFilePath]) {
    addFile(activeFilePath);

    // 2. Files imported by the active file
    const importedFiles = getImportedFiles(allFiles[activeFilePath], allFiles);
    for (const imp of importedFiles) {
      addFile(imp);
    }
  }

  // 3. App.tsx / main entry files
  for (const path of Object.keys(allFiles)) {
    if (/^(App|main|index)\.(tsx|jsx|ts|js)$/.test(path)) {
      addFile(path);
    }
  }

  // 4. CSS files (they're small but important for design context)
  for (const path of Object.keys(allFiles)) {
    if (isCssFile(path)) {
      addFile(path);
    }
  }

  // 5. Files mentioned in the user's message
  for (const path of Object.keys(allFiles)) {
    const fileName = path.split("/").pop() || path;
    if (userMessage.includes(fileName) || userMessage.includes(path)) {
      addFile(path);
    }
  }

  // 6. Remaining files: include with content if space allows
  const remainingPaths = Object.keys(allFiles)
    .filter((p) => !included.has(p))
    .sort();

  const listingOnly: string[] = [];
  for (const path of remainingPaths) {
    if (!addFile(path)) {
      listingOnly.push(path);
    }
  }

  if (listingOnly.length > 0) {
    parts.push(`\n--- Other files (content not shown) ---\n${listingOnly.join("\n")}`);
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
