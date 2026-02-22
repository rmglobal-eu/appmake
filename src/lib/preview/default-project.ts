/**
 * Generates scaffolding files that AI might not provide:
 * package.json, vite.config.ts, index.html, main.tsx.
 *
 * These are merged into the file tree before mounting in WebContainers.
 */

// ---------------------------------------------------------------------------
// Entry point detection (shared logic with bundler.ts)
// ---------------------------------------------------------------------------

const BOOTSTRAP_FILES = [
  "main.tsx", "main.jsx", "main.ts", "main.js",
  "src/main.tsx", "src/main.jsx", "src/main.ts", "src/main.js",
  "src/index.tsx", "src/index.jsx", "src/index.ts", "src/index.js",
];

const COMPONENT_FILES = [
  "src/App.tsx", "src/App.jsx", "src/app.tsx", "src/app.jsx",
  "App.tsx", "App.jsx", "app.tsx", "app.jsx",
];

function looksLikeValidCode(content: string): boolean {
  const trimmed = content.trimStart();
  if (trimmed.length === 0) return false;
  return /^[a-zA-Z"'`/<]/.test(trimmed);
}

interface EntryInfo {
  file: string;
  isSelfMounting: boolean;
}

export function detectEntryPoint(files: Record<string, string>): EntryInfo | null {
  for (const candidate of BOOTSTRAP_FILES) {
    if (candidate in files) {
      const content = files[candidate];
      if (
        looksLikeValidCode(content) &&
        (content.includes("createRoot") ||
          content.includes("render") ||
          content.includes("ReactDOM"))
      ) {
        return { file: candidate, isSelfMounting: true };
      }
    }
  }

  for (const candidate of COMPONENT_FILES) {
    if (candidate in files && looksLikeValidCode(files[candidate])) {
      return { file: candidate, isSelfMounting: false };
    }
  }

  const keys = Object.keys(files);
  const fallback =
    keys.find(
      (k) =>
        (k.endsWith(".tsx") || k.endsWith(".jsx")) &&
        !k.includes("config") &&
        looksLikeValidCode(files[k])
    ) ?? null;

  if (fallback) {
    return { file: fallback, isSelfMounting: false };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Bare specifier detection (for auto-detecting npm dependencies)
// ---------------------------------------------------------------------------

function isBareSpecifier(path: string): boolean {
  if (path.startsWith(".") || path.startsWith("/") || path.startsWith("@/")) {
    return false;
  }
  if (path.startsWith("@") && path.includes("/")) return true;
  return !path.includes(":");
}

/** Scan all files for import/require statements and extract npm package names */
function detectDependencies(files: Record<string, string>): string[] {
  const deps = new Set<string>();

  const importRegex =
    /(?:import|from|require)\s*(?:\(?\s*)?['"]([^'"]+)['"]/g;

  for (const content of Object.values(files)) {
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const specifier = match[1];
      if (!isBareSpecifier(specifier)) continue;

      // Extract package name (handle scoped packages)
      if (specifier.startsWith("@")) {
        const parts = specifier.split("/");
        deps.add(parts.slice(0, 2).join("/"));
      } else {
        deps.add(specifier.split("/")[0]);
      }
    }
  }

  // Always remove react/react-dom — they're included by default
  deps.delete("react");
  deps.delete("react-dom");

  return Array.from(deps);
}

// ---------------------------------------------------------------------------
// Scaffolding generators
// ---------------------------------------------------------------------------

/**
 * Generate or augment package.json.
 * If AI provided one, ensures vite + react plugin are present.
 * If not provided, auto-detects dependencies from imports.
 */
export function generatePackageJson(
  files: Record<string, string>,
  aiPackageJson?: string
): string {
  let pkg: Record<string, unknown>;

  if (aiPackageJson) {
    try {
      pkg = JSON.parse(aiPackageJson);
    } catch {
      pkg = {};
    }
  } else {
    pkg = {};
  }

  // Ensure name and private
  if (!pkg.name) pkg.name = "preview-app";
  if (pkg.private === undefined) pkg.private = true;

  // Ensure scripts
  const scripts = (pkg.scripts as Record<string, string>) || {};
  if (!scripts.dev) scripts.dev = "vite";
  pkg.scripts = scripts;

  // Ensure dependencies
  const deps = (pkg.dependencies as Record<string, string>) || {};
  if (!deps.react) deps.react = "^19.0.0";
  if (!deps["react-dom"]) deps["react-dom"] = "^19.0.0";

  // Auto-detect additional dependencies if not provided
  if (!aiPackageJson) {
    const detected = detectDependencies(files);
    for (const dep of detected) {
      if (!deps[dep]) deps[dep] = "latest";
    }
  }
  pkg.dependencies = deps;

  // Ensure devDependencies have vite + react plugin
  const devDeps = (pkg.devDependencies as Record<string, string>) || {};
  if (!devDeps.vite) devDeps.vite = "^6.0.0";
  if (!devDeps["@vitejs/plugin-react"])
    devDeps["@vitejs/plugin-react"] = "^4.3.0";
  if (!devDeps["@types/react"]) devDeps["@types/react"] = "^19.0.0";
  if (!devDeps["@types/react-dom"]) devDeps["@types/react-dom"] = "^19.0.0";
  pkg.devDependencies = devDeps;

  return JSON.stringify(pkg, null, 2);
}

/** Standard Vite config with React plugin */
export function generateViteConfig(): string {
  return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
});
`;
}

/**
 * Standard index.html with root div, Tailwind CDN, and console/error capture.
 */
export function generateIndexHtml(entryFile: string): string {
  // Ensure entry path starts with / for the script src
  const entryPath = entryFile.startsWith("/") ? entryFile : `/${entryFile}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com" async></script>
  <!-- Error handler + Console interceptor -->
  <script>
    function __hidePreview() {
      document.body.style.background = "#0a0a12";
      document.body.style.color = "transparent";
      var r = document.getElementById("root");
      if (r) r.style.display = "none";
    }
    window.onerror = function(message, source, lineno, colno, error) {
      __hidePreview();
      window.parent.postMessage({
        type: "preview-error",
        error: {
          message: String(message),
          source: source || "",
          line: lineno || 0,
          column: colno || 0,
          stack: error && error.stack ? error.stack : ""
        }
      }, "*");
    };
    window.addEventListener("unhandledrejection", function(event) {
      var reason = event.reason || {};
      __hidePreview();
      window.parent.postMessage({
        type: "preview-error",
        error: {
          message: String(reason.message || reason),
          stack: reason.stack || ""
        }
      }, "*");
    });
    (function() {
      var methods = ["log", "warn", "error", "info", "debug"];
      methods.forEach(function(method) {
        var original = console[method];
        console[method] = function() {
          original.apply(console, arguments);
          try {
            var args = [];
            for (var i = 0; i < arguments.length; i++) {
              var a = arguments[i];
              if (a instanceof Error) {
                args.push(a.message + "\\n" + (a.stack || ""));
              } else if (typeof a === "object" && a !== null) {
                try { args.push(JSON.stringify(a, null, 2)); }
                catch(e) { args.push(String(a)); }
              } else {
                args.push(String(a));
              }
            }
            window.parent.postMessage({
              type: "preview-console",
              level: method,
              args: args,
              timestamp: Date.now()
            }, "*");
          } catch(e) {}
        };
      });
    })();
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="${entryPath}"></script>
</body>
</html>`;
}

/**
 * Generate a main.tsx that mounts the App component.
 * Only used if AI didn't provide a valid self-mounting entry.
 */
export function generateMainTsx(appFile: string): string {
  // Calculate relative import path from src/main.tsx to the app file
  let importPath = appFile;
  // Strip src/ prefix for import
  if (importPath.startsWith("src/")) importPath = importPath.slice(4);
  // Remove extension
  importPath = importPath.replace(/\.(tsx|jsx|ts|js)$/, "");
  // Add relative prefix
  if (!importPath.startsWith(".")) importPath = `./${importPath}`;

  return `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as _M from "${importPath}";

const App = _M.default || _M.App || _M.Main || Object.values(_M).find(v => typeof v === "function") || (() => null);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`;
}

// ---------------------------------------------------------------------------
// Main scaffolding function
// ---------------------------------------------------------------------------

/**
 * Given the AI-generated files, return a complete file map with all
 * scaffolding files filled in. Does NOT overwrite files the AI provided
 * (except package.json which gets augmented).
 */
export function scaffoldProject(
  files: Record<string, string>
): Record<string, string> {
  const result = { ...files };

  // 1. Entry point detection
  const entry = detectEntryPoint(files);

  // 2. package.json — augment or generate
  const aiPkg = files["package.json"];
  result["package.json"] = generatePackageJson(files, aiPkg);

  // 3. vite.config.ts — only if not provided
  if (
    !files["vite.config.ts"] &&
    !files["vite.config.js"] &&
    !files["vite.config.mts"]
  ) {
    result["vite.config.ts"] = generateViteConfig();
  }

  // 4. main.tsx — only if no self-mounting entry exists
  if (entry && !entry.isSelfMounting) {
    if (!files["src/main.tsx"] && !files["src/main.jsx"]) {
      result["src/main.tsx"] = generateMainTsx(entry.file);
    }
  }

  // 5. index.html — only if not provided
  if (!files["index.html"]) {
    // Determine entry path for <script src>
    let entryPath = "src/main.tsx";
    if (entry?.isSelfMounting) {
      entryPath = entry.file;
    }
    result["index.html"] = generateIndexHtml(entryPath);
  }

  // 6. tsconfig.json — basic config if not provided
  if (!files["tsconfig.json"]) {
    result["tsconfig.json"] = JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          module: "ESNext",
          skipLibCheck: true,
          moduleResolution: "bundler",
          allowImportingTsExtensions: true,
          isolatedModules: true,
          moduleDetection: "force",
          noEmit: true,
          jsx: "react-jsx",
          strict: true,
          noUnusedLocals: false,
          noUnusedParameters: false,
        },
        include: ["src"],
      },
      null,
      2
    );
  }

  return result;
}
