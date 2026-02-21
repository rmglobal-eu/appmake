export interface PerfIssue {
  line: number;
  message: string;
  severity: "warning" | "info";
  rule: string;
}

export interface PerfAnalysisResult {
  issues: PerfIssue[];
  estimatedBundleImpact: "low" | "medium" | "high";
}

// Heavy packages that significantly increase bundle size
const HEAVY_PACKAGES: Record<string, string> = {
  "moment": "Consider using 'dayjs' or 'date-fns' — moment.js is 300KB+ and tree-shaking doesn't work",
  "lodash": "Import specific functions: 'lodash/debounce' instead of 'lodash' to avoid importing the entire 70KB+ library",
  "jquery": "jQuery is unnecessary with React — use native DOM APIs or React refs instead",
  "three": "three.js is 600KB+ — ensure you're using tree-shaking and lazy loading",
  "chart.js": "Consider 'recharts' or 'lightweight-charts' for smaller bundle size",
  "antd": "Import specific components: 'antd/es/Button' to avoid importing the entire library",
  "material-ui": "Use tree-shakeable imports: '@mui/material/Button' not '@mui/material'",
  "@mui/material": "Use tree-shakeable imports: '@mui/material/Button' not '@mui/material'",
};

export function analyzePerformance(code: string): PerfAnalysisResult {
  const issues: PerfIssue[] = [];
  const lines = code.split("\n");
  let bundleImpact: "low" | "medium" | "high" = "low";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (line.trim().startsWith("//")) continue;

    // Check for heavy package imports
    for (const [pkg, suggestion] of Object.entries(HEAVY_PACKAGES)) {
      const importPattern = new RegExp(`from\\s+['"]${pkg.replace("/", "\\/")}['"]`);
      if (importPattern.test(line)) {
        issues.push({
          line: lineNum,
          message: suggestion,
          severity: "warning",
          rule: "heavy-package",
        });
        bundleImpact = "high";
      }
    }

    // Wildcard imports
    if (/import\s+\*\s+as\s+\w+\s+from/.test(line)) {
      issues.push({
        line: lineNum,
        message: "Wildcard import (*) prevents tree-shaking — import only what you need",
        severity: "warning",
        rule: "no-wildcard-import",
      });
      if (bundleImpact === "low") bundleImpact = "medium";
    }

    // Inline function in JSX (re-created every render)
    if (/onClick=\{?\s*\(\)\s*=>/.test(line) || /onChange=\{?\s*\(e\)\s*=>/.test(line)) {
      // This is very common and not always a problem, so just info
      // Only flag if it's in a .map() or similar
    }

    // Large inline objects in JSX (re-created every render)
    if (/style=\{\{[^}]{100,}\}\}/.test(line)) {
      issues.push({
        line: lineNum,
        message: "Large inline style object is re-created every render — hoist to a constant outside the component",
        severity: "info",
        rule: "no-large-inline-style",
      });
    }

    // setState inside useEffect without cleanup
    if (/useEffect\(\s*\(\)\s*=>/.test(line)) {
      const effectBody = lines.slice(i, Math.min(i + 20, lines.length)).join("\n");
      if (/setInterval\(/.test(effectBody) && !/clearInterval/.test(effectBody)) {
        issues.push({
          line: lineNum,
          message: "setInterval in useEffect without cleanup (clearInterval in return) — this causes memory leaks",
          severity: "warning",
          rule: "effect-cleanup",
        });
      }
      if (/setTimeout\(/.test(effectBody) && !/clearTimeout/.test(effectBody)) {
        issues.push({
          line: lineNum,
          message: "setTimeout in useEffect without cleanup — consider clearing on unmount",
          severity: "info",
          rule: "effect-cleanup",
        });
      }
    }

    // Detect missing key in .map()
    if (/\.map\s*\(/.test(line)) {
      const mapBlock = lines.slice(i, Math.min(i + 10, lines.length)).join("\n");
      if (/return\s*\(?\s*</.test(mapBlock) && !/key=/.test(mapBlock)) {
        issues.push({
          line: lineNum,
          message: "Missing key prop in .map() — React needs unique keys for efficient re-rendering",
          severity: "warning",
          rule: "missing-key",
        });
      }
    }
  }

  return {
    issues,
    estimatedBundleImpact: bundleImpact,
  };
}
