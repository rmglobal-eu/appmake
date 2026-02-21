export interface LineExplanation {
  line: number;
  explanation: string;
}

export interface CodeExplanation {
  summary: string;
  lineByLine: LineExplanation[];
  concepts: string[];
  complexity: "beginner" | "intermediate" | "advanced";
}

interface ParsedFunction {
  name: string;
  params: string[];
  isAsync: boolean;
  isExported: boolean;
  lineStart: number;
}

interface ParsedImport {
  source: string;
  names: string[];
  line: number;
}

function parseImports(lines: string[]): ParsedImport[] {
  const imports: ParsedImport[] = [];
  const importRegex = /^import\s+(.+?)\s+from\s+['"](.*?)['"]/;
  const requireRegex = /(?:const|let|var)\s+(.+?)\s*=\s*require\s*\(\s*['"](.*?)['"]\s*\)/;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    let match = importRegex.exec(trimmed);
    if (match) {
      const namesPart = match[1];
      const source = match[2];
      const names = namesPart
        .replace(/[{}]/g, "")
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      imports.push({ source, names, line: i + 1 });
      continue;
    }

    match = requireRegex.exec(trimmed);
    if (match) {
      const namesPart = match[1];
      const source = match[2];
      const names = namesPart
        .replace(/[{}]/g, "")
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      imports.push({ source, names, line: i + 1 });
    }
  }

  return imports;
}

function parseFunctions(lines: string[]): ParsedFunction[] {
  const functions: ParsedFunction[] = [];
  const funcPatterns = [
    /^(export\s+)?(async\s+)?function\s+(\w+)\s*\(([^)]*)\)/,
    /^(export\s+)?(const|let|var)\s+(\w+)\s*=\s*(async\s+)?\(([^)]*)\)\s*=>/,
    /^(export\s+)?(const|let|var)\s+(\w+)\s*=\s*(async\s+)?function\s*\(([^)]*)\)/,
  ];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Pattern 1: function declaration
    const funcMatch = funcPatterns[0].exec(trimmed);
    if (funcMatch) {
      functions.push({
        name: funcMatch[3],
        params: funcMatch[4]
          .split(",")
          .map((p) => p.trim().split(":")[0].trim())
          .filter(Boolean),
        isAsync: !!funcMatch[2],
        isExported: !!funcMatch[1],
        lineStart: i + 1,
      });
      continue;
    }

    // Pattern 2: arrow function
    const arrowMatch = funcPatterns[1].exec(trimmed);
    if (arrowMatch) {
      functions.push({
        name: arrowMatch[3],
        params: arrowMatch[5]
          .split(",")
          .map((p) => p.trim().split(":")[0].trim())
          .filter(Boolean),
        isAsync: !!arrowMatch[4],
        isExported: !!arrowMatch[1],
        lineStart: i + 1,
      });
      continue;
    }

    // Pattern 3: function expression
    const exprMatch = funcPatterns[2].exec(trimmed);
    if (exprMatch) {
      functions.push({
        name: exprMatch[3],
        params: exprMatch[5]
          .split(",")
          .map((p) => p.trim().split(":")[0].trim())
          .filter(Boolean),
        isAsync: !!exprMatch[4],
        isExported: !!exprMatch[1],
        lineStart: i + 1,
      });
    }
  }

  return functions;
}

function detectConcepts(code: string, language: string): string[] {
  const concepts: string[] = [];

  if (/async\s/.test(code) || code.includes("await ")) concepts.push("async/await");
  if (code.includes("Promise")) concepts.push("Promises");
  if (code.includes(".map(") || code.includes(".filter(") || code.includes(".reduce("))
    concepts.push("array methods");
  if (/=>\s*[{(]/.test(code)) concepts.push("arrow functions");
  if (code.includes("...")) concepts.push("spread/rest operator");
  if (/\[.*\]\s*=/.test(code) || /\{.*\}\s*=/.test(code))
    concepts.push("destructuring");
  if (code.includes("typeof") || code.includes("instanceof"))
    concepts.push("type checking");
  if (/class\s+\w+/.test(code)) concepts.push("classes");
  if (code.includes("extends ")) concepts.push("inheritance");
  if (code.includes("implements ")) concepts.push("interfaces");
  if (code.includes("generic") || /<\w+>/.test(code)) concepts.push("generics");
  if (code.includes("try") && code.includes("catch")) concepts.push("error handling");
  if (/\/\/.+|\/\*[\s\S]*?\*\//.test(code)) concepts.push("code comments");
  if (code.includes("useEffect") || code.includes("useState") || code.includes("useRef"))
    concepts.push("React hooks");
  if (code.includes("JSX") || /<\w+[^>]*>/.test(code)) concepts.push("JSX");
  if (/export\s+(default\s+)?/.test(code)) concepts.push("ES modules");
  if (code.includes("new Map(") || code.includes("new Set("))
    concepts.push("Map/Set data structures");
  if (/\?\.\w/.test(code)) concepts.push("optional chaining");
  if (/\?\?/.test(code)) concepts.push("nullish coalescing");

  if (language === "typescript" || language === "tsx") {
    if (/:\s*(string|number|boolean|any)/.test(code)) concepts.push("type annotations");
    if (/interface\s+\w+/.test(code)) concepts.push("TypeScript interfaces");
    if (/type\s+\w+\s*=/.test(code)) concepts.push("type aliases");
    if (code.includes("as ")) concepts.push("type assertions");
    if (code.includes("enum ")) concepts.push("enums");
  }

  return [...new Set(concepts)];
}

function assessComplexity(
  code: string,
  functions: ParsedFunction[],
  concepts: string[]
): CodeExplanation["complexity"] {
  let score = 0;

  // Code length
  const lineCount = code.split("\n").length;
  if (lineCount > 100) score += 2;
  else if (lineCount > 50) score += 1;

  // Number of functions
  if (functions.length > 5) score += 2;
  else if (functions.length > 2) score += 1;

  // Advanced concepts
  const advancedConcepts = [
    "generics",
    "inheritance",
    "Promises",
    "async/await",
    "Map/Set data structures",
    "classes",
  ];
  const advancedCount = concepts.filter((c) => advancedConcepts.includes(c)).length;
  score += advancedCount;

  // Nesting depth
  let maxDepth = 0;
  let currentDepth = 0;
  for (const char of code) {
    if (char === "{") {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (char === "}") {
      currentDepth--;
    }
  }
  if (maxDepth > 4) score += 2;
  else if (maxDepth > 2) score += 1;

  if (score >= 5) return "advanced";
  if (score >= 2) return "intermediate";
  return "beginner";
}

function generateLineExplanations(lines: string[]): LineExplanation[] {
  const explanations: LineExplanation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed === "{" || trimmed === "}" || trimmed === ");") continue;

    let explanation = "";

    if (/^import\s/.test(trimmed)) {
      const fromMatch = trimmed.match(/from\s+['"](.*?)['"]/);
      const source = fromMatch ? fromMatch[1] : "a module";
      explanation = `Imports dependencies from "${source}"`;
    } else if (/^export\s+(default\s+)?function/.test(trimmed)) {
      const name = trimmed.match(/function\s+(\w+)/)?.[1] ?? "anonymous";
      explanation = `Exports function "${name}" for use in other modules`;
    } else if (/^(export\s+)?(const|let|var)\s+/.test(trimmed)) {
      const name = trimmed.match(/(const|let|var)\s+(\w+)/)?.[2] ?? "variable";
      if (trimmed.includes("=>") || trimmed.includes("function")) {
        explanation = `Defines function "${name}"`;
      } else {
        const keyword = trimmed.match(/(const|let|var)/)?.[1] ?? "const";
        explanation = `Declares ${keyword === "const" ? "constant" : "variable"} "${name}"`;
      }
    } else if (/^(async\s+)?function\s/.test(trimmed)) {
      const name = trimmed.match(/function\s+(\w+)/)?.[1] ?? "anonymous";
      const isAsync = trimmed.startsWith("async");
      explanation = `Defines ${isAsync ? "async " : ""}function "${name}"`;
    } else if (/^return\s/.test(trimmed)) {
      explanation = "Returns a value from the current function";
    } else if (/^if\s*\(/.test(trimmed)) {
      explanation = "Conditional check - executes block if condition is true";
    } else if (/^else\s*(if\s*\()?/.test(trimmed)) {
      explanation = trimmed.includes("if")
        ? "Alternative conditional check"
        : "Executes if previous condition was false";
    } else if (/^for\s*\(/.test(trimmed)) {
      explanation = "Loop - iterates over elements";
    } else if (/^while\s*\(/.test(trimmed)) {
      explanation = "Loop - repeats while condition is true";
    } else if (/^try\s*\{?/.test(trimmed)) {
      explanation = "Error handling - attempts to execute the following code";
    } else if (/^catch\s*\(/.test(trimmed)) {
      explanation = "Error handling - runs if the try block throws an error";
    } else if (/^finally\s*\{?/.test(trimmed)) {
      explanation = "Runs after try/catch regardless of outcome";
    } else if (/^(export\s+)?(interface|type)\s/.test(trimmed)) {
      const kind = trimmed.includes("interface") ? "interface" : "type";
      const name = trimmed.match(/(interface|type)\s+(\w+)/)?.[2] ?? "unnamed";
      explanation = `Defines TypeScript ${kind} "${name}" for type safety`;
    } else if (/^class\s/.test(trimmed)) {
      const name = trimmed.match(/class\s+(\w+)/)?.[1] ?? "unnamed";
      explanation = `Defines class "${name}"`;
    } else if (/^switch\s*\(/.test(trimmed)) {
      explanation = "Switch statement - matches value against multiple cases";
    } else if (/^case\s/.test(trimmed)) {
      explanation = "Case branch in switch statement";
    } else if (/^default:/.test(trimmed)) {
      explanation = "Default branch - runs if no case matches";
    } else if (/^throw\s/.test(trimmed)) {
      explanation = "Throws an error to be caught by a try/catch block";
    } else if (trimmed.startsWith("//")) {
      explanation = "Code comment";
    } else if (/^await\s/.test(trimmed)) {
      explanation = "Waits for an asynchronous operation to complete";
    } else if (/^\w+\(/.test(trimmed)) {
      const fnName = trimmed.match(/^(\w+)\(/)?.[1] ?? "function";
      explanation = `Calls function "${fnName}"`;
    } else if (/\.\w+\(/.test(trimmed)) {
      const methodName = trimmed.match(/\.(\w+)\(/)?.[1] ?? "method";
      explanation = `Calls method "${methodName}"`;
    } else {
      continue;
    }

    if (explanation) {
      explanations.push({ line: i + 1, explanation });
    }
  }

  return explanations;
}

function generateSummary(
  language: string,
  imports: ParsedImport[],
  functions: ParsedFunction[],
  lineCount: number
): string {
  const parts: string[] = [];

  parts.push(`This is a ${language} file with ${lineCount} lines of code.`);

  if (imports.length > 0) {
    const sources = imports.map((i) => i.source);
    const externalImports = sources.filter((s) => !s.startsWith(".") && !s.startsWith("/"));
    if (externalImports.length > 0) {
      parts.push(`It uses ${externalImports.length} external ${externalImports.length === 1 ? "dependency" : "dependencies"}: ${externalImports.join(", ")}.`);
    }
  }

  if (functions.length > 0) {
    const exported = functions.filter((f) => f.isExported);
    const asyncFns = functions.filter((f) => f.isAsync);

    parts.push(`It defines ${functions.length} ${functions.length === 1 ? "function" : "functions"}.`);
    if (exported.length > 0) {
      parts.push(`${exported.length} ${exported.length === 1 ? "is" : "are"} exported: ${exported.map((f) => f.name).join(", ")}.`);
    }
    if (asyncFns.length > 0) {
      parts.push(`${asyncFns.length} ${asyncFns.length === 1 ? "is" : "are"} asynchronous.`);
    }
  }

  return parts.join(" ");
}

export function explainCode(code: string, language: string): CodeExplanation {
  const lines = code.split("\n");
  const imports = parseImports(lines);
  const functions = parseFunctions(lines);
  const concepts = detectConcepts(code, language);
  const complexity = assessComplexity(code, functions, concepts);
  const lineByLine = generateLineExplanations(lines);
  const summary = generateSummary(language, imports, functions, lines.length);

  return {
    summary,
    lineByLine,
    concepts,
    complexity,
  };
}
