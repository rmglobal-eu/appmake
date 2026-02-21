interface ExportedItem {
  name: string;
  kind: "function" | "component" | "class" | "constant" | "type" | "interface";
  isDefault: boolean;
  params: string[];
  isAsync: boolean;
}

interface ComponentProps {
  name: string;
  type: string;
  required: boolean;
}

function detectExports(code: string): ExportedItem[] {
  const exports: ExportedItem[] = [];
  const lines = code.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // export default function Component
    const defaultFuncMatch = trimmed.match(
      /^export\s+default\s+(async\s+)?function\s+(\w+)\s*\(([^)]*)\)/
    );
    if (defaultFuncMatch) {
      const name = defaultFuncMatch[2];
      const params = parseParams(defaultFuncMatch[3]);
      const isComponent = /^[A-Z]/.test(name);
      exports.push({
        name,
        kind: isComponent ? "component" : "function",
        isDefault: true,
        params,
        isAsync: !!defaultFuncMatch[1],
      });
      continue;
    }

    // export function name
    const funcMatch = trimmed.match(
      /^export\s+(async\s+)?function\s+(\w+)\s*\(([^)]*)\)/
    );
    if (funcMatch) {
      const name = funcMatch[2];
      const params = parseParams(funcMatch[3]);
      const isComponent = /^[A-Z]/.test(name);
      exports.push({
        name,
        kind: isComponent ? "component" : "function",
        isDefault: false,
        params,
        isAsync: !!funcMatch[1],
      });
      continue;
    }

    // export const name = (...) =>
    const constArrowMatch = trimmed.match(
      /^export\s+(const|let)\s+(\w+)\s*=\s*(async\s+)?\(([^)]*)\)\s*(?::\s*\w+\s*)?=>/
    );
    if (constArrowMatch) {
      const name = constArrowMatch[2];
      const params = parseParams(constArrowMatch[4]);
      const isComponent = /^[A-Z]/.test(name);
      exports.push({
        name,
        kind: isComponent ? "component" : "function",
        isDefault: false,
        params,
        isAsync: !!constArrowMatch[3],
      });
      continue;
    }

    // export const name = value (non-function)
    const constMatch = trimmed.match(
      /^export\s+const\s+(\w+)\s*(?::\s*[^=]+)?\s*=\s*(?!.*=>)/
    );
    if (constMatch && !constArrowMatch) {
      exports.push({
        name: constMatch[1],
        kind: "constant",
        isDefault: false,
        params: [],
        isAsync: false,
      });
      continue;
    }

    // export class
    const classMatch = trimmed.match(/^export\s+(default\s+)?class\s+(\w+)/);
    if (classMatch) {
      exports.push({
        name: classMatch[2],
        kind: "class",
        isDefault: !!classMatch[1],
        params: [],
        isAsync: false,
      });
      continue;
    }

    // export interface / export type
    const typeMatch = trimmed.match(
      /^export\s+(interface|type)\s+(\w+)/
    );
    if (typeMatch) {
      exports.push({
        name: typeMatch[2],
        kind: typeMatch[1] as "type" | "interface",
        isDefault: false,
        params: [],
        isAsync: false,
      });
      continue;
    }
  }

  return exports;
}

function parseParams(paramString: string): string[] {
  if (!paramString.trim()) return [];
  return paramString
    .split(",")
    .map((p) => {
      const name = p.trim().split(":")[0].split("=")[0].trim();
      return name.replace(/[{}]/g, "").trim();
    })
    .filter(Boolean);
}

function extractComponentProps(code: string, componentName: string): ComponentProps[] {
  const props: ComponentProps[] = [];

  // Look for Props interface/type
  const propsTypeRegex = new RegExp(
    `(?:interface|type)\\s+${componentName}Props\\s*(?:=\\s*)?\\{([\\s\\S]*?)\\}`,
    "m"
  );
  const propsMatch = propsTypeRegex.exec(code);

  if (!propsMatch) {
    // Try generic Props
    const genericPropsRegex =
      /(?:interface|type)\s+Props\s*(?:=\s*)?\{([\s\S]*?)\}/m;
    const genericMatch = genericPropsRegex.exec(code);
    if (genericMatch) {
      return parsePropsBody(genericMatch[1]);
    }

    // Try inline destructured props
    const inlinePropsRegex = new RegExp(
      `function\\s+${componentName}\\s*\\(\\s*\\{([^}]+)\\}`,
      "m"
    );
    const inlineMatch = inlinePropsRegex.exec(code);
    if (inlineMatch) {
      return inlineMatch[1]
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => {
          const [name, type] = p.split(":").map((s) => s.trim());
          return {
            name: name.replace("?", ""),
            type: type || "unknown",
            required: !p.includes("?") && !p.includes("="),
          };
        });
    }

    return props;
  }

  return parsePropsBody(propsMatch[1]);
}

function parsePropsBody(body: string): ComponentProps[] {
  const props: ComponentProps[] = [];
  const lines = body.split("\n");

  for (const line of lines) {
    const trimmed = line.trim().replace(/;$/, "").replace(/,$/, "");
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*")) continue;

    const propMatch = trimmed.match(/^(\w+)(\?)?:\s*(.+)/);
    if (propMatch) {
      props.push({
        name: propMatch[1],
        type: propMatch[3].trim(),
        required: !propMatch[2],
      });
    }
  }

  return props;
}

function getFileBaseName(filePath: string): string {
  const parts = filePath.split("/");
  const fileName = parts[parts.length - 1];
  return fileName.replace(/\.(tsx?|jsx?)$/, "");
}

function getImportPath(filePath: string): string {
  // Convert to relative import from test file perspective
  const parts = filePath.split("/");
  const fileName = parts[parts.length - 1].replace(/\.(tsx?|jsx?)$/, "");
  return `./${fileName}`;
}

function generateComponentTest(
  item: ExportedItem,
  props: ComponentProps[],
  importPath: string
): string {
  const lines: string[] = [];

  lines.push(`  describe("${item.name}", () => {`);

  // Generate default props
  if (props.length > 0) {
    lines.push(`    const defaultProps = {`);
    for (const prop of props) {
      if (!prop.required) continue;
      const defaultValue = getDefaultValueForType(prop.type);
      lines.push(`      ${prop.name}: ${defaultValue},`);
    }
    lines.push(`    };`);
    lines.push("");
  }

  // Render test
  lines.push(`    it("should render without crashing", () => {`);
  if (props.length > 0) {
    lines.push(`      render(<${item.name} {...defaultProps} />);`);
  } else {
    lines.push(`      render(<${item.name} />);`);
  }
  lines.push(`    });`);

  // Test for each prop
  for (const prop of props) {
    if (prop.type === "string") {
      lines.push("");
      lines.push(`    it("should display ${prop.name}", () => {`);
      lines.push(
        `      render(<${item.name} {...defaultProps} ${prop.name}="test value" />);`
      );
      lines.push(
        `      expect(screen.getByText("test value")).toBeInTheDocument();`
      );
      lines.push(`    });`);
    }

    if (prop.type.includes("=>") || prop.type.includes("Function")) {
      lines.push("");
      lines.push(`    it("should call ${prop.name} when triggered", () => {`);
      lines.push(`      const mockFn = vi.fn();`);
      lines.push(
        `      render(<${item.name} {...defaultProps} ${prop.name}={mockFn} />);`
      );
      lines.push(`      // TODO: trigger the event that calls ${prop.name}`);
      lines.push(`      // expect(mockFn).toHaveBeenCalled();`);
      lines.push(`    });`);
    }
  }

  // Snapshot test
  lines.push("");
  lines.push(`    it("should match snapshot", () => {`);
  if (props.length > 0) {
    lines.push(
      `      const { container } = render(<${item.name} {...defaultProps} />);`
    );
  } else {
    lines.push(`      const { container } = render(<${item.name} />);`);
  }
  lines.push(`      expect(container).toMatchSnapshot();`);
  lines.push(`    });`);

  lines.push(`  });`);

  return lines.join("\n");
}

function generateFunctionTest(item: ExportedItem): string {
  const lines: string[] = [];

  lines.push(`  describe("${item.name}", () => {`);

  lines.push(`    it("should be defined", () => {`);
  lines.push(`      expect(${item.name}).toBeDefined();`);
  lines.push(`    });`);

  lines.push("");
  lines.push(`    it("should return expected result", () => {`);
  if (item.params.length > 0) {
    const args = item.params
      .map((p) => `/* ${p} */`)
      .join(", ");
    if (item.isAsync) {
      lines.push(`      const result = await ${item.name}(${args});`);
    } else {
      lines.push(`      const result = ${item.name}(${args});`);
    }
  } else {
    if (item.isAsync) {
      lines.push(`      const result = await ${item.name}();`);
    } else {
      lines.push(`      const result = ${item.name}();`);
    }
  }
  lines.push(`      // TODO: add assertion for expected result`);
  lines.push(`      expect(result).toBeDefined();`);
  lines.push(`    });`);

  if (item.params.length > 0) {
    lines.push("");
    lines.push(`    it("should handle edge cases", () => {`);
    lines.push(`      // TODO: test with edge case inputs`);
    lines.push(
      `      // expect(() => ${item.name}(invalidInput)).toThrow();`
    );
    lines.push(`    });`);
  }

  if (item.isAsync) {
    lines.push("");
    lines.push(`    it("should handle errors gracefully", async () => {`);
    lines.push(`      // TODO: mock dependencies to throw`);
    lines.push(
      `      // await expect(${item.name}(badInput)).rejects.toThrow();`
    );
    lines.push(`    });`);
  }

  lines.push(`  });`);

  return lines.join("\n");
}

function generateClassTest(item: ExportedItem): string {
  const lines: string[] = [];

  lines.push(`  describe("${item.name}", () => {`);
  lines.push(`    let instance: ${item.name};`);
  lines.push("");
  lines.push(`    beforeEach(() => {`);
  lines.push(`      instance = new ${item.name}();`);
  lines.push(`    });`);
  lines.push("");
  lines.push(`    it("should be instantiable", () => {`);
  lines.push(`      expect(instance).toBeInstanceOf(${item.name});`);
  lines.push(`    });`);
  lines.push("");
  lines.push(`    // TODO: add tests for each method`);
  lines.push(`  });`);

  return lines.join("\n");
}

function getDefaultValueForType(type: string): string {
  const normalized = type.trim().toLowerCase();

  if (normalized === "string") return '"test"';
  if (normalized === "number") return "0";
  if (normalized === "boolean") return "false";
  if (normalized.includes("[]")) return "[]";
  if (normalized.includes("react.reactnode") || normalized === "reactnode")
    return "<span>test</span>";
  if (normalized.includes("=>") || normalized.includes("function"))
    return "vi.fn()";
  if (normalized.startsWith("{")) return "{}";

  return "undefined";
}

export function generateTestTemplate(code: string, filePath: string): string {
  const exportedItems = detectExports(code);
  const baseName = getFileBaseName(filePath);
  const importPath = getImportPath(filePath);

  const hasComponents = exportedItems.some((e) => e.kind === "component");
  const hasFunctions = exportedItems.some(
    (e) => e.kind === "function" || e.kind === "class"
  );

  const lines: string[] = [];

  // Imports
  lines.push(`import { describe, it, expect, vi, beforeEach } from "vitest";`);

  if (hasComponents) {
    lines.push(`import { render, screen, fireEvent } from "@testing-library/react";`);
  }

  // Import items under test
  const namedImports = exportedItems
    .filter((e) => !e.isDefault && e.kind !== "type" && e.kind !== "interface")
    .map((e) => e.name);
  const defaultImport = exportedItems.find(
    (e) => e.isDefault && e.kind !== "type" && e.kind !== "interface"
  );

  const importParts: string[] = [];
  if (defaultImport) {
    importParts.push(defaultImport.name);
  }
  if (namedImports.length > 0) {
    const named = `{ ${namedImports.join(", ")} }`;
    if (defaultImport) {
      importParts.push(`, ${named}`);
    } else {
      importParts.push(named);
    }
  }

  if (importParts.length > 0) {
    lines.push(
      `import ${importParts.join("")} from "${importPath}";`
    );
  }

  lines.push("");
  lines.push(`describe("${baseName}", () => {`);

  // Generate test blocks for each exported item
  const testBlocks: string[] = [];

  for (const item of exportedItems) {
    if (item.kind === "type" || item.kind === "interface") continue;

    if (item.kind === "component") {
      const props = extractComponentProps(code, item.name);
      testBlocks.push(generateComponentTest(item, props, importPath));
    } else if (item.kind === "function") {
      testBlocks.push(generateFunctionTest(item));
    } else if (item.kind === "class") {
      testBlocks.push(generateClassTest(item));
    } else if (item.kind === "constant") {
      testBlocks.push(
        `  describe("${item.name}", () => {\n    it("should be defined", () => {\n      expect(${item.name}).toBeDefined();\n    });\n  });`
      );
    }
  }

  if (testBlocks.length === 0) {
    testBlocks.push(
      `  it("should be implemented", () => {\n    // TODO: add tests\n    expect(true).toBe(true);\n  });`
    );
  }

  lines.push(testBlocks.join("\n\n"));
  lines.push(`});`);
  lines.push("");

  return lines.join("\n");
}
