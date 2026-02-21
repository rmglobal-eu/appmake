export interface SecurityIssue {
  line: number;
  message: string;
  severity: "critical" | "warning" | "info";
  rule: string;
}

export interface SecurityScanResult {
  safe: boolean;
  issues: SecurityIssue[];
}

interface SecurityRule {
  id: string;
  pattern: RegExp;
  message: string;
  severity: "critical" | "warning" | "info";
  exceptions?: RegExp[];
}

const SECURITY_RULES: SecurityRule[] = [
  {
    id: "no-eval",
    pattern: /\beval\s*\(/,
    message: "eval() is a security risk — it executes arbitrary code. Use JSON.parse() or a safer alternative.",
    severity: "critical",
  },
  {
    id: "no-function-constructor",
    pattern: /new\s+Function\s*\(/,
    message: "new Function() is equivalent to eval() — avoid dynamic code execution.",
    severity: "critical",
  },
  {
    id: "no-innerhtml",
    pattern: /dangerouslySetInnerHTML/,
    message: "dangerouslySetInnerHTML can cause XSS — sanitize HTML with DOMPurify first.",
    severity: "warning",
  },
  {
    id: "no-innerhtml-dom",
    pattern: /\.innerHTML\s*=/,
    message: "Direct innerHTML assignment can cause XSS — use textContent or a sanitizer.",
    severity: "warning",
  },
  {
    id: "no-document-write",
    pattern: /document\.write\s*\(/,
    message: "document.write() can overwrite the entire page and enables XSS.",
    severity: "critical",
  },
  {
    id: "no-hardcoded-secrets",
    pattern: /(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{8,}['"]/i,
    message: "Possible hardcoded secret detected — use environment variables instead.",
    severity: "critical",
    exceptions: [/placeholder|example|xxx|your-|test|demo|sample/i],
  },
  {
    id: "no-http-urls",
    pattern: /['"]http:\/\/(?!localhost|127\.0\.0\.1)/,
    message: "Insecure HTTP URL detected — use HTTPS instead.",
    severity: "warning",
  },
  {
    id: "no-unescaped-url-params",
    pattern: /\$\{.*\}\s*(?:\/|[?&]\w+=)/,
    message: "URL with interpolated values — ensure user input is encoded with encodeURIComponent().",
    severity: "info",
  },
  {
    id: "no-localstorage-sensitive",
    pattern: /localStorage\.setItem\s*\(\s*['"](?:token|password|secret|key)/i,
    message: "Storing sensitive data in localStorage — use httpOnly cookies instead.",
    severity: "warning",
  },
];

export function scanSecurity(code: string): SecurityScanResult {
  const issues: SecurityIssue[] = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comments
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;

    for (const rule of SECURITY_RULES) {
      if (rule.pattern.test(line)) {
        // Check exceptions
        if (rule.exceptions?.some((ex) => ex.test(line))) continue;

        issues.push({
          line: i + 1,
          message: rule.message,
          severity: rule.severity,
          rule: rule.id,
        });
      }
    }
  }

  return {
    safe: !issues.some((i) => i.severity === "critical"),
    issues,
  };
}
