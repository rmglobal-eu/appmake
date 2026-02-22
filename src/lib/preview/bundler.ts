import * as esbuild from "esbuild-wasm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BundleError {
  text: string;
  location?: { file: string; line: number; column: number };
}

export interface BundleResult {
  success: boolean;
  code: string;
  css: string;
  externals: string[];
  errors: BundleError[];
  warnings: string[];
  entryPoint: string;
}

// ---------------------------------------------------------------------------
// Singleton initialization
// ---------------------------------------------------------------------------

let initPromise: Promise<void> | null = null;
let initialized = false;

async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = esbuild.initialize({
    worker: true,
    wasmURL: "/esbuild.wasm",
  });

  try {
    await initPromise;
    initialized = true;
  } catch (err) {
    if (err instanceof Error && err.message.includes("initialize")) {
      initialized = true;
      return;
    }
    initPromise = null;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Path utilities
// ---------------------------------------------------------------------------

/** Strip common prefixes so all paths are relative (e.g. "src/App.tsx" → "App.tsx") */
function stripPrefix(p: string): string {
  if (p.startsWith("./")) p = p.slice(2);
  if (p.startsWith("/")) p = p.slice(1);
  if (p.startsWith("@/")) p = p.slice(2);
  if (p.startsWith("src/")) p = p.slice(4);
  return p;
}

/** Join a directory base with a relative path, handling ".." correctly */
function joinPaths(base: string, relative: string): string {
  const parts = base ? base.split("/").filter(Boolean) : [];
  for (const seg of relative.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg !== "." && seg !== "") parts.push(seg);
  }
  return parts.join("/");
}

/** Get the directory part of a file path */
function dirOf(filePath: string): string {
  const idx = filePath.lastIndexOf("/");
  return idx >= 0 ? filePath.substring(0, idx) : "";
}

function getLoader(path: string): "tsx" | "ts" | "jsx" | "js" | "css" | "json" {
  if (path.endsWith(".tsx")) return "tsx";
  if (path.endsWith(".ts")) return "ts";
  if (path.endsWith(".jsx")) return "jsx";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".json")) return "json";
  return "js";
}

const EXTENSIONS = ["", ".tsx", ".ts", ".jsx", ".js", ".json"];

/** Asset extensions that can't be bundled as code — return a placeholder */
const ASSET_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif", ".ico",
  ".mp4", ".webm", ".ogg", ".mp3", ".wav",
  ".woff", ".woff2", ".ttf", ".eot",
  ".pdf",
];

/** Try to find a file in the map, with extension and /index fallbacks */
function resolveInMap(
  name: string,
  files: Record<string, string>
): string | null {
  for (const ext of EXTENSIONS) {
    const key = name + ext;
    if (key in files) return key;
  }
  for (const ext of EXTENSIONS) {
    if (ext === "") continue;
    const key = name + "/index" + ext;
    if (key in files) return key;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Entry point detection (uses normalized keys)
// ---------------------------------------------------------------------------

/** Files that typically contain mounting logic (createRoot/render) — use directly */
const BOOTSTRAP_FILES = [
  "main.tsx", "main.jsx", "main.ts", "main.js",
  "index.tsx", "index.jsx", "index.ts", "index.js",
];

/** Files that are the root component — need a synthetic wrapper to mount */
const COMPONENT_FILES = [
  "App.tsx", "App.jsx", "app.tsx", "app.jsx",
];

interface EntryInfo {
  file: string;
  /** If true, file already has mounting logic — use directly. If false, wrap with createRoot. */
  isSelfMounting: boolean;
}

/** Quick check: does the content look like valid JS/TS? (first non-whitespace char) */
function looksLikeValidCode(content: string): boolean {
  const trimmed = content.trimStart();
  if (trimmed.length === 0) return false;
  const ch = trimmed[0];
  // Valid JS/TS files start with: import/export/const/let/var/function/class/type/interface,
  // comments (// or /*), strings ("/' /`), or JSX (<)
  return /[a-zA-Z"'`/<]/.test(ch);
}

function detectEntryPoint(files: Record<string, string>): EntryInfo | null {
  // 1. Check for bootstrap files (main.tsx, index.tsx) — they mount the app themselves
  for (const candidate of BOOTSTRAP_FILES) {
    if (candidate in files) {
      const content = files[candidate];
      // Must look like valid code AND contain mounting logic
      if (looksLikeValidCode(content) &&
          (content.includes("createRoot") || content.includes("render") || content.includes("ReactDOM"))) {
        return { file: candidate, isSelfMounting: true };
      }
    }
  }

  // 2. Check for component files (App.tsx) — need synthetic wrapper
  for (const candidate of COMPONENT_FILES) {
    if (candidate in files && looksLikeValidCode(files[candidate])) {
      return { file: candidate, isSelfMounting: false };
    }
  }

  // 3. Fallback: first .tsx/.jsx file with valid-looking content
  const keys = Object.keys(files);
  const fallback =
    keys.find((k) => k.endsWith(".tsx") && !k.includes("config") && k !== "__entry__.tsx" && looksLikeValidCode(files[k])) ??
    keys.find((k) => k.endsWith(".jsx") && !k.includes("config") && looksLikeValidCode(files[k])) ??
    null;

  if (fallback) {
    return { file: fallback, isSelfMounting: false };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Detect bare npm specifiers
// ---------------------------------------------------------------------------

function isBareSpecifier(path: string): boolean {
  if (path.startsWith(".") || path.startsWith("/") || path.startsWith("@/")) {
    return false;
  }
  if (path.startsWith("@") && path.includes("/")) return true;
  return !path.includes(":");
}

// ---------------------------------------------------------------------------
// File filtering — KEY-BASED ONLY, no content validation
// ---------------------------------------------------------------------------

/** Extensions that esbuild can actually bundle */
const BUNDLEABLE_EXT = [".tsx", ".ts", ".jsx", ".js", ".css", ".json"];

/** Config/build files that should NOT be bundled */
const SKIP_PATTERNS = [
  "vite.config", "tsconfig", "postcss.config", "tailwind.config",
  "next.config", "jest.config", "babel.config", "eslint",
  "package.json", "package-lock.json",
];

function shouldIncludeFile(key: string): boolean {
  // Must have a file extension
  if (!key.includes(".")) return false;

  // Skip CDATA entries (shell commands from artifact parser)
  if (key.includes("CDATA")) return false;

  // Skip HTML files
  if (key.endsWith(".html") || key.endsWith(".htm")) return false;

  // Skip config/build files
  const lower = key.toLowerCase();
  for (const pattern of SKIP_PATTERNS) {
    if (lower.includes(pattern)) return false;
  }

  // Skip non-bundleable extensions
  if (!BUNDLEABLE_EXT.some((ext) => key.endsWith(ext))) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Build the normalized file map
// ---------------------------------------------------------------------------

function normalizeFileMap(files: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(files)) {
    if (!shouldIncludeFile(key)) continue;
    result[stripPrefix(key)] = value;
  }
  return result;
}

// ---------------------------------------------------------------------------
// bundle()
// ---------------------------------------------------------------------------

export async function bundle(
  files: Record<string, string>
): Promise<BundleResult> {
  if (Object.keys(files).length === 0) {
    return {
      success: false, code: "", css: "", externals: [],
      errors: [{ text: "No files to bundle" }], warnings: [], entryPoint: "",
    };
  }

  // Normalize all file keys (strip src/, ./, etc.) and filter non-bundleable files
  const normalizedFiles = normalizeFileMap(files);

  if (Object.keys(normalizedFiles).length === 0) {
    return {
      success: false, code: "", css: "", externals: [],
      errors: [{ text: "No bundleable code files found" }], warnings: [], entryPoint: "",
    };
  }

  const entryInfo = detectEntryPoint(normalizedFiles);
  if (!entryInfo) {
    // Debug: log what files we have so we can diagnose
    const fileKeys = Object.keys(normalizedFiles).join(", ");
    return {
      success: false, code: "", css: "", externals: [],
      errors: [{ text: `No entry point found. Available files: ${fileKeys}` }],
      warnings: [], entryPoint: "",
    };
  }

  await ensureInitialized();

  let entryPoint: string;
  // Remove files with invalid content from the map before esbuild sees them.
  // This prevents parse errors when something imports a garbage file (e.g. main.tsx starting with "!").
  const allFiles: Record<string, string> = {};
  for (const [key, content] of Object.entries(normalizedFiles)) {
    if (key.endsWith(".css") || key.endsWith(".json") || looksLikeValidCode(content)) {
      allFiles[key] = content;
    }
  }

  if (entryInfo.isSelfMounting) {
    // main.tsx/index.tsx already has createRoot — use it directly
    entryPoint = entryInfo.file;
  } else {
    // App.tsx needs a synthetic wrapper to mount it — includes Error Boundary
    const ENTRY_KEY = "__entry__.tsx";
    allFiles[ENTRY_KEY] = `
import { createRoot } from "react-dom/client";
import { Component } from "react";
import * as _M from "./${entryInfo.file}";

const App = _M.default || _M.App || _M.Main || Object.values(_M).find(v => typeof v === "function") || (() => null);

class EB extends Component {
  constructor(props) { super(props); this.state = { error: null, info: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    window.parent.postMessage({
      type: "preview-error",
      error: { message: error.message, stack: error.stack }
    }, "*");
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:"24px",color:"#ff6b6b",fontFamily:"ui-monospace,monospace",fontSize:"13px",background:"#1a1a2e",minHeight:"100vh",overflow:"auto"}}>
          <div style={{marginBottom:"16px",fontSize:"15px",fontWeight:600,color:"#ff8a8a"}}>Runtime Error</div>
          <pre style={{whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0,lineHeight:1.6,color:"#ff6b6b"}}>{this.state.error.message}</pre>
          <pre style={{whiteSpace:"pre-wrap",wordBreak:"break-word",margin:"12px 0 0",lineHeight:1.4,color:"#666",fontSize:"11px"}}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(<EB><App /></EB>);
`;
    entryPoint = ENTRY_KEY;
  }

  const externals = new Set<string>();

  // Collect CSS files to inject even if not explicitly imported
  const cssFiles = Object.keys(normalizedFiles).filter((k) => k.endsWith(".css"));

  try {
    const result = await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      format: "esm",
      jsx: "automatic",
      jsxImportSource: "react",
      target: "es2020",
      write: false,
      outdir: "/out",
      sourcemap: "inline",
      minify: false,
      logLevel: "silent",
      plugins: [
        {
          name: "virtual-fs",
          setup(build) {
            build.onResolve({ filter: /.*/ }, (args) => {
              const raw = args.path;

              // 1. Direct lookup (handles entry point + bare file names)
              const stripped = stripPrefix(raw);
              const direct = resolveInMap(stripped, allFiles);
              if (direct) {
                return { path: direct, namespace: "virtual" };
              }

              // 2. Relative import — resolve against importer's directory
              if (raw.startsWith("./") || raw.startsWith("../")) {
                const importerDir = args.resolveDir || "";
                const joined = joinPaths(importerDir, raw);
                const resolved = resolveInMap(joined, allFiles);
                if (resolved) {
                  return { path: resolved, namespace: "virtual" };
                }
              }

              // 3. Asset file (image, font, video, etc.) → virtual placeholder
              if (ASSET_EXTENSIONS.some((ext) => raw.toLowerCase().endsWith(ext))) {
                return { path: raw, namespace: "asset" };
              }

              // 4. Bare npm specifier → external (track full specifier for exact import map entries)
              if (isBareSpecifier(raw)) {
                externals.add(raw);
                return { path: raw, external: true };
              }

              // 5. Fallback
              return { path: raw, external: true };
            });

            // Asset loader — returns a placeholder SVG data URL for images,
            // empty string for other asset types
            build.onLoad({ filter: /.*/, namespace: "asset" }, (args) => {
              const p = args.path.toLowerCase();
              let placeholder: string;
              if (p.endsWith(".svg")) {
                placeholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239CA3AF' font-size='14'%3E${encodeURIComponent(args.path.split("/").pop() ?? "image")}%3C/text%3E%3C/svg%3E`;
              } else if (ASSET_EXTENSIONS.slice(0, 8).some((ext) => p.endsWith(ext))) {
                // Image placeholder — 1x1 transparent PNG
                placeholder = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==";
              } else {
                placeholder = "";
              }
              return {
                contents: `export default "${placeholder}";`,
                loader: "js",
              };
            });

            build.onLoad({ filter: /.*/, namespace: "virtual" }, (args) => {
              const content = allFiles[args.path];
              if (content === undefined) {
                return { errors: [{ text: `File not found: ${args.path}` }] };
              }
              return {
                contents: content,
                loader: getLoader(args.path),
                resolveDir: dirOf(args.path),
              };
            });
          },
        },
      ],
    });

    let jsCode = "";
    let cssCode = "";

    for (const file of result.outputFiles) {
      if (file.path.endsWith(".css")) {
        cssCode += file.text;
      } else {
        jsCode += file.text;
      }
    }

    // Inject standalone CSS that wasn't imported
    for (const cssFile of cssFiles) {
      const content = normalizedFiles[cssFile];
      if (content && !cssCode.includes(content.trim().slice(0, 50))) {
        cssCode += "\n" + content;
      }
    }

    return {
      success: true,
      code: jsCode,
      css: cssCode,
      externals: Array.from(externals),
      errors: [],
      warnings: result.warnings.map((w) => w.text),
      entryPoint: entryInfo.file,
    };
  } catch (err: unknown) {
    const buildErrors: BundleError[] = [];

    if (err && typeof err === "object" && "errors" in err) {
      const esbuildErr = err as {
        errors: Array<{ text: string; location?: { file: string; line: number; column: number } }>;
      };
      for (const e of esbuildErr.errors) {
        buildErrors.push({
          text: e.text,
          location: e.location
            ? { file: e.location.file, line: e.location.line, column: e.location.column }
            : undefined,
        });
      }
    } else {
      buildErrors.push({
        text: err instanceof Error ? err.message : String(err),
      });
    }

    return {
      success: false, code: "", css: "",
      externals: Array.from(externals),
      errors: buildErrors, warnings: [], entryPoint: entryInfo.file,
    };
  }
}
