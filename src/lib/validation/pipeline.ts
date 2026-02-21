import { validateSyntax, type SyntaxError } from "./syntax-validator";
import { validateImports, type ImportError } from "./import-validator";
import { checkTypes, type TypeIssue } from "./type-checker";
import { scanSecurity, type SecurityIssue } from "./security-scanner";
import { validateStyles, type StyleIssue } from "./style-validator";
import { checkAccessibility, type A11yIssue } from "./accessibility-checker";
import { analyzePerformance, type PerfIssue } from "./performance-analyzer";
import { resolveDependencies, type DependencyInfo } from "./dependency-resolver";

export interface ValidationError {
  filePath: string;
  line?: number;
  message: string;
  category: "syntax" | "import" | "type" | "security" | "style" | "a11y" | "performance";
  severity: "error" | "warning" | "info";
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: ValidationError[];
  dependencies: DependencyInfo[];
  passedChecks: number;
  totalChecks: number;
}

/**
 * Run the full validation pipeline on all project files.
 * Returns errors, warnings, and suggestions without modifying code.
 */
export function runValidationPipeline(
  files: Record<string, string>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const suggestions: ValidationError[] = [];
  let passedChecks = 0;
  let totalChecks = 0;

  for (const [filePath, code] of Object.entries(files)) {
    // Skip non-code files
    if (!isCodeFile(filePath)) continue;

    // 1. Syntax validation
    totalChecks++;
    const syntaxResult = validateSyntax(code, getLanguage(filePath));
    if (syntaxResult.valid) {
      passedChecks++;
    } else {
      for (const err of syntaxResult.errors) {
        errors.push({
          filePath,
          line: err.line,
          message: err.message,
          category: "syntax",
          severity: "error",
        });
      }
    }

    // 2. Import validation
    totalChecks++;
    const importResult = validateImports(code, filePath, files);
    if (importResult.valid) {
      passedChecks++;
    } else {
      for (const err of importResult.errors) {
        errors.push({
          filePath: err.filePath,
          message: err.message,
          category: "import",
          severity: "error",
        });
      }
    }

    // 3. Type checking
    totalChecks++;
    const typeResult = checkTypes(code);
    if (typeResult.valid) {
      passedChecks++;
    }
    for (const issue of typeResult.issues) {
      const target = issue.severity === "error" ? errors : warnings;
      target.push({
        filePath,
        line: issue.line,
        message: issue.message,
        category: "type",
        severity: issue.severity,
      });
    }

    // 4. Security scanning
    totalChecks++;
    const securityResult = scanSecurity(code);
    if (securityResult.safe) {
      passedChecks++;
    }
    for (const issue of securityResult.issues) {
      const target = issue.severity === "critical" ? errors : issue.severity === "warning" ? warnings : suggestions;
      target.push({
        filePath,
        line: issue.line,
        message: issue.message,
        category: "security",
        severity: issue.severity === "critical" ? "error" : issue.severity,
      });
    }

    // 5. Style validation
    totalChecks++;
    const styleResult = validateStyles(code);
    if (styleResult.valid) {
      passedChecks++;
    }
    for (const issue of styleResult.issues) {
      warnings.push({
        filePath,
        line: issue.line,
        message: issue.message,
        category: "style",
        severity: issue.severity,
      });
    }

    // 6. Accessibility checking
    totalChecks++;
    const a11yResult = checkAccessibility(code);
    if (a11yResult.valid) {
      passedChecks++;
    }
    for (const issue of a11yResult.issues) {
      const target = issue.severity === "error" ? warnings : suggestions; // a11y errors are treated as warnings
      target.push({
        filePath,
        line: issue.line,
        message: issue.message,
        category: "a11y",
        severity: issue.severity,
      });
    }

    // 7. Performance analysis
    totalChecks++;
    const perfResult = analyzePerformance(code);
    passedChecks++; // Always passes, just provides suggestions
    for (const issue of perfResult.issues) {
      suggestions.push({
        filePath,
        line: issue.line,
        message: issue.message,
        category: "performance",
        severity: issue.severity === "warning" ? "warning" : "info",
      });
    }
  }

  // 8. Dependency resolution (project-wide)
  const dependencies = resolveDependencies(files);

  return {
    errors,
    warnings,
    suggestions,
    dependencies,
    passedChecks,
    totalChecks,
  };
}

function isCodeFile(path: string): boolean {
  return /\.(tsx?|jsx?|mjs|cjs)$/.test(path);
}

function getLanguage(path: string): string {
  if (path.endsWith(".tsx") || path.endsWith(".jsx")) return "tsx";
  if (path.endsWith(".ts")) return "ts";
  return "js";
}
