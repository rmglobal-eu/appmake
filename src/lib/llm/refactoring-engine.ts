export type RefactoringType =
  | "extract-component"
  | "simplify-logic"
  | "improve-naming"
  | "remove-duplication"
  | "add-types"
  | "optimize-performance";

export interface RefactoringSuggestion {
  type: RefactoringType;
  description: string;
  before: string;
  after: string;
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
}

interface FunctionBlock {
  name: string;
  body: string;
  lineStart: number;
  lineEnd: number;
  lineCount: number;
}

function extractFunctions(code: string): FunctionBlock[] {
  const lines = code.split("\n");
  const functions: FunctionBlock[] = [];

  const funcStartPatterns = [
    /^(export\s+)?(async\s+)?function\s+(\w+)/,
    /^(export\s+)?(const|let|var)\s+(\w+)\s*=\s*(async\s+)?(\([^)]*\)|[^=]+)\s*=>/,
    /^(export\s+)?(const|let|var)\s+(\w+)\s*=\s*(async\s+)?function/,
  ];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    let name: string | null = null;

    for (const pattern of funcStartPatterns) {
      const match = pattern.exec(trimmed);
      if (match) {
        name = match[3];
        break;
      }
    }

    if (!name) continue;

    let depth = 0;
    let foundOpen = false;
    let end = i;

    for (let j = i; j < lines.length; j++) {
      for (const char of lines[j]) {
        if (char === "{") {
          depth++;
          foundOpen = true;
        } else if (char === "}") {
          depth--;
        }
      }
      if (foundOpen && depth <= 0) {
        end = j;
        break;
      }
    }

    functions.push({
      name,
      body: lines.slice(i, end + 1).join("\n"),
      lineStart: i,
      lineEnd: end,
      lineCount: end - i + 1,
    });
  }

  return functions;
}

function detectLongFunctions(functions: FunctionBlock[]): RefactoringSuggestion[] {
  const suggestions: RefactoringSuggestion[] = [];
  const THRESHOLD = 40;

  for (const fn of functions) {
    if (fn.lineCount > THRESHOLD) {
      const bodyLines = fn.body.split("\n");
      const snippet = bodyLines.slice(0, 5).join("\n") + "\n  // ... " + (fn.lineCount - 5) + " more lines";

      suggestions.push({
        type: "extract-component",
        description: `Function "${fn.name}" is ${fn.lineCount} lines long. Consider breaking it into smaller, focused functions.`,
        before: snippet,
        after: `// Split "${fn.name}" into smaller functions:\nfunction ${fn.name}Core(...) { /* main logic */ }\nfunction ${fn.name}Helper(...) { /* extracted helper */ }\n\nfunction ${fn.name}(...) {\n  const result = ${fn.name}Core(...);\n  return ${fn.name}Helper(result);\n}`,
        impact: "high",
        effort: "medium",
      });
    }
  }

  return suggestions;
}

function detectComplexConditions(code: string): RefactoringSuggestion[] {
  const suggestions: RefactoringSuggestion[] = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (/^if\s*\(/.test(trimmed)) {
      const andOrCount = (trimmed.match(/&&|\|\|/g) || []).length;
      if (andOrCount >= 3) {
        const conditionMatch = trimmed.match(/if\s*\((.+?)\)\s*\{?$/);
        if (conditionMatch) {
          const condition = conditionMatch[1];
          const parts = condition.split(/\s*(?:&&|\|\|)\s*/);
          const varName = "isValid";

          suggestions.push({
            type: "simplify-logic",
            description: `Complex condition on line ${i + 1} with ${andOrCount} logical operators. Extract into a named boolean for clarity.`,
            before: trimmed,
            after: `const ${varName} = (\n  ${parts.join(" &&\n  ")}\n);\nif (${varName}) {`,
            impact: "medium",
            effort: "low",
          });
        }
      }
    }
  }

  return suggestions;
}

function detectPoorNaming(code: string): RefactoringSuggestion[] {
  const suggestions: RefactoringSuggestion[] = [];
  const shortVarRegex = /(?:const|let|var)\s+([a-z])\s*[=:]/g;
  const found = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = shortVarRegex.exec(code)) !== null) {
    const name = match[1];
    if (found.has(name)) continue;
    found.add(name);

    const lineIndex = code.slice(0, match.index).split("\n").length;

    suggestions.push({
      type: "improve-naming",
      description: `Single-letter variable "${name}" on line ${lineIndex}. Use a descriptive name that communicates intent.`,
      before: `const ${name} = ...`,
      after: `const descriptiveName = ...  // Rename "${name}" to something meaningful`,
      impact: "low",
      effort: "low",
    });
  }

  return suggestions;
}

function detectDuplication(functions: FunctionBlock[]): RefactoringSuggestion[] {
  const suggestions: RefactoringSuggestion[] = [];

  for (let i = 0; i < functions.length; i++) {
    for (let j = i + 1; j < functions.length; j++) {
      const a = functions[i];
      const b = functions[j];

      const aLines = a.body
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 10);
      const bLines = b.body
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 10);

      let commonLines = 0;
      for (const line of aLines) {
        if (bLines.includes(line)) commonLines++;
      }

      const minLines = Math.min(aLines.length, bLines.length);
      if (minLines > 0 && commonLines / minLines > 0.5 && commonLines >= 3) {
        suggestions.push({
          type: "remove-duplication",
          description: `Functions "${a.name}" and "${b.name}" share ${commonLines} similar lines (${Math.round((commonLines / minLines) * 100)}% overlap). Extract shared logic.`,
          before: `function ${a.name}(...) { /* ... */ }\nfunction ${b.name}(...) { /* similar code */ }`,
          after: `function sharedLogic(...) { /* extracted common code */ }\n\nfunction ${a.name}(...) {\n  return sharedLogic(...) /* + specific logic */;\n}\n\nfunction ${b.name}(...) {\n  return sharedLogic(...) /* + specific logic */;\n}`,
          impact: "medium",
          effort: "medium",
        });
      }
    }
  }

  return suggestions;
}

function detectMissingTypes(code: string, filePath: string): RefactoringSuggestion[] {
  const suggestions: RefactoringSuggestion[] = [];

  const isTypeScript = filePath.endsWith(".ts") || filePath.endsWith(".tsx");
  if (!isTypeScript) return suggestions;

  const anyTypeRegex = /:\s*any\b/g;
  let anyCount = 0;
  let firstAnyLine = -1;
  let anyMatch: RegExpExecArray | null;

  while ((anyMatch = anyTypeRegex.exec(code)) !== null) {
    anyCount++;
    if (firstAnyLine === -1) {
      firstAnyLine = code.slice(0, anyMatch.index).split("\n").length;
    }
  }

  if (anyCount > 0) {
    suggestions.push({
      type: "add-types",
      description: `Found ${anyCount} use(s) of "any" type. Replace with specific types for better type safety.`,
      before: `const data: any = fetchData();`,
      after: `interface DataResponse {\n  id: string;\n  value: number;\n}\nconst data: DataResponse = fetchData();`,
      impact: "medium",
      effort: "medium",
    });
  }

  const untypedParamRegex =
    /(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:function)?)\s*\(([^)]+)\)/g;
  let paramMatch: RegExpExecArray | null;

  while ((paramMatch = untypedParamRegex.exec(code)) !== null) {
    const params = paramMatch[1].split(",").map((p) => p.trim());
    const untypedParams = params.filter(
      (p) => !p.includes(":") && !p.startsWith("...") && p.length > 0
    );

    if (untypedParams.length > 0) {
      const lineNum = code.slice(0, paramMatch.index).split("\n").length;
      suggestions.push({
        type: "add-types",
        description: `Function on line ${lineNum} has ${untypedParams.length} untyped parameter(s): ${untypedParams.join(", ")}. Add type annotations.`,
        before: `function example(${untypedParams.join(", ")})`,
        after: `function example(${untypedParams.map((p) => `${p}: unknown /* add correct type */`).join(", ")})`,
        impact: "medium",
        effort: "low",
      });
      break;
    }
  }

  return suggestions;
}

function detectPerformanceIssues(code: string): RefactoringSuggestion[] {
  const suggestions: RefactoringSuggestion[] = [];
  const lines = code.split("\n");

  // Detect inline function creation in JSX
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (/onClick=\{?\(\)\s*=>/.test(trimmed) || /onChange=\{?\(\)\s*=>/.test(trimmed)) {
      suggestions.push({
        type: "optimize-performance",
        description: `Inline arrow function in JSX on line ${i + 1}. This creates a new function on every render. Extract to useCallback or a named handler.`,
        before: `<button onClick={() => handleAction(id)}>`,
        after: `const handleClick = useCallback(() => {\n  handleAction(id);\n}, [id]);\n\n<button onClick={handleClick}>`,
        impact: "low",
        effort: "low",
      });
      break;
    }
  }

  // Detect missing dependency arrays in useEffect
  const useEffectNoDepRegex = /useEffect\s*\(\s*(?:async\s*)?\(\)\s*=>\s*\{[\s\S]*?\}\s*\)\s*;/g;
  let effectMatch: RegExpExecArray | null;

  while ((effectMatch = useEffectNoDepRegex.exec(code)) !== null) {
    const effectCode = effectMatch[0];
    if (!effectCode.includes("], ") && !effectCode.includes("],\n") && !effectCode.match(/\]\s*\)/)) {
      const lineNum = code.slice(0, effectMatch.index).split("\n").length;
      suggestions.push({
        type: "optimize-performance",
        description: `useEffect on line ${lineNum} may be missing a dependency array. This causes it to run on every render.`,
        before: `useEffect(() => {\n  // effect code\n});`,
        after: `useEffect(() => {\n  // effect code\n}, []); // Add appropriate dependencies`,
        impact: "high",
        effort: "low",
      });
      break;
    }
  }

  // Detect object/array creation in render
  if (
    code.includes("return (") ||
    code.includes("return(") ||
    /<\w+/.test(code)
  ) {
    const renderSectionStart = code.lastIndexOf("return (");
    if (renderSectionStart > -1) {
      const renderSection = code.slice(renderSectionStart);
      if (/style=\{\{/.test(renderSection)) {
        suggestions.push({
          type: "optimize-performance",
          description: "Inline style objects in JSX create new objects on every render. Extract to a constant or useMemo.",
          before: `<div style={{ color: "red", padding: 16 }}>`,
          after: `const styles = { color: "red", padding: 16 } as const;\n// ...\n<div style={styles}>`,
          impact: "low",
          effort: "low",
        });
      }
    }
  }

  return suggestions;
}

export function analyzeForRefactoring(
  code: string,
  filePath: string
): RefactoringSuggestion[] {
  const functions = extractFunctions(code);

  const suggestions: RefactoringSuggestion[] = [
    ...detectLongFunctions(functions),
    ...detectComplexConditions(code),
    ...detectPoorNaming(code),
    ...detectDuplication(functions),
    ...detectMissingTypes(code, filePath),
    ...detectPerformanceIssues(code),
  ];

  // Sort by impact: high first, then medium, then low
  const impactOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

  return suggestions;
}
