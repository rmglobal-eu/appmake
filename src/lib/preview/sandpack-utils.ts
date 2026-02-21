import type { SandpackFiles } from "@codesandbox/sandpack-react";

/**
 * Auto-inject missing React imports for old code that relied on React being global.
 * Detects usage of React hooks, React.createElement, etc. and adds the import if missing.
 */
function ensureReactImports(content: string): string {
  // If the file already imports from 'react', check if it's missing specific hooks
  const hasReactImport = /import\s+[\s\S]*?from\s+['"]react['"]/.test(content);

  // Hooks that need to be imported from 'react'
  const hooks = [
    "useState",
    "useEffect",
    "useRef",
    "useCallback",
    "useMemo",
    "useReducer",
    "useContext",
    "useLayoutEffect",
    "useId",
    "useDeferredValue",
    "useTransition",
    "useSyncExternalStore",
    "useImperativeHandle",
    "useDebugValue",
    "Fragment",
    "createContext",
    "forwardRef",
    "memo",
    "lazy",
    "Suspense",
  ];

  // Find which hooks/identifiers are used but not imported
  const usedHooks: string[] = [];
  for (const hook of hooks) {
    // Check if used in code (as function call or JSX reference)
    const usagePattern = new RegExp(`\\b${hook}\\b`);
    if (usagePattern.test(content)) {
      // Check if already imported
      const importPattern = new RegExp(
        `import\\s+\\{[^}]*\\b${hook}\\b[^}]*\\}\\s+from\\s+['"]react['"]`
      );
      if (!importPattern.test(content)) {
        usedHooks.push(hook);
      }
    }
  }

  // Check for bare `React.` usage without React import
  const usesReactDot = /\bReact\./.test(content);
  const hasDefaultReactImport =
    /import\s+React[\s,]/.test(content) || /import\s+\*\s+as\s+React/.test(content);

  if (usedHooks.length === 0 && (!usesReactDot || hasDefaultReactImport)) {
    return content;
  }

  if (hasReactImport) {
    // There's an existing `import { ... } from 'react'` — augment it
    if (usedHooks.length > 0) {
      content = content.replace(
        /import\s+\{([^}]*)\}\s+from\s+['"]react['"]/,
        (match, existing) => {
          const existingNames = existing.split(",").map((s: string) => s.trim()).filter(Boolean);
          const newNames = usedHooks.filter((h) => !existingNames.includes(h));
          if (newNames.length === 0) return match;
          return `import { ${[...existingNames, ...newNames].join(", ")} } from 'react'`;
        }
      );
    }
  } else {
    // No React import at all — add one
    const parts: string[] = [];
    if (usesReactDot && !hasDefaultReactImport) {
      parts.push("React");
    }
    const namedPart = usedHooks.length > 0 ? `{ ${usedHooks.join(", ")} }` : "";
    const defaultPart = parts.length > 0 ? parts[0] : "";

    let importLine: string;
    if (defaultPart && namedPart) {
      importLine = `import ${defaultPart}, ${namedPart} from 'react';`;
    } else if (defaultPart) {
      importLine = `import ${defaultPart} from 'react';`;
    } else {
      importLine = `import ${namedPart} from 'react';`;
    }

    content = importLine + "\n" + content;
  }

  return content;
}

/**
 * Ensure a source file has proper module exports for Sandpack.
 * Old pre-Sandpack code used single-scope (no exports). This patches:
 * - Adds `export default X` if file has a top-level function/class but no export default
 * - Converts bare `function X()` / `class X` to `export default function X()` for App files
 */
function ensureModuleExports(content: string, filePath: string): string {
  // Already has export default — nothing to do
  if (/export\s+default\b/.test(content)) return content;

  // Detect the main component/function name in this file
  const isAppFile = /\/App\.(tsx|jsx|ts|js)$/.test(filePath);
  const fileName = filePath.split("/").pop()!.replace(/\.(tsx|jsx|ts|js)$/, "");

  // If no exports at all, try to add them
  const hasAnyExport = /^export\s/m.test(content);

  if (isAppFile) {
    // For App files: find `function App(` and make it `export default function App(`
    const appFnPattern = /^(function\s+App\s*\()/m;
    if (appFnPattern.test(content)) {
      return content.replace(appFnPattern, "export default $1");
    }
    // Also try `const App =`
    const appConstPattern = /^(const\s+App\s*=)/m;
    if (appConstPattern.test(content)) {
      content = content.replace(appConstPattern, "export default $1");
      // `export default const` is not valid JS — use separate export
      content = content.replace("export default const App =", "const App =");
      return content + "\nexport default App;\n";
    }
    // Fallback: append export default
    return content + "\nexport default App;\n";
  }

  // For non-App component files: export the main component as default
  if (!hasAnyExport) {
    // Try to find and export the main function/class matching the filename
    const fnPattern = new RegExp(`^(function\\s+${fileName}\\s*\\()`, "m");
    if (fnPattern.test(content)) {
      return content.replace(fnPattern, `export default $1`);
    }
    const classPattern = new RegExp(`^(class\\s+${fileName}\\b)`, "m");
    if (classPattern.test(content)) {
      return content.replace(classPattern, `export default $1`);
    }
    // Try const component
    const constPattern = new RegExp(`^(const\\s+${fileName}\\s*=)`, "m");
    if (constPattern.test(content)) {
      return content + `\nexport default ${fileName};\n`;
    }
  }

  return content;
}

/**
 * Extract npm dependencies from import statements across all files.
 * Returns Record<string, "latest"> for Sandpack's customSetup.dependencies.
 * Skips react/react-dom (included in Sandpack's react template).
 */
export function extractDependencies(
  files: Record<string, string>
): Record<string, string> {
  const deps: Record<string, string> = {};

  for (const content of Object.values(files)) {
    const importRegex =
      /(?:import\s+[\s\S]*?from\s+|import\s+|require\s*\(\s*)['"]([^'"./][^'"]*)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const raw = match[1];
      const basePkg = raw.startsWith("@")
        ? raw.split("/").slice(0, 2).join("/")
        : raw.split("/")[0];

      if (basePkg === "react" || basePkg === "react-dom") continue;
      if (!deps[basePkg]) deps[basePkg] = "latest";
    }
  }

  return deps;
}

/**
 * Convert editor store's generatedFiles to Sandpack file format.
 * - Adds `/` prefix to all file paths
 * - Generates a hidden `/index.tsx` entry point
 * - Strips @tailwind/@import directives from CSS
 * - Optionally includes visual editor bridge module
 */
export function toSandpackFiles(
  generatedFiles: Record<string, string>,
  visualEditorMode: boolean
): SandpackFiles {
  const files: SandpackFiles = {};

  // Collect CSS file paths for importing in entry point
  const cssImports: string[] = [];

  // Collect all component files (non-CSS, non-config) for auto-import into App
  const componentFiles: string[] = [];

  for (const [path, content] of Object.entries(generatedFiles)) {
    // Normalize path: ensure leading /, strip any src/ prefix.
    // Sandpack react-ts template uses ROOT paths: /App.tsx, /index.tsx (NOT /src/)
    const normalizedPath = "/" + path.replace(/^\/?(src\/)?/, "");

    if (normalizedPath.endsWith(".css")) {
      // Strip @tailwind and @import directives (Sandpack handles Tailwind via CDN)
      const strippedCss = content
        .replace(/@tailwind\s+[^;]+;/g, "")
        .replace(/@import\s+[^;]+;/g, "")
        .trim();
      files[normalizedPath] = { code: strippedCss };
      cssImports.push(normalizedPath);
    } else {
      let processed = content;

      // Ensure .tsx/.jsx/.ts/.js files have proper imports and exports for the module system.
      // Old code (pre-Sandpack) used single-scope with no imports/exports — patch both.
      if (/\.(tsx|jsx|ts|js)$/.test(normalizedPath)) {
        processed = ensureReactImports(processed);
        processed = ensureModuleExports(processed, normalizedPath);

        // Track non-App component files for potential auto-import
        if (!/(?:^|\/)App\.(tsx|jsx|ts|js)$/.test(normalizedPath) &&
            !/(?:^|\/)(?:index|main)\.(tsx|jsx|ts|js)$/.test(normalizedPath) &&
            !normalizedPath.includes(".config")) {
          componentFiles.push(normalizedPath);
        }
      }

      files[normalizedPath] = { code: processed };
    }
  }

  // If App file exists but doesn't import its sibling components, inject imports.
  // This handles old code where all files shared a single scope (no imports).
  const appPath = Object.keys(files).find((p) =>
    /\/App\.(tsx|jsx|ts|js)$/.test(p)
  );
  if (appPath) {
    const appFile = files[appPath] as { code: string };
    let appContent = appFile.code;
    const missingImports: string[] = [];
    for (const compPath of componentFiles) {
      const compName = compPath
        .split("/")
        .pop()!
        .replace(/\.(tsx|jsx|ts|js)$/, "");
      // Only inject if the component name is used in App but not imported
      if (
        appContent.includes(compName) &&
        !appContent.includes(`from`) // no imports at all
      ) {
        const relPath = "." + compPath.replace(/\.(tsx|jsx|ts|js)$/, "");
        missingImports.push(`import ${compName} from "${relPath}";`);
      }
    }
    if (missingImports.length > 0) {
      appContent = missingImports.join("\n") + "\n\n" + appContent;
      files[appPath] = { code: appContent };
    }
  }

  // Include visual editor bridge module if needed
  if (visualEditorMode) {
    files["/__bridge.ts"] = { code: getVisualEditorBridgeModule() };
  }

  // Always include error overlay bridge for "Fix with AI" in-iframe button
  files["/__error-bridge.ts"] = { code: getErrorOverlayBridgeModule() };

  // Override template's /index.tsx entry point to include CSS + bridge imports
  const cssImportLines = cssImports
    .map((p) => `import ".${p}";`)
    .join("\n");
  const bridgeImport = visualEditorMode ? 'import "./__bridge";\n' : "";

  files["/index.tsx"] = {
    code: `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
${cssImportLines}
${bridgeImport}import "./__error-bridge";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
`,
    hidden: true,
  };

  // Provide HTML and config since we're not using a template
  files["/public/index.html"] = {
    code: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Preview</title></head>
<body><div id="root"></div></body>
</html>`,
    hidden: true,
  };

  files["/tsconfig.json"] = {
    code: JSON.stringify({
      compilerOptions: {
        jsx: "react-jsx",
        module: "esnext",
        moduleResolution: "node",
        esModuleInterop: true,
        strict: false,
        target: "es2020",
      },
    }),
    hidden: true,
  };

  files["/package.json"] = {
    code: JSON.stringify({
      main: "/index.tsx",
      dependencies: {
        react: "^18",
        "react-dom": "^18",
      },
    }),
    hidden: true,
  };

  return files;
}

/**
 * Compute a stable hash string from dependency keys to use as a React key.
 * When deps change, SandpackProvider remounts to install new packages.
 */
export function depsHash(deps: Record<string, string>): string {
  return Object.keys(deps).sort().join(",");
}

/**
 * Error overlay bridge as an ES module.
 * Catches runtime errors and shows an inline overlay with a "Fix with AI" button
 * that sends a postMessage to the parent frame.
 */
export function getErrorOverlayBridgeModule(): string {
  return `
function renderErrorOverlay(title: string, message: string, stack?: string) {
  const existing = document.getElementById("__error-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "__error-overlay";
  overlay.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;";

  const card = document.createElement("div");
  card.style.cssText = "background:#1a1a2e;border:1px solid #ef4444;border-radius:12px;max-width:520px;width:90%;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.5);";

  const header = document.createElement("div");
  header.style.cssText = "background:#dc2626;padding:10px 16px;display:flex;align-items:center;gap:8px;";
  header.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><span style="color:white;font-size:13px;font-weight:600;">' + title + "</span>";

  const body = document.createElement("div");
  body.style.cssText = "padding:16px;";

  const msg = document.createElement("p");
  msg.style.cssText = "color:#fca5a5;font-size:13px;font-family:ui-monospace,monospace;word-break:break-word;margin:0 0 12px 0;line-height:1.5;";
  msg.textContent = message;
  body.appendChild(msg);

  if (stack) {
    const details = document.createElement("details");
    details.style.cssText = "margin-bottom:12px;";
    const summary = document.createElement("summary");
    summary.style.cssText = "color:#9ca3af;font-size:11px;cursor:pointer;user-select:none;";
    summary.textContent = "Stack trace";
    const pre = document.createElement("pre");
    pre.style.cssText = "color:#6b7280;font-size:10px;margin-top:6px;white-space:pre-wrap;overflow:auto;max-height:120px;background:#111;border-radius:6px;padding:8px;";
    pre.textContent = stack;
    details.appendChild(summary);
    details.appendChild(pre);
    body.appendChild(details);
  }

  const btn = document.createElement("button");
  btn.style.cssText = "background:#7c3aed;color:white;border:none;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;";
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>Fix with AI';
  btn.onmouseover = () => { btn.style.background = "#6d28d9"; };
  btn.onmouseout = () => { btn.style.background = "#7c3aed"; };
  btn.onclick = () => {
    btn.disabled = true;
    btn.innerHTML = '<span style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin .6s linear infinite;"></span>Fixing...';
    window.parent.postMessage({ type: "ghost-fix-request" }, "*");
  };
  body.appendChild(btn);

  card.appendChild(header);
  card.appendChild(body);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Add spin keyframe if not present
  if (!document.getElementById("__error-spin-style")) {
    const style = document.createElement("style");
    style.id = "__error-spin-style";
    style.textContent = "@keyframes spin{to{transform:rotate(360deg)}}";
    document.head.appendChild(style);
  }
}

// Listen for ghost-fix-success to remove overlay
window.addEventListener("message", (e) => {
  if (e.data && e.data.type === "ghost-fix-success") {
    const ov = document.getElementById("__error-overlay");
    if (ov) ov.remove();
  }
});

// Capture runtime errors
window.onerror = (message, source, line, col, error) => {
  const loc = source ? (source.split("/").pop() + (line ? ":" + line : "") + (col ? ":" + col : "")) : "";
  renderErrorOverlay(
    "Runtime Error" + (loc ? " — " + loc : ""),
    String(message),
    error?.stack?.slice(0, 500)
  );
};

// Capture unhandled promise rejections
window.addEventListener("unhandledrejection", (e) => {
  renderErrorOverlay(
    "Unhandled Rejection",
    String(e.reason),
    e.reason?.stack?.slice(0, 500)
  );
});
`;
}

/**
 * Visual editor bridge as an ES module.
 * Injects hover highlight + click select + postMessage bridge into the preview.
 */
export function getVisualEditorBridgeModule(): string {
  return `
let overlay: HTMLDivElement | null = null;
let selectedOverlay: HTMLDivElement | null = null;
let selectedEl: HTMLElement | null = null;

function createOverlay(color: string, zIndex: number): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = \`position:fixed;pointer-events:none;z-index:\${zIndex};border:2px solid \${color};border-radius:3px;transition:all 0.1s ease;display:none;\`;
  document.body.appendChild(el);
  return el;
}

function positionOverlay(el: HTMLDivElement, target: Element) {
  const rect = target.getBoundingClientRect();
  el.style.left = rect.left + "px";
  el.style.top = rect.top + "px";
  el.style.width = rect.width + "px";
  el.style.height = rect.height + "px";
  el.style.display = "block";
}

function getXPath(el: Element | null): string {
  if (!el || el.nodeType !== 1) return "";
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current.nodeType === 1) {
    let idx = 1;
    let sib = current.previousSibling;
    while (sib) {
      if (sib.nodeType === 1 && (sib as Element).tagName === current.tagName) idx++;
      sib = sib.previousSibling;
    }
    parts.unshift(current.tagName.toLowerCase() + "[" + idx + "]");
    current = current.parentElement;
  }
  return "/" + parts.join("/");
}

function getComputedStyles(el: Element) {
  const cs = window.getComputedStyle(el);
  return {
    color: cs.color,
    backgroundColor: cs.backgroundColor,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    fontFamily: cs.fontFamily,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    textAlign: cs.textAlign,
    padding: cs.padding,
    paddingTop: cs.paddingTop,
    paddingRight: cs.paddingRight,
    paddingBottom: cs.paddingBottom,
    paddingLeft: cs.paddingLeft,
    margin: cs.margin,
    marginTop: cs.marginTop,
    marginRight: cs.marginRight,
    marginBottom: cs.marginBottom,
    marginLeft: cs.marginLeft,
    borderRadius: cs.borderRadius,
    width: cs.width,
    height: cs.height,
  };
}

function getExtraData(el: HTMLElement) {
  const parent = el.parentElement;
  let siblingIndex = 0;
  if (parent) {
    const siblings = Array.from(parent.children);
    siblingIndex = siblings.indexOf(el);
  }
  const attrs: Record<string, string> = {};
  for (const attr of ["id", "href", "src", "placeholder", "alt", "title"]) {
    const val = el.getAttribute(attr);
    if (val) attrs[attr] = val;
  }
  return {
    className: el.className || "",
    parentTagName: parent ? parent.tagName.toLowerCase() : "",
    siblingIndex,
    attributes: attrs,
    outerHtmlSnippet: el.outerHTML.slice(0, 300),
    inlineStyle: el.getAttribute("style") || "",
  };
}

overlay = createOverlay("#3b82f6", 99998);
selectedOverlay = createOverlay("#8b5cf6", 99999);

document.addEventListener("mousemove", (e) => {
  const target = e.target as HTMLElement;
  if (!target || target === document.body || target === document.documentElement) {
    if (overlay) overlay.style.display = "none";
    return;
  }
  if (target === selectedEl) return;
  if (overlay) positionOverlay(overlay, target);
});

document.addEventListener("mouseleave", () => {
  if (overlay) overlay.style.display = "none";
});

document.addEventListener(
  "click",
  (e) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.target as HTMLElement;
    if (!target || target === document.body || target === document.documentElement) return;

    selectedEl = target;
    if (selectedOverlay) positionOverlay(selectedOverlay, target);
    if (overlay) overlay.style.display = "none";

    const rect = target.getBoundingClientRect();
    window.parent.postMessage(
      {
        type: "visual-editor-select",
        payload: {
          tagName: target.tagName.toLowerCase(),
          xpath: getXPath(target),
          text: (target.textContent || "").trim().slice(0, 200),
          styles: getComputedStyles(target),
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          ...getExtraData(target),
        },
      },
      "*"
    );
  },
  true
);

window.addEventListener("message", (e) => {
  if (!e.data || e.data.type !== "visual-editor-apply") return;
  const payload = e.data.payload;
  if (!selectedEl) return;

  if (payload.text !== undefined) {
    selectedEl.textContent = payload.text;
  }
  if (payload.styles) {
    for (const prop in payload.styles) {
      (selectedEl.style as any)[prop] = payload.styles[prop];
    }
  }

  if (selectedOverlay) positionOverlay(selectedOverlay, selectedEl);

  const rect = selectedEl.getBoundingClientRect();
  window.parent.postMessage(
    {
      type: "visual-editor-updated",
      payload: {
        tagName: selectedEl.tagName.toLowerCase(),
        xpath: getXPath(selectedEl),
        text: (selectedEl.textContent || "").trim().slice(0, 200),
        styles: getComputedStyles(selectedEl),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        ...getExtraData(selectedEl),
      },
    },
    "*"
  );
});
`;
}
