export interface ImportError {
  filePath: string;
  importPath: string;
  message: string;
}

export interface ImportValidationResult {
  valid: boolean;
  errors: ImportError[];
  missingPackages: string[];
}

// Node.js-only packages that won't work in browser sandbox
const NODE_ONLY_PACKAGES = new Set([
  "fs", "path", "child_process", "os", "crypto", "http", "https", "net",
  "stream", "zlib", "cluster", "worker_threads", "dgram", "dns", "tls",
  "readline", "vm", "v8", "perf_hooks", "async_hooks", "url", "querystring",
  "buffer", "events", "util",
]);

// Packages included in the Sandpack template
const BUILT_IN_PACKAGES = new Set([
  "react", "react-dom", "react/jsx-runtime",
]);

/**
 * Extract all imports from a source file
 */
function extractImports(code: string): { path: string; line: number }[] {
  const imports: { path: string; line: number }[] = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    // Static imports
    const staticMatch = lines[i].match(/^\s*import\s+[\s\S]*?from\s+['"]([^'"]+)['"]/);
    if (staticMatch) {
      imports.push({ path: staticMatch[1], line: i + 1 });
      continue;
    }

    // Side-effect imports
    const sideEffectMatch = lines[i].match(/^\s*import\s+['"]([^'"]+)['"]/);
    if (sideEffectMatch) {
      imports.push({ path: sideEffectMatch[1], line: i + 1 });
      continue;
    }

    // Dynamic imports
    const dynamicMatch = lines[i].match(/import\(['"]([^'"]+)['"]\)/);
    if (dynamicMatch) {
      imports.push({ path: dynamicMatch[1], line: i + 1 });
    }
  }

  return imports;
}

/**
 * Validate all imports in a file against the project files and known packages
 */
export function validateImports(
  code: string,
  filePath: string,
  projectFiles: Record<string, string>
): ImportValidationResult {
  const errors: ImportError[] = [];
  const missingPackages: string[] = [];
  const imports = extractImports(code);

  for (const imp of imports) {
    const importPath = imp.path;

    // Relative imports — check against project files
    if (importPath.startsWith("./") || importPath.startsWith("../")) {
      const resolvedPaths = resolveRelativeImport(filePath, importPath);
      const found = resolvedPaths.some((p) => p in projectFiles);

      if (!found) {
        errors.push({
          filePath,
          importPath,
          message: `Cannot resolve relative import '${importPath}' from '${filePath}'`,
        });
      }
      continue;
    }

    // Package imports
    const packageName = importPath.startsWith("@")
      ? importPath.split("/").slice(0, 2).join("/")
      : importPath.split("/")[0];

    // Check for Node.js-only packages
    if (NODE_ONLY_PACKAGES.has(packageName)) {
      errors.push({
        filePath,
        importPath,
        message: `'${packageName}' is a Node.js-only module and won't work in the browser. Use a browser-compatible alternative.`,
      });
      continue;
    }

    // Track non-built-in packages that need to be installed
    if (!BUILT_IN_PACKAGES.has(packageName)) {
      missingPackages.push(packageName);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    missingPackages: [...new Set(missingPackages)],
  };
}

/**
 * Resolve a relative import to possible file paths
 */
function resolveRelativeImport(fromFile: string, importPath: string): string[] {
  const dir = fromFile.includes("/") ? fromFile.substring(0, fromFile.lastIndexOf("/")) : "";
  let resolved = importPath;

  if (dir && importPath.startsWith("./")) {
    resolved = `${dir}/${importPath.slice(2)}`;
  } else if (importPath.startsWith("../")) {
    const parts = dir.split("/");
    let imp = importPath;
    while (imp.startsWith("../")) {
      parts.pop();
      imp = imp.slice(3);
    }
    resolved = parts.length > 0 ? `${parts.join("/")}/${imp}` : imp;
  }

  // Try common extensions
  const extensions = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js"];
  return extensions.map((ext) => resolved + ext);
}
