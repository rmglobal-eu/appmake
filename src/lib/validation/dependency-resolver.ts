/**
 * Auto-detect npm packages used in generated code that need to be installed.
 */

// Packages that are always available in Sandpack (no need to install)
const SANDPACK_BUILT_IN = new Set([
  "react", "react-dom", "react/jsx-runtime", "react-dom/client",
]);

// Known peer dependency relationships
const PEER_DEPS: Record<string, string[]> = {
  "framer-motion": ["react", "react-dom"],
  "@radix-ui/react-dialog": ["react", "react-dom"],
  "react-router-dom": ["react", "react-dom"],
  "react-hook-form": ["react"],
  "zustand": ["react"],
  "swr": ["react"],
  "@tanstack/react-query": ["react"],
  "recharts": ["react", "react-dom"],
};

export interface DependencyInfo {
  name: string;
  importedFrom: string[];
}

/**
 * Extract all npm package dependencies from project files
 */
export function resolveDependencies(files: Record<string, string>): DependencyInfo[] {
  const packageMap = new Map<string, Set<string>>();

  for (const [filePath, content] of Object.entries(files)) {
    const lines = content.split("\n");

    for (const line of lines) {
      // Static imports: import X from "package"
      const staticMatch = line.match(/^\s*import\s+[\s\S]*?from\s+['"]([^'"./][^'"]*)['"]/);
      if (staticMatch) {
        const rawPkg = staticMatch[1];
        const pkgName = rawPkg.startsWith("@")
          ? rawPkg.split("/").slice(0, 2).join("/")
          : rawPkg.split("/")[0];

        if (!SANDPACK_BUILT_IN.has(pkgName)) {
          if (!packageMap.has(pkgName)) packageMap.set(pkgName, new Set());
          packageMap.get(pkgName)!.add(filePath);
        }
      }

      // Dynamic imports: import("package")
      const dynamicMatch = line.match(/import\(\s*['"]([^'"./][^'"]*)['"]\s*\)/);
      if (dynamicMatch) {
        const rawPkg = dynamicMatch[1];
        const pkgName = rawPkg.startsWith("@")
          ? rawPkg.split("/").slice(0, 2).join("/")
          : rawPkg.split("/")[0];

        if (!SANDPACK_BUILT_IN.has(pkgName)) {
          if (!packageMap.has(pkgName)) packageMap.set(pkgName, new Set());
          packageMap.get(pkgName)!.add(filePath);
        }
      }

      // require() calls
      const requireMatch = line.match(/require\(\s*['"]([^'"./][^'"]*)['"]\s*\)/);
      if (requireMatch) {
        const rawPkg = requireMatch[1];
        const pkgName = rawPkg.startsWith("@")
          ? rawPkg.split("/").slice(0, 2).join("/")
          : rawPkg.split("/")[0];

        if (!SANDPACK_BUILT_IN.has(pkgName)) {
          if (!packageMap.has(pkgName)) packageMap.set(pkgName, new Set());
          packageMap.get(pkgName)!.add(filePath);
        }
      }
    }
  }

  return Array.from(packageMap.entries()).map(([name, importedFrom]) => ({
    name,
    importedFrom: Array.from(importedFrom),
  }));
}

/**
 * Get the list of packages that need to be added to the Sandpack dependencies
 */
export function getMissingDependencies(
  files: Record<string, string>,
  existingDependencies: string[] = []
): string[] {
  const existing = new Set(existingDependencies);
  const resolved = resolveDependencies(files);

  return resolved
    .filter((dep) => !existing.has(dep.name))
    .map((dep) => dep.name);
}
