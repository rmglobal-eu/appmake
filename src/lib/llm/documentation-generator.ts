interface ParsedSignature {
  name: string;
  params: { name: string; type: string; defaultValue?: string; isRest: boolean }[];
  returnType: string;
  isAsync: boolean;
  isExported: boolean;
  isGenerator: boolean;
  kind: "function" | "arrow" | "method" | "class" | "interface" | "type";
  genericParams: string[];
}

function parseTypeAnnotation(raw: string): string {
  const cleaned = raw.trim();
  if (!cleaned) return "unknown";
  return cleaned;
}

function parseFunctionParams(
  paramString: string
): ParsedSignature["params"] {
  if (!paramString.trim()) return [];

  const params: ParsedSignature["params"] = [];
  let depth = 0;
  let current = "";
  const chars = paramString.split("");

  for (const char of chars) {
    if (char === "(" || char === "<" || char === "{" || char === "[") depth++;
    if (char === ")" || char === ">" || char === "}" || char === "]") depth--;

    if (char === "," && depth === 0) {
      params.push(parseOneParam(current.trim()));
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    params.push(parseOneParam(current.trim()));
  }

  return params;
}

function parseOneParam(
  raw: string
): ParsedSignature["params"][0] {
  const isRest = raw.startsWith("...");
  const cleaned = isRest ? raw.slice(3) : raw;

  // Handle destructured params
  if (cleaned.startsWith("{")) {
    const typeMatch = cleaned.match(/\}:\s*(.+?)(?:\s*=\s*(.+))?$/);
    return {
      name: "props",
      type: typeMatch ? typeMatch[1].trim() : "object",
      defaultValue: typeMatch?.[2]?.trim(),
      isRest,
    };
  }

  const parts = cleaned.split("=");
  const nameAndType = parts[0].trim();
  const defaultValue = parts[1]?.trim();

  const colonIndex = findTypeColonIndex(nameAndType);

  if (colonIndex > -1) {
    const name = nameAndType.slice(0, colonIndex).trim();
    const type = nameAndType.slice(colonIndex + 1).trim();
    return { name, type: parseTypeAnnotation(type), defaultValue, isRest };
  }

  return {
    name: nameAndType,
    type: defaultValue ? inferTypeFromValue(defaultValue) : "unknown",
    defaultValue,
    isRest,
  };
}

function findTypeColonIndex(str: string): number {
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "<" || char === "(" || char === "{" || char === "[") depth++;
    if (char === ">" || char === ")" || char === "}" || char === "]") depth--;
    if (char === ":" && depth === 0) return i;
  }
  return -1;
}

function inferTypeFromValue(value: string): string {
  if (value === "true" || value === "false") return "boolean";
  if (/^['"`]/.test(value)) return "string";
  if (/^\d/.test(value)) return "number";
  if (value === "null") return "null";
  if (value === "undefined") return "undefined";
  if (value.startsWith("[")) return "Array";
  if (value.startsWith("{")) return "object";
  if (value.includes("=>") || value.startsWith("function")) return "Function";
  return "unknown";
}

function extractGenericParams(code: string): string[] {
  const match = code.match(/<([^>]+)>/);
  if (!match) return [];
  return match[1].split(",").map((p) => p.trim().split(/\s+/)[0]);
}

function guessReturnType(body: string, isAsync: boolean): string {
  if (!body) return isAsync ? "Promise<void>" : "void";

  const returnMatches = body.match(/return\s+(.+?);/g);
  if (!returnMatches) return isAsync ? "Promise<void>" : "void";

  const lastReturn = returnMatches[returnMatches.length - 1];
  const value = lastReturn.replace(/^return\s+/, "").replace(/;$/, "").trim();

  let baseType: string;
  if (value === "true" || value === "false") baseType = "boolean";
  else if (/^['"`]/.test(value)) baseType = "string";
  else if (/^\d/.test(value)) baseType = "number";
  else if (value === "null") baseType = "null";
  else if (value.startsWith("[")) baseType = "Array";
  else if (value.startsWith("{")) baseType = "object";
  else if (value.startsWith("<") || /^[A-Z]/.test(value)) baseType = "JSX.Element";
  else baseType = "unknown";

  return isAsync ? `Promise<${baseType}>` : baseType;
}

function generateThrowsDocs(body: string): string[] {
  const throws: string[] = [];
  const throwRegex = /throw\s+new\s+(\w+)\s*\(\s*['"`]([^'"]+)['"`]/g;
  let match: RegExpExecArray | null;

  while ((match = throwRegex.exec(body)) !== null) {
    throws.push(`${match[1]} - ${match[2]}`);
  }

  return throws;
}

function generateExampleForFunction(sig: ParsedSignature): string {
  const args = sig.params
    .map((p) => {
      if (p.defaultValue) return p.defaultValue;
      switch (p.type) {
        case "string":
          return `"example"`;
        case "number":
          return "42";
        case "boolean":
          return "true";
        default:
          return `/* ${p.type} */`;
      }
    })
    .join(", ");

  const prefix = sig.isAsync ? "await " : "";
  return `${prefix}${sig.name}(${args})`;
}

function buildJSDocBlock(lines: string[]): string {
  if (lines.length === 0) return "";
  const inner = lines.map((l) => ` * ${l}`).join("\n");
  return `/**\n${inner}\n */`;
}

function generateFunctionDoc(sig: ParsedSignature, body: string): string {
  const docLines: string[] = [];

  // Summary
  const actionVerb = sig.isAsync ? "Asynchronously processes" : "Processes";
  const nameWords = sig.name
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .trim();
  docLines.push(`${actionVerb} ${nameWords}.`);
  docLines.push("");

  // Generic params
  for (const gp of sig.genericParams) {
    docLines.push(`@template ${gp}`);
  }

  // Params
  for (const param of sig.params) {
    const optionalTag = param.defaultValue
      ? ` [${param.name}=${param.defaultValue}]`
      : param.name;
    docLines.push(`@param {${param.type}} ${optionalTag} - The ${param.name} parameter.`);
  }

  // Return
  const returnType = sig.returnType || guessReturnType(body, sig.isAsync);
  if (returnType !== "void" && returnType !== "Promise<void>") {
    docLines.push(`@returns {${returnType}} The result.`);
  }

  // Throws
  const throws = generateThrowsDocs(body);
  for (const t of throws) {
    docLines.push(`@throws {${t}}`);
  }

  // Example
  docLines.push(`@example`);
  docLines.push(`\`\`\`typescript`);
  if (returnType !== "void" && returnType !== "Promise<void>") {
    docLines.push(`const result = ${generateExampleForFunction(sig)};`);
  } else {
    docLines.push(`${generateExampleForFunction(sig)};`);
  }
  docLines.push(`\`\`\``);

  return buildJSDocBlock(docLines);
}

function generateInterfaceDoc(name: string, body: string): string {
  const memberLines = body.split("\n").filter((l) => {
    const t = l.trim();
    return t && !t.startsWith("//") && !t.startsWith("/*") && t !== "{" && t !== "}";
  });

  const docLines: string[] = [];
  docLines.push(`Represents the ${name.replace(/([A-Z])/g, " $1").toLowerCase().trim()} structure.`);

  if (memberLines.length > 0) {
    docLines.push("");
    for (const member of memberLines) {
      const memberMatch = member
        .trim()
        .replace(/;$/, "")
        .match(/^(\w+)(\?)?:\s*(.+)/);
      if (memberMatch) {
        const optional = memberMatch[2] ? " (optional)" : "";
        docLines.push(
          `@property {${memberMatch[3].trim()}} ${memberMatch[1]}${optional} - The ${memberMatch[1]} value.`
        );
      }
    }
  }

  return buildJSDocBlock(docLines);
}

function generateTypeDoc(name: string, definition: string): string {
  const docLines: string[] = [];
  docLines.push(`Type definition for ${name.replace(/([A-Z])/g, " $1").toLowerCase().trim()}.`);

  if (definition.includes("|")) {
    const variants = definition
      .split("|")
      .map((v) => v.trim())
      .filter(Boolean);
    docLines.push("");
    docLines.push(`Possible values: ${variants.join(", ")}`);
  }

  return buildJSDocBlock(docLines);
}

function hasExistingJSDoc(lines: string[], lineIndex: number): boolean {
  for (let i = lineIndex - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed === "") continue;
    if (trimmed === "*/") return true;
    if (trimmed.startsWith("/**")) return true;
    return false;
  }
  return false;
}

function getFunctionBody(lines: string[], startLine: number): string {
  let depth = 0;
  let foundOpen = false;
  const bodyLines: string[] = [];

  for (let i = startLine; i < lines.length; i++) {
    bodyLines.push(lines[i]);
    for (const char of lines[i]) {
      if (char === "{") {
        depth++;
        foundOpen = true;
      } else if (char === "}") {
        depth--;
      }
    }
    if (foundOpen && depth <= 0) break;
  }

  return bodyLines.join("\n");
}

export function generateDocumentation(code: string): string {
  const lines = code.split("\n");
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const indent = lines[i].match(/^(\s*)/)?.[1] ?? "";

    // Skip if already has JSDoc
    if (hasExistingJSDoc(lines, i)) {
      result.push(lines[i]);
      continue;
    }

    // export (default)? (async)? function name<T>(params): ReturnType
    const funcMatch = trimmed.match(
      /^(export\s+)?(default\s+)?(async\s+)?function\s*(\*?\s*\w+)\s*(<[^>]+>)?\s*\(([^)]*)\)(?:\s*:\s*([^\s{]+))?\s*\{?/
    );
    if (funcMatch) {
      const sig: ParsedSignature = {
        name: funcMatch[4].replace("*", "").trim(),
        params: parseFunctionParams(funcMatch[6]),
        returnType: funcMatch[7] || "",
        isAsync: !!funcMatch[3],
        isExported: !!funcMatch[1],
        isGenerator: funcMatch[4].includes("*"),
        kind: "function",
        genericParams: funcMatch[5] ? extractGenericParams(funcMatch[5]) : [],
      };

      const body = getFunctionBody(lines, i);
      const doc = generateFunctionDoc(sig, body);
      const docLines = doc.split("\n").map((l) => `${indent}${l}`);
      result.push(...docLines);
      result.push(lines[i]);
      continue;
    }

    // export const name = (async)? (params) =>
    const arrowMatch = trimmed.match(
      /^(export\s+)?(const|let|var)\s+(\w+)\s*(<[^>]+>)?\s*=\s*(async\s+)?\(([^)]*)\)(?:\s*:\s*([^\s=]+))?\s*=>/
    );
    if (arrowMatch) {
      const sig: ParsedSignature = {
        name: arrowMatch[3],
        params: parseFunctionParams(arrowMatch[6]),
        returnType: arrowMatch[7] || "",
        isAsync: !!arrowMatch[5],
        isExported: !!arrowMatch[1],
        isGenerator: false,
        kind: "arrow",
        genericParams: arrowMatch[4] ? extractGenericParams(arrowMatch[4]) : [],
      };

      const body = getFunctionBody(lines, i);
      const doc = generateFunctionDoc(sig, body);
      const docLines = doc.split("\n").map((l) => `${indent}${l}`);
      result.push(...docLines);
      result.push(lines[i]);
      continue;
    }

    // export interface Name {
    const interfaceMatch = trimmed.match(
      /^(export\s+)?interface\s+(\w+)(<[^>]+>)?\s*(extends\s+[^{]+)?\{?/
    );
    if (interfaceMatch) {
      const name = interfaceMatch[2];
      const body = getFunctionBody(lines, i);
      const doc = generateInterfaceDoc(name, body);
      const docLines = doc.split("\n").map((l) => `${indent}${l}`);
      result.push(...docLines);
      result.push(lines[i]);
      continue;
    }

    // export type Name = ...
    const typeMatch = trimmed.match(
      /^(export\s+)?type\s+(\w+)(<[^>]+>)?\s*=\s*(.+)/
    );
    if (typeMatch) {
      const name = typeMatch[2];
      const definition = typeMatch[4];
      const doc = generateTypeDoc(name, definition);
      const docLines = doc.split("\n").map((l) => `${indent}${l}`);
      result.push(...docLines);
      result.push(lines[i]);
      continue;
    }

    // Class
    const classMatch = trimmed.match(
      /^(export\s+)?(default\s+)?(abstract\s+)?class\s+(\w+)/
    );
    if (classMatch) {
      const name = classMatch[4];
      const doc = buildJSDocBlock([
        `Class ${name}.`,
        "",
        `@class ${name}`,
      ]);
      const docLines = doc.split("\n").map((l) => `${indent}${l}`);
      result.push(...docLines);
      result.push(lines[i]);
      continue;
    }

    result.push(lines[i]);
  }

  return result.join("\n");
}
