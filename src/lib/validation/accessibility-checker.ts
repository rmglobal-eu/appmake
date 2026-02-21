export interface A11yIssue {
  line: number;
  message: string;
  severity: "error" | "warning";
  rule: string;
}

export interface A11yCheckResult {
  valid: boolean;
  issues: A11yIssue[];
}

export function checkAccessibility(code: string): A11yCheckResult {
  const issues: A11yIssue[] = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comments
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;

    // img without alt
    if (/<img\s/.test(line) && !/alt=/.test(line) && !line.includes("/>")) {
      // Check if alt is on the next few lines
      const nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join(" ");
      if (!nextLines.includes("alt=")) {
        issues.push({
          line: lineNum,
          message: '<img> element must have an alt attribute for accessibility',
          severity: "error",
          rule: "img-alt",
        });
      }
    }

    // img with empty alt="" is OK (decorative), but check for it
    if (/<img\s/.test(line) && /alt=["']?["']/.test(line)) {
      // This is fine — decorative image
    }

    // Button without text content or aria-label
    if (/<button\s/.test(line) || /<Button\s/.test(line)) {
      const nextLines = lines.slice(i, Math.min(i + 3, lines.length)).join(" ");
      const hasAriaLabel = /aria-label=/.test(nextLines);
      const hasChildren = />([^<]+)</.test(nextLines);
      const hasSrOnly = /sr-only/.test(nextLines);

      if (!hasAriaLabel && !hasChildren && !hasSrOnly && /\/\s*>/.test(nextLines)) {
        issues.push({
          line: lineNum,
          message: 'Button must have visible text content or aria-label',
          severity: "warning",
          rule: "button-has-text",
        });
      }
    }

    // Input without label or aria-label
    if (/<input\s/.test(line) && !/type=["']hidden/.test(line)) {
      const nextLines = lines.slice(Math.max(0, i - 3), Math.min(i + 3, lines.length)).join(" ");
      const hasLabel = /htmlFor=/.test(nextLines) || /aria-label=/.test(line) || /aria-labelledby=/.test(line);
      const hasPlaceholder = /placeholder=/.test(line);

      if (!hasLabel && !hasPlaceholder) {
        issues.push({
          line: lineNum,
          message: 'Input should have an associated <label> or aria-label for accessibility',
          severity: "warning",
          rule: "input-has-label",
        });
      }
    }

    // Detect onClick on non-interactive elements (div, span, etc.)
    if (/onClick=/.test(line)) {
      const tagMatch = line.match(/<(div|span|p|li|td|tr|section|article)\s/);
      if (tagMatch) {
        const hasRole = /role=["'](button|link|tab|menuitem)/.test(line);
        const hasTabIndex = /tabIndex=/.test(line);
        if (!hasRole) {
          issues.push({
            line: lineNum,
            message: `onClick on <${tagMatch[1]}> — add role="button" and tabIndex={0} for keyboard accessibility`,
            severity: "warning",
            rule: "interactive-role",
          });
        }
      }
    }

    // Detect heading hierarchy issues (we track h1-h6 usage)
    const headingMatch = line.match(/<[hH]([1-6])\s/);
    if (headingMatch) {
      // Just note the usage — deep hierarchy analysis would need full-file context
    }

    // Detect missing form label
    if (/<form\s/.test(line) && !/aria-label/.test(line) && !/aria-labelledby/.test(line)) {
      issues.push({
        line: lineNum,
        message: 'Form should have an aria-label or aria-labelledby for screen readers',
        severity: "warning",
        rule: "form-has-label",
      });
    }

    // Detect outline-none without replacement focus style
    if (/outline-none/.test(line) || /outline:\s*none/.test(line)) {
      if (!/focus:ring/.test(line) && !/focus-visible:ring/.test(line) && !/focus:outline/.test(line)) {
        issues.push({
          line: lineNum,
          message: 'outline-none removes focus indicator — add a focus:ring or focus-visible:ring replacement',
          severity: "warning",
          rule: "focus-visible",
        });
      }
    }
  }

  return {
    valid: !issues.some((i) => i.severity === "error"),
    issues,
  };
}
