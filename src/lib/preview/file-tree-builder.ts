import type { FileSystemTree } from "@webcontainer/api";

/**
 * Convert a flat Record<string, string> (path → content) into the nested
 * FileSystemTree format that WebContainers expect.
 *
 * Input:  { "src/App.tsx": "code...", "src/components/Button.tsx": "code..." }
 * Output: { src: { directory: { "App.tsx": { file: { contents: "code..." } }, ... } } }
 */
export function buildFileSystemTree(
  files: Record<string, string>
): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const [rawPath, content] of Object.entries(files)) {
    // Strip leading ./ or /
    let path = rawPath;
    if (path.startsWith("./")) path = path.slice(2);
    if (path.startsWith("/")) path = path.slice(1);

    const parts = path.split("/");
    let current: FileSystemTree = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        current[part] = {
          file: { contents: content },
        };
      } else {
        // Ensure directory exists
        if (!current[part] || !("directory" in current[part])) {
          current[part] = { directory: {} };
        }
        current = (current[part] as { directory: FileSystemTree }).directory;
      }
    }
  }

  return tree;
}
