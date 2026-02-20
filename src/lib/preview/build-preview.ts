/**
 * Returns a script that injects hover highlight + click select + postMessage bridge
 * into the preview iframe for the visual editor.
 */
export function getVisualEditorBridgeScript(): string {
  return `
<script data-visual-editor-bridge>
(function() {
  var overlay = null;
  var selectedOverlay = null;
  var selectedEl = null;

  function createOverlay(color, zIndex) {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;pointer-events:none;z-index:' + zIndex + ';border:2px solid ' + color + ';border-radius:3px;transition:all 0.1s ease;display:none;';
    document.body.appendChild(el);
    return el;
  }

  function positionOverlay(el, target) {
    var rect = target.getBoundingClientRect();
    el.style.left = rect.left + 'px';
    el.style.top = rect.top + 'px';
    el.style.width = rect.width + 'px';
    el.style.height = rect.height + 'px';
    el.style.display = 'block';
  }

  function getXPath(el) {
    if (!el || el.nodeType !== 1) return '';
    var parts = [];
    while (el && el.nodeType === 1) {
      var idx = 1;
      var sib = el.previousSibling;
      while (sib) {
        if (sib.nodeType === 1 && sib.tagName === el.tagName) idx++;
        sib = sib.previousSibling;
      }
      parts.unshift(el.tagName.toLowerCase() + '[' + idx + ']');
      el = el.parentNode;
    }
    return '/' + parts.join('/');
  }

  function getComputedStyles(el) {
    var cs = window.getComputedStyle(el);
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

  overlay = createOverlay('#3b82f6', 99998);
  selectedOverlay = createOverlay('#8b5cf6', 99999);

  document.addEventListener('mousemove', function(e) {
    var target = e.target;
    if (!target || target === document.body || target === document.documentElement) {
      overlay.style.display = 'none';
      return;
    }
    if (target === selectedEl) return;
    positionOverlay(overlay, target);
  });

  document.addEventListener('mouseleave', function() {
    overlay.style.display = 'none';
  });

  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var target = e.target;
    if (!target || target === document.body || target === document.documentElement) return;

    selectedEl = target;
    positionOverlay(selectedOverlay, target);
    overlay.style.display = 'none';

    var rect = target.getBoundingClientRect();
    window.parent.postMessage({
      type: 'visual-editor-select',
      payload: {
        tagName: target.tagName.toLowerCase(),
        xpath: getXPath(target),
        text: (target.textContent || '').trim().slice(0, 200),
        styles: getComputedStyles(target),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      }
    }, '*');
  }, true);

  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'visual-editor-apply') return;
    var payload = e.data.payload;
    if (!selectedEl) return;

    if (payload.text !== undefined) {
      selectedEl.textContent = payload.text;
    }
    if (payload.styles) {
      for (var prop in payload.styles) {
        selectedEl.style[prop] = payload.styles[prop];
      }
    }

    var rect = selectedEl.getBoundingClientRect();
    positionOverlay(selectedOverlay, selectedEl);

    window.parent.postMessage({
      type: 'visual-editor-updated',
      payload: {
        tagName: selectedEl.tagName.toLowerCase(),
        xpath: getXPath(selectedEl),
        text: (selectedEl.textContent || '').trim().slice(0, 200),
        styles: getComputedStyles(selectedEl),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      }
    }, '*');
  });
})();
</script>`;
}

/**
 * Builds a self-contained HTML page from generated files
 * that renders in an iframe via srcdoc.
 *
 * Uses native <script src> tags (no dynamic JS loading) for maximum reliability.
 * Babel standalone auto-transforms <script type="text/babel"> on DOMContentLoaded.
 */

export function buildPreviewHtml(files: Record<string, string>, visualEditorMode?: boolean): string | null {
  if (Object.keys(files).length === 0) return null;

  // Collect CSS (strip @tailwind directives — CDN handles it)
  let css = "";
  for (const [path, content] of Object.entries(files)) {
    if (!path.endsWith(".css")) continue;
    css += content
      .replace(/@tailwind\s+[^;]+;/g, "")
      .replace(/@import\s+[^;]+;/g, "")
      .trim() + "\n";
  }

  // Plain HTML project?
  const htmlFile = Object.entries(files).find(([p]) => p.endsWith(".html"));
  const hasJsx = Object.keys(files).some((p) => /\.(tsx|jsx)$/.test(p));
  if (!hasJsx && htmlFile) return htmlFile[1];

  // Gather component files — exclude entry points and configs
  const sorted = Object.entries(files)
    .filter(([p]) =>
      /\.(tsx|jsx|ts|js)$/.test(p) &&
      !p.includes(".config") &&
      !/(?:^|\/)(?:index|main)\.(tsx|jsx|ts|js)$/.test(p)
    )
    .sort(([a], [b]) => {
      const aIsApp = /App\.(tsx|jsx|ts|js)$/.test(a);
      const bIsApp = /App\.(tsx|jsx|ts|js)$/.test(b);
      if (aIsApp) return 1;
      if (bIsApp) return -1;
      return 0;
    });

  const codeBlocks: string[] = [];
  for (const [, content] of sorted) {
    const stripped = stripImportsExports(content);
    if (stripped) codeBlocks.push(stripped);
  }

  if (codeBlocks.length === 0) return null;

  const allCode = codeBlocks.join("\n\n");

  const bridgeScript = visualEditorMode ? getVisualEditorBridgeScript() : "";
  const errorBridgeScript = getErrorBridgeScript();

  // Escape </script> in user code to prevent breaking out of the script tag
  const escapedCode = escapeForScriptTag(
    `const {useState,useEffect,useRef,useCallback,useMemo,useReducer,useContext,createContext,Fragment,memo,forwardRef} = React;\n\n${allCode}\n\ntry {\n  const root = document.getElementById("root");\n  if (typeof App !== "undefined") {\n    ReactDOM.createRoot(root).render(React.createElement(App));\n  } else {\n    root.innerHTML = '<div style="padding:2rem;font-family:system-ui;color:#6b7280;text-align:center"><p>No App component found</p></div>';\n  }\n} catch(e) {\n  document.getElementById("root").innerHTML = '<div style="padding:2rem;font-family:monospace;color:#ef4444"><b>Render Error</b><pre style="margin-top:8px;white-space:pre-wrap">' + e.message + '</pre></div>';\n  console.error("Render error:", e);\n}`
  );

  // Build HTML with native script tags — browser handles loading order
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{min-height:100vh;background:#ffffff}
body{font-family:system-ui,-apple-system,sans-serif;color:#111}
#__loading{display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#999;font-size:14px}
#__loading .spinner{width:20px;height:20px;border:2px solid #e5e7eb;border-top-color:#6366f1;border-radius:50%;animation:spin .6s linear infinite;margin-right:10px}
@keyframes spin{to{transform:rotate(360deg)}}
${css}
</style>
<!-- React + ReactDOM + Babel: native script tags, browser loads in order -->
<script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
<script src="https://unpkg.com/@babel/standalone@7/babel.min.js"><\/script>
<!-- Tailwind: async so it never blocks rendering -->
<script src="https://cdn.tailwindcss.com" async><\/script>
</head>
<body>
<div id="__loading"><div class="spinner"></div>Loading preview...</div>
<div id="root"></div>
<!-- User code stored as plain text (browser won't execute it) -->
<script type="text/plain" id="__appcode">
${escapedCode}
<\/script>
<!-- After Babel loads, manually transform + execute user code -->
<script>
(function() {
  var loading = document.getElementById('__loading');

  function showError(msg) {
    if (loading) {
      loading.innerHTML = '<div style="padding:2rem;color:#ef4444;font-family:monospace;max-width:600px;text-align:left"><h3 style="margin-bottom:8px">Preview Error</h3><pre style="white-space:pre-wrap;font-size:12px;background:#fef2f2;padding:12px;border-radius:6px;border:1px solid #fecaca">' + msg + '</pre></div>';
    }
  }

  // Check if essential libs loaded
  if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
    showError('React failed to load. Check your internet connection.');
    return;
  }
  if (typeof Babel === 'undefined') {
    showError('Babel failed to load. Check your internet connection.');
    return;
  }

  // Hide loading indicator
  if (loading) loading.style.display = 'none';

  // Read user code from the text/plain script tag
  var codeEl = document.getElementById('__appcode');
  if (!codeEl) { showError('No code found.'); return; }
  var code = codeEl.textContent || '';

  // Replace top-level const/let with var BEFORE Babel transform
  // so duplicate declarations across concatenated files don't cause parse errors.
  // Only matches unindented (top-level) declarations.
  code = code.replace(/^(export\\s+)?(const|let) /gm, 'var ');

  try {
    // Transform with typescript + react presets
    var result = Babel.transform(code, {
      presets: ['typescript', 'react'],
      filename: 'app.tsx'
    });
    // Execute the transformed code
    var fn = new Function(result.code);
    fn();
  } catch(e) {
    showError(e.message || String(e));
    console.error('Preview error:', e);
  }
})();
<\/script>
${errorBridgeScript}
${bridgeScript}
</body>
</html>`;
}

/**
 * Injects error + console bridge into the preview iframe.
 * Sends postMessage events to the parent for error tracking and console capture.
 */
function getErrorBridgeScript(): string {
  return `
<script data-error-bridge>
(function() {
  var msgId = 0;
  function send(type, payload) {
    try { window.parent.postMessage({ type: type, payload: payload, _id: ++msgId }, '*'); } catch(e) {}
  }

  // Capture runtime errors
  window.onerror = function(message, source, line, col) {
    send('preview-error', { message: String(message), source: source, line: line, col: col });
  };

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', function(e) {
    send('preview-error', { message: 'Unhandled rejection: ' + String(e.reason) });
  });

  // Override console methods to forward to parent
  var origLog = console.log;
  var origWarn = console.warn;
  var origError = console.error;
  var origInfo = console.info;

  function capture(level, origFn) {
    return function() {
      var args = [];
      for (var i = 0; i < arguments.length; i++) {
        try { args.push(typeof arguments[i] === 'object' ? JSON.stringify(arguments[i]) : String(arguments[i])); }
        catch(e) { args.push('[object]'); }
      }
      send('preview-console', { level: level, args: args });
      if (level === 'error') {
        send('preview-error', { message: args.join(' ') });
      }
      origFn.apply(console, arguments);
    };
  }

  console.log = capture('log', origLog);
  console.warn = capture('warn', origWarn);
  console.error = capture('error', origError);
  console.info = capture('info', origInfo);
})();
<\/script>`;
}

/**
 * Escape code for embedding inside a <script> tag in HTML.
 * Prevents </script> in user code from breaking the HTML parser.
 */
function escapeForScriptTag(code: string): string {
  return code.replace(/<\/(script)/gi, "<\\/$1");
}

/**
 * Strip import/export statements so all code can run in a single scope.
 * TypeScript is handled by Babel's typescript preset — no regex stripping needed.
 */
function stripImportsExports(code: string): string | null {
  let r = code;

  // Remove import statements
  r = r.replace(/^import\s[\s\S]*?from\s+['"][^'"]*['"];?\s*$/gm, "");
  r = r.replace(/^import\s+['"][^'"]*['"];?\s*$/gm, "");

  // Convert exports to plain declarations
  r = r.replace(/^export\s+default\s+function\s+/gm, "function ");
  r = r.replace(/^export\s+default\s+class\s+/gm, "class ");
  r = r.replace(/^export\s+default\s+\w+;?\s*$/gm, "");
  r = r.replace(/^export\s*\{[^}]*\};?\s*$/gm, "");
  r = r.replace(/^export\s+(const|let|var|function|class|enum|interface|type)\s/gm, "$1 ");

  return r.trim() || null;
}

/**
 * Collect npm package names from import statements across all files.
 */
function collectNpmImports(files: Record<string, string>): string[] {
  const pkgs = new Set<string>();
  for (const content of Object.values(files)) {
    const matches = content.matchAll(
      /(?:import\s+[\s\S]*?from\s+|import\s+|require\s*\(\s*)['"]([^'"./][^'"]*)['"]/g
    );
    for (const match of matches) {
      const pkg = match[1];
      const basePkg = pkg.startsWith("@")
        ? pkg.split("/").slice(0, 2).join("/")
        : pkg.split("/")[0];
      // Skip react/react-dom — loaded via UMD
      if (basePkg === "react" || basePkg === "react-dom") continue;
      pkgs.add(basePkg);
    }
  }
  return Array.from(pkgs);
}
