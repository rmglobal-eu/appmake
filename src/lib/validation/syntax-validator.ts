export interface SyntaxError {
  line: number;
  column: number;
  message: string;
}

export interface SyntaxValidationResult {
  valid: boolean;
  errors: SyntaxError[];
}

// Common syntax patterns that indicate errors
const SYNTAX_ERROR_PATTERNS = [
  { pattern: /\bconst\s+const\b/, message: "Duplicate const keyword" },
  { pattern: /\blet\s+let\b/, message: "Duplicate let keyword" },
  { pattern: /\bfunction\s+function\b/, message: "Duplicate function keyword" },
  { pattern: /\bimport\s+import\b/, message: "Duplicate import keyword" },
  { pattern: /\bexport\s+export\b/, message: "Duplicate export keyword" },
  { pattern: /=>\s*{[^}]*=>\s*{/, message: "Suspicious nested arrow functions" },
];

// Bracket/brace/paren matching
function checkBracketMatching(code: string): SyntaxError[] {
  const errors: SyntaxError[] = [];
  const stack: { char: string; line: number; col: number }[] = [];
  const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
  const closing = new Set([")", "]", "}"]);

  let inString = false;
  let stringChar = "";
  let inTemplate = false;
  let inComment = false;
  let inLineComment = false;
  let line = 1;
  let col = 0;

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const prev = i > 0 ? code[i - 1] : "";
    const next = i < code.length - 1 ? code[i + 1] : "";

    col++;
    if (char === "\n") {
      line++;
      col = 0;
      if (inLineComment) inLineComment = false;
      continue;
    }

    if (inLineComment) continue;
    if (inComment) {
      if (char === "*" && next === "/") {
        inComment = false;
        i++;
        col++;
      }
      continue;
    }

    // String handling
    if (inString) {
      if (char === stringChar && prev !== "\\") {
        inString = false;
      }
      continue;
    }

    if (inTemplate) {
      if (char === "`" && prev !== "\\") {
        inTemplate = false;
      }
      continue;
    }

    // Start of comment
    if (char === "/" && next === "/") {
      inLineComment = true;
      continue;
    }
    if (char === "/" && next === "*") {
      inComment = true;
      continue;
    }

    // Start of string
    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      continue;
    }
    if (char === "`") {
      inTemplate = true;
      continue;
    }

    // Bracket matching
    if (char in pairs) {
      stack.push({ char, line, col });
    } else if (closing.has(char)) {
      if (stack.length === 0) {
        errors.push({ line, column: col, message: `Unexpected closing '${char}'` });
      } else {
        const top = stack.pop()!;
        const expected = pairs[top.char];
        if (expected !== char) {
          errors.push({
            line,
            column: col,
            message: `Mismatched bracket: expected '${expected}' but found '${char}' (opened at line ${top.line})`,
          });
        }
      }
    }
  }

  for (const unclosed of stack) {
    errors.push({
      line: unclosed.line,
      column: unclosed.col,
      message: `Unclosed '${unclosed.char}'`,
    });
  }

  return errors;
}

export function validateSyntax(code: string, _lang: string = "tsx"): SyntaxValidationResult {
  const errors: SyntaxError[] = [];

  // Pattern-based checks
  const lines = code.split("\n");
  for (let i = 0; i < lines.length; i++) {
    for (const { pattern, message } of SYNTAX_ERROR_PATTERNS) {
      if (pattern.test(lines[i])) {
        errors.push({ line: i + 1, column: 0, message });
      }
    }
  }

  // Bracket matching
  const bracketErrors = checkBracketMatching(code);
  errors.push(...bracketErrors);

  return {
    valid: errors.length === 0,
    errors,
  };
}
