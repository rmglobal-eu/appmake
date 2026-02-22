import type { ImportMap } from "./import-map";

export interface PreviewHtmlOptions {
  code: string;
  css: string;
  importMap: ImportMap;
}

/**
 * Escape occurrences of </script> inside user code so they don't
 * prematurely close the host <script> tag.
 */
function escapeForScriptTag(code: string): string {
  return code.replace(/<\/script>/gi, "<\\/script>");
}

/**
 * Build a complete, self-contained HTML document for the preview iframe.
 *
 * Key design choices:
 * - Import map in <head> — resolves bare npm specifiers to esm.sh
 * - Tailwind CDN loaded async (non-blocking)
 * - Bundled code inlined in <script type="module"> (NOT as a blob URL,
 *   because import maps only apply to scripts in the document scope)
 * - Error handler and console interceptor post messages to the parent window
 * - Reset styles for a clean canvas
 */
export function buildPreviewHtml(options: PreviewHtmlOptions): string {
  const { code, css, importMap } = options;

  const escapedCode = escapeForScriptTag(code);
  const importMapJson = JSON.stringify(importMap, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<!-- Import Map: resolves bare specifiers to esm.sh -->
<script type="importmap">
${importMapJson}
</script>

<!-- Tailwind CSS (async, non-blocking) -->
<script src="https://cdn.tailwindcss.com" async></script>

<!-- Bundled CSS from esbuild -->
<style id="preview-css">
* { margin: 0; padding: 0; box-sizing: border-box; }
${css}
</style>

<!-- Error handler + Console interceptor -->
<script>
// --- Error handler ---
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

// --- Console interceptor ---
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

<!-- Bundled application code (inlined so import map applies) -->
<script type="module">
${escapedCode}

// Signal that the preview has loaded
window.parent.postMessage({ type: "preview-ready" }, "*");
</script>
</body>
</html>`;
}
