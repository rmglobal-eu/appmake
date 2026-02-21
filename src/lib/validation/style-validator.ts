export interface StyleIssue {
  line: number;
  message: string;
  severity: "error" | "warning";
}

export interface StyleValidationResult {
  valid: boolean;
  issues: StyleIssue[];
}

// Detect inline styles that should be Tailwind classes
const INLINE_STYLE_PATTERN = /style=\s*\{\s*\{/;

// Detect CSS module or styled-component imports (prefer Tailwind)
const CSS_MODULE_PATTERN = /import\s+\w+\s+from\s+['"].*\.module\.css['"]/;
const STYLED_COMPONENTS_PATTERN = /import\s+styled\s+from\s+['"]styled-components['"]/;
const EMOTION_PATTERN = /import\s+.*from\s+['"]@emotion\/(styled|css|react)['"]/;

// Common Tailwind class typos and invalid classes
const INVALID_TAILWIND_PREFIXES = [
  "colour-", "colours-", "text-colour-", "bg-colour-",
  "padding-", "margin-", "width-", "height-",
];

export function validateStyles(code: string): StyleValidationResult {
  const issues: StyleIssue[] = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Warn about inline styles
    if (INLINE_STYLE_PATTERN.test(line)) {
      issues.push({
        line: lineNum,
        message: "Prefer Tailwind CSS classes over inline styles for consistency",
        severity: "warning",
      });
    }

    // Warn about CSS modules
    if (CSS_MODULE_PATTERN.test(line)) {
      issues.push({
        line: lineNum,
        message: "CSS modules detected — prefer Tailwind CSS for consistency",
        severity: "warning",
      });
    }

    // Warn about styled-components
    if (STYLED_COMPONENTS_PATTERN.test(line) || EMOTION_PATTERN.test(line)) {
      issues.push({
        line: lineNum,
        message: "styled-components/emotion detected — prefer Tailwind CSS for consistency",
        severity: "warning",
      });
    }

    // Check for invalid Tailwind-like class names in className
    const classNameMatch = line.match(/className=["'`]([^"'`]+)["'`]/);
    if (classNameMatch) {
      const classes = classNameMatch[1].split(/\s+/);
      for (const cls of classes) {
        for (const prefix of INVALID_TAILWIND_PREFIXES) {
          if (cls.startsWith(prefix)) {
            issues.push({
              line: lineNum,
              message: `Invalid Tailwind class '${cls}' — did you mean a standard Tailwind utility?`,
              severity: "warning",
            });
          }
        }
      }
    }
  }

  return {
    valid: !issues.some((i) => i.severity === "error"),
    issues,
  };
}
