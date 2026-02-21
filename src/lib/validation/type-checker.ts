export interface TypeIssue {
  line: number;
  message: string;
  severity: "error" | "warning";
}

export interface TypeCheckResult {
  valid: boolean;
  issues: TypeIssue[];
}

/**
 * Lightweight type-check that catches common TypeScript mistakes.
 * This is NOT a full TypeScript compiler — it detects patterns that
 * frequently cause runtime errors.
 */
export function checkTypes(code: string): TypeCheckResult {
  const issues: TypeIssue[] = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Detect `any` usage
    if (/:\s*any\b/.test(line) && !line.trim().startsWith("//")) {
      issues.push({
        line: lineNum,
        message: "Avoid using 'any' type — use 'unknown' with type guards or specific types instead",
        severity: "warning",
      });
    }

    // Detect non-null assertions (!)
    if (/\w+!\.\w+/.test(line) && !line.trim().startsWith("//")) {
      issues.push({
        line: lineNum,
        message: "Non-null assertion (!) can cause runtime errors — prefer optional chaining (?.) with proper null checks",
        severity: "warning",
      });
    }

    // Detect ts-ignore
    if (/@ts-ignore/.test(line)) {
      issues.push({
        line: lineNum,
        message: "@ts-ignore suppresses type errors — use @ts-expect-error with a description instead, or fix the type",
        severity: "warning",
      });
    }

    // Detect missing return type on exported functions
    if (/^export\s+(async\s+)?function\s+\w+\s*\([^)]*\)\s*{/.test(line.trim())) {
      // No return type annotation
      if (!line.includes("):") && !line.includes("): ")) {
        issues.push({
          line: lineNum,
          message: "Exported function should have an explicit return type",
          severity: "warning",
        });
      }
    }

    // Detect console.log in production code (warn only)
    if (/console\.(log|debug|info)\(/.test(line) && !line.trim().startsWith("//")) {
      issues.push({
        line: lineNum,
        message: "console.log should be removed from production code — use a proper logging utility or remove",
        severity: "warning",
      });
    }

    // Detect async without await
    if (/async\s+function\s+/.test(line) || /async\s*\(/.test(line)) {
      // Look ahead for await or return Promise in the function body
      let braceCount = 0;
      let hasAwait = false;
      let started = false;

      for (let j = i; j < Math.min(i + 50, lines.length); j++) {
        const l = lines[j];
        for (const char of l) {
          if (char === "{") { braceCount++; started = true; }
          if (char === "}") braceCount--;
        }
        if (/\bawait\b/.test(l)) hasAwait = true;
        if (started && braceCount === 0) break;
      }

      if (started && !hasAwait) {
        issues.push({
          line: lineNum,
          message: "Async function has no 'await' — either add await or remove async keyword",
          severity: "warning",
        });
      }
    }
  }

  return {
    valid: !issues.some((i) => i.severity === "error"),
    issues,
  };
}
