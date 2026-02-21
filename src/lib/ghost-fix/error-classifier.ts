/**
 * Error Classifier for Ghost-Fix System
 *
 * Categorizes preview/build errors into actionable types and generates
 * fix suggestions that can be fed into the AI fix pipeline.
 */

export type ErrorType =
  | "syntax"
  | "runtime"
  | "type-error"
  | "import-missing"
  | "style"
  | "react-hook-violation"
  | "unknown";

export interface ClassifiedError {
  type: ErrorType;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  originalError: string;
  suggestion: string;
  confidence: number; // 0-1, how confident we are in the classification
  context?: string; // surrounding code or stack trace excerpt
}

interface ErrorPattern {
  type: ErrorType;
  patterns: RegExp[];
  suggestionTemplate: (match: RegExpMatchArray, raw: string) => string;
  confidence: number;
}

const ERROR_PATTERNS: ErrorPattern[] = [
  // Import / module resolution errors
  {
    type: "import-missing",
    patterns: [
      /Cannot find module ['"]([^'"]+)['"]/i,
      /Module not found.*['"]([^'"]+)['"]/i,
      /Failed to resolve import ['"]([^'"]+)['"]/i,
      /Could not resolve ['"]([^'"]+)['"]/i,
      /is not exported from ['"]([^'"]+)['"]/i,
      /does not provide an export named ['"]([^'"]+)['"]/i,
    ],
    suggestionTemplate: (match, _raw) =>
      `Add or fix the import for "${match[1]}". Check if the module is installed or if the path is correct.`,
    confidence: 0.95,
  },

  // React hook violations
  {
    type: "react-hook-violation",
    patterns: [
      /React Hook "(\w+)" is called conditionally/i,
      /React Hook "(\w+)" is called in a function that is neither a React function component nor a custom React Hook/i,
      /Rendered more hooks than during the previous render/i,
      /Rendered fewer hooks than expected/i,
      /Invalid hook call/i,
      /Hooks can only be called inside.*the body of a function component/i,
    ],
    suggestionTemplate: (match, raw) => {
      if (match[1]) {
        return `Move the "${match[1]}" hook call to the top level of the component. Hooks cannot be called conditionally, inside loops, or in nested functions.`;
      }
      return `Fix the hook ordering issue. Ensure all hooks are called unconditionally at the top level of the component, in the same order every render.`;
    },
    confidence: 0.98,
  },

  // Type errors
  {
    type: "type-error",
    patterns: [
      /TypeError:\s*(.+)/i,
      /Cannot read propert(?:y|ies) of (undefined|null)/i,
      /(\w+) is not a function/i,
      /(\w+) is not defined/i,
      /Cannot assign to '(\w+)' because it is a read-only property/i,
      /Type '([^']+)' is not assignable to type '([^']+)'/i,
      /Property '(\w+)' does not exist on type '([^']+)'/i,
      /Argument of type '([^']+)' is not assignable/i,
    ],
    suggestionTemplate: (match, raw) => {
      if (/Cannot read propert/.test(raw)) {
        return `Add a null/undefined check before accessing the property. Use optional chaining (?.) or a guard clause.`;
      }
      if (/is not a function/.test(raw)) {
        return `"${match[1]}" is not a function. Check if it's imported correctly and is actually callable.`;
      }
      if (/is not defined/.test(raw)) {
        return `"${match[1]}" is not defined. Add the missing import or declaration.`;
      }
      if (/is not assignable to type/.test(raw)) {
        return `Type mismatch: "${match[1]}" cannot be assigned to "${match[2]}". Fix the type or add a type assertion.`;
      }
      if (/Property .+ does not exist/.test(raw)) {
        return `Property "${match[1]}" does not exist on type "${match[2]}". Check for typos or extend the type definition.`;
      }
      return `Fix the type error: ${match[0]}`;
    },
    confidence: 0.9,
  },

  // Syntax errors
  {
    type: "syntax",
    patterns: [
      /SyntaxError:\s*(.+)/i,
      /Unexpected token\s*['"]?(\S+)['"]?/i,
      /Unterminated string literal/i,
      /Missing semicolon/i,
      /Unexpected end of input/i,
      /Expected\s+['"]?(\S+)['"]?\s+but\s+(?:found|got)\s+['"]?(\S+)['"]?/i,
      /Parse error/i,
      /Unexpected keyword '(\w+)'/i,
    ],
    suggestionTemplate: (match, raw) => {
      if (/Unexpected token/.test(raw)) {
        return `Fix the syntax error near unexpected token "${match[1] || ""}". Check for missing brackets, parentheses, or operators.`;
      }
      if (/Unterminated string/.test(raw)) {
        return `Close the unterminated string literal. Check for missing quotes.`;
      }
      if (/Unexpected end of input/.test(raw)) {
        return `The code ends unexpectedly. Check for missing closing brackets, braces, or parentheses.`;
      }
      return `Fix the syntax error: ${match[0]}`;
    },
    confidence: 0.95,
  },

  // Runtime errors
  {
    type: "runtime",
    patterns: [
      /RangeError:\s*(.+)/i,
      /Maximum call stack size exceeded/i,
      /ReferenceError:\s*(.+)/i,
      /URIError:\s*(.+)/i,
      /InternalError:\s*(.+)/i,
      /EvalError:\s*(.+)/i,
      /Uncaught\s+(?:Error|Exception):\s*(.+)/i,
    ],
    suggestionTemplate: (match, raw) => {
      if (/Maximum call stack/.test(raw)) {
        return `Infinite recursion detected. Check for recursive calls without a proper base case, or circular useEffect dependencies.`;
      }
      if (/ReferenceError/.test(raw)) {
        return `Reference error: ${match[1]}. Ensure the variable or function is declared and in scope.`;
      }
      return `Fix the runtime error: ${match[0]}`;
    },
    confidence: 0.85,
  },

  // Style / CSS errors
  {
    type: "style",
    patterns: [
      /Unknown CSS property ['"]([^'"]+)['"]/i,
      /Invalid CSS value.*['"]([^'"]+)['"]/i,
      /CSSStyleDeclaration.*['"]([^'"]+)['"]/i,
      /Tailwind.*class.*['"]([^'"]+)['"].*not found/i,
    ],
    suggestionTemplate: (match, _raw) =>
      `Fix the CSS/style issue with "${match[1]}". Check for typos in the property name or value.`,
    confidence: 0.8,
  },
];

/**
 * Extract file and line info from an error string.
 */
function extractLocation(raw: string): {
  file?: string;
  line?: number;
  column?: number;
} {
  // Match patterns like "at Component (App.tsx:14:5)" or "App.tsx:14:5"
  const locationMatch = raw.match(
    /(?:at\s+\w+\s+\()?([^\s()]+\.(?:tsx?|jsx?|css|mjs)):(\d+)(?::(\d+))?\)?/
  );
  if (locationMatch) {
    return {
      file: locationMatch[1],
      line: parseInt(locationMatch[2], 10),
      column: locationMatch[3]
        ? parseInt(locationMatch[3], 10)
        : undefined,
    };
  }
  return {};
}

/**
 * Extract a short context snippet from a stack trace or error message.
 */
function extractContext(raw: string): string | undefined {
  const lines = raw.split("\n");
  if (lines.length <= 1) return undefined;
  // Return up to 5 lines of context
  return lines.slice(0, 5).join("\n");
}

/**
 * Classify a raw error string into a structured ClassifiedError.
 */
export function classifyError(rawError: string): ClassifiedError {
  const trimmed = rawError.trim();

  for (const pattern of ERROR_PATTERNS) {
    for (const regex of pattern.patterns) {
      const match = trimmed.match(regex);
      if (match) {
        const location = extractLocation(trimmed);
        return {
          type: pattern.type,
          message: match[0],
          file: location.file,
          line: location.line,
          column: location.column,
          originalError: trimmed,
          suggestion: pattern.suggestionTemplate(match, trimmed),
          confidence: pattern.confidence,
          context: extractContext(trimmed),
        };
      }
    }
  }

  // Fallback: unknown error type
  const location = extractLocation(trimmed);
  return {
    type: "unknown",
    message: trimmed.split("\n")[0].slice(0, 200),
    file: location.file,
    line: location.line,
    column: location.column,
    originalError: trimmed,
    suggestion: `Analyze and fix the error: "${trimmed.split("\n")[0].slice(0, 100)}"`,
    confidence: 0.3,
    context: extractContext(trimmed),
  };
}

/**
 * Classify multiple errors at once (e.g. from a batch of preview errors).
 * Deduplicates by message and returns sorted by confidence (highest first).
 */
export function classifyErrors(rawErrors: string[]): ClassifiedError[] {
  const seen = new Set<string>();
  const results: ClassifiedError[] = [];

  for (const raw of rawErrors) {
    const classified = classifyError(raw);
    const key = `${classified.type}:${classified.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push(classified);
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Check whether an error is likely auto-fixable by the ghost-fix system.
 */
export function isAutoFixable(classified: ClassifiedError): boolean {
  const AUTO_FIXABLE_TYPES: ErrorType[] = [
    "import-missing",
    "type-error",
    "syntax",
    "react-hook-violation",
  ];
  return (
    AUTO_FIXABLE_TYPES.includes(classified.type) &&
    classified.confidence >= 0.7
  );
}

/**
 * Get a human-readable label for an error type.
 */
export function getErrorTypeLabel(type: ErrorType): string {
  const labels: Record<ErrorType, string> = {
    syntax: "Syntax Error",
    runtime: "Runtime Error",
    "type-error": "Type Error",
    "import-missing": "Missing Import",
    style: "Style Error",
    "react-hook-violation": "React Hook Violation",
    unknown: "Unknown Error",
  };
  return labels[type];
}
