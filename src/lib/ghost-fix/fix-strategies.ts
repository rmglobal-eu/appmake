/**
 * Fix Strategies for Ghost-Fix System
 *
 * Each strategy takes a classified error and the relevant source code,
 * then returns a code transformation suggestion (prompt or direct patch).
 */

import { ClassifiedError, ErrorType } from "./error-classifier";

export interface FixResult {
  /** Whether a fix was produced */
  success: boolean;
  /** The suggested code replacement or full file content */
  fixedCode?: string;
  /** Human-readable description of what was changed */
  description: string;
  /** The strategy that produced the fix */
  strategy: ErrorType;
  /** AI prompt to send if the fix requires AI assistance */
  aiPrompt?: string;
  /** Specific file to patch */
  targetFile?: string;
}

// ---------------------------------------------------------------------------
// Import fix strategy
// ---------------------------------------------------------------------------

const COMMON_REACT_IMPORTS: Record<string, string> = {
  useState: "react",
  useEffect: "react",
  useRef: "react",
  useMemo: "react",
  useCallback: "react",
  useContext: "react",
  useReducer: "react",
  useLayoutEffect: "react",
  Fragment: "react",
  Suspense: "react",
  lazy: "react",
  createContext: "react",
  forwardRef: "react",
  memo: "react",
  clsx: "clsx",
  cn: "@/lib/utils",
  motion: "framer-motion",
  AnimatePresence: "framer-motion",
  Link: "next/link",
  Image: "next/image",
  useRouter: "next/navigation",
  usePathname: "next/navigation",
  useSearchParams: "next/navigation",
};

const COMMON_ICON_IMPORTS: Record<string, string> = {
  ChevronDown: "lucide-react",
  ChevronUp: "lucide-react",
  ChevronLeft: "lucide-react",
  ChevronRight: "lucide-react",
  X: "lucide-react",
  Check: "lucide-react",
  Plus: "lucide-react",
  Minus: "lucide-react",
  Search: "lucide-react",
  Settings: "lucide-react",
  Loader2: "lucide-react",
  AlertCircle: "lucide-react",
  AlertTriangle: "lucide-react",
  Info: "lucide-react",
  ArrowRight: "lucide-react",
  ArrowLeft: "lucide-react",
  ExternalLink: "lucide-react",
  Copy: "lucide-react",
  Trash2: "lucide-react",
  Edit: "lucide-react",
  Eye: "lucide-react",
  EyeOff: "lucide-react",
};

export function fixMissingImport(
  error: ClassifiedError,
  sourceCode: string
): FixResult {
  const moduleMatch = error.originalError.match(
    /(?:Cannot find module|Module not found|Failed to resolve import|Could not resolve)\s+['"]([^'"]+)['"]/i
  );
  const exportMatch = error.originalError.match(
    /['"](\w+)['"]\s+is not exported from\s+['"]([^'"]+)['"]/i
  );
  const notDefinedMatch = error.originalError.match(
    /(\w+) is not defined/i
  );

  // Case 1: Known export not found — suggest the correct module
  if (exportMatch) {
    const [, name, fromModule] = exportMatch;
    return {
      success: true,
      description: `Fix import: "${name}" from "${fromModule}"`,
      strategy: "import-missing",
      aiPrompt: `The export "${name}" is not found in "${fromModule}". Fix the import statement. If the export was renamed or moved, update accordingly. If it doesn't exist, provide an alternative.\n\nCurrent code:\n${sourceCode}`,
      targetFile: error.file,
    };
  }

  // Case 2: Variable not defined — check if it's a known import
  if (notDefinedMatch) {
    const name = notDefinedMatch[1];
    const knownModule =
      COMMON_REACT_IMPORTS[name] || COMMON_ICON_IMPORTS[name];

    if (knownModule) {
      const isDefaultExport = name === "motion" || name === "Image" || name === "Link";
      const importStatement = isDefaultExport
        ? `import ${name} from "${knownModule}";`
        : `import { ${name} } from "${knownModule}";`;

      // Check if there's already an import from this module
      const existingImportRegex = new RegExp(
        `import\\s+\\{([^}]+)\\}\\s+from\\s+["']${knownModule.replace("/", "\\/")}["']`
      );
      const existingMatch = sourceCode.match(existingImportRegex);

      if (existingMatch && !isDefaultExport) {
        // Add to existing import
        const currentImports = existingMatch[1];
        const updatedImports = `${currentImports.trim()}, ${name}`;
        const fixedCode = sourceCode.replace(
          existingMatch[0],
          `import { ${updatedImports} } from "${knownModule}"`
        );
        return {
          success: true,
          fixedCode,
          description: `Added "${name}" to existing import from "${knownModule}"`,
          strategy: "import-missing",
          targetFile: error.file,
        };
      }

      // Add new import at the top
      const fixedCode = `${importStatement}\n${sourceCode}`;
      return {
        success: true,
        fixedCode,
        description: `Added import for "${name}" from "${knownModule}"`,
        strategy: "import-missing",
        targetFile: error.file,
      };
    }

    return {
      success: true,
      description: `"${name}" is not defined. Add the correct import or declaration.`,
      strategy: "import-missing",
      aiPrompt: `The identifier "${name}" is not defined. Add the correct import statement or declare it.\n\nCurrent code:\n${sourceCode}`,
      targetFile: error.file,
    };
  }

  // Case 3: Module not found
  if (moduleMatch) {
    const moduleName = moduleMatch[1];
    return {
      success: true,
      description: `Module "${moduleName}" not found. Fix the import path or install the package.`,
      strategy: "import-missing",
      aiPrompt: `The module "${moduleName}" cannot be found. Fix the import path if it's a local file, or suggest an alternative if it's an npm package.\n\nCurrent code:\n${sourceCode}`,
      targetFile: error.file,
    };
  }

  return {
    success: false,
    description: "Could not determine the missing import to fix.",
    strategy: "import-missing",
  };
}

// ---------------------------------------------------------------------------
// Type error fix strategy
// ---------------------------------------------------------------------------

export function fixTypeError(
  error: ClassifiedError,
  sourceCode: string
): FixResult {
  const nullAccessMatch = error.originalError.match(
    /Cannot read propert(?:y|ies) of (undefined|null)/
  );
  const notAFunctionMatch = error.originalError.match(
    /(\w+) is not a function/
  );
  const typeAssignMatch = error.originalError.match(
    /Type '([^']+)' is not assignable to type '([^']+)'/
  );
  const propMissingMatch = error.originalError.match(
    /Property '(\w+)' does not exist on type '([^']+)'/
  );

  if (nullAccessMatch) {
    return {
      success: true,
      description: `Add null safety: property access on ${nullAccessMatch[1]} value`,
      strategy: "type-error",
      aiPrompt: `Fix the null/undefined access error. Add optional chaining (?.) or proper null checks where properties are accessed on potentially ${nullAccessMatch[1]} values.\n\nError location: ${error.file || "unknown"}${error.line ? `:${error.line}` : ""}\nError: ${error.originalError}\n\nCurrent code:\n${sourceCode}`,
      targetFile: error.file,
    };
  }

  if (notAFunctionMatch) {
    const name = notAFunctionMatch[1];
    return {
      success: true,
      description: `"${name}" is not a function — fix the call or import`,
      strategy: "type-error",
      aiPrompt: `"${name}" is being called as a function but it isn't one. Either the import is wrong, the value is undefined, or it should be accessed differently.\n\nError: ${error.originalError}\n\nCurrent code:\n${sourceCode}`,
      targetFile: error.file,
    };
  }

  if (typeAssignMatch) {
    return {
      success: true,
      description: `Type mismatch: "${typeAssignMatch[1]}" → "${typeAssignMatch[2]}"`,
      strategy: "type-error",
      aiPrompt: `Fix the type mismatch. Type "${typeAssignMatch[1]}" is not assignable to type "${typeAssignMatch[2]}". Either transform the value, update the type definition, or use a proper type assertion.\n\nError: ${error.originalError}\n\nCurrent code:\n${sourceCode}`,
      targetFile: error.file,
    };
  }

  if (propMissingMatch) {
    return {
      success: true,
      description: `Property "${propMissingMatch[1]}" missing on type "${propMissingMatch[2]}"`,
      strategy: "type-error",
      aiPrompt: `Property "${propMissingMatch[1]}" does not exist on type "${propMissingMatch[2]}". Either add it to the type definition, fix the property name (typo?), or use a type assertion.\n\nError: ${error.originalError}\n\nCurrent code:\n${sourceCode}`,
      targetFile: error.file,
    };
  }

  // Fallback
  return {
    success: true,
    description: `Fix type error: ${error.message}`,
    strategy: "type-error",
    aiPrompt: `Fix this type error:\n${error.originalError}\n\nCurrent code:\n${sourceCode}`,
    targetFile: error.file,
  };
}

// ---------------------------------------------------------------------------
// Runtime error fix strategy
// ---------------------------------------------------------------------------

export function fixRuntime(
  error: ClassifiedError,
  sourceCode: string
): FixResult {
  const isInfiniteLoop = /Maximum call stack size exceeded/.test(
    error.originalError
  );
  const isReferenceError = /ReferenceError/.test(error.originalError);

  if (isInfiniteLoop) {
    return {
      success: true,
      description:
        "Infinite recursion or loop detected — add base case or fix dependencies",
      strategy: "runtime",
      aiPrompt: `Fix the infinite recursion / maximum call stack error. Common causes:\n- useEffect with missing or wrong dependency array\n- Recursive function without base case\n- State update inside render causing re-render loop\n- Component re-mounting itself endlessly\n\nError: ${error.originalError}\n\nCurrent code:\n${sourceCode}`,
      targetFile: error.file,
    };
  }

  if (isReferenceError) {
    return {
      success: true,
      description: `Reference error: ${error.message}`,
      strategy: "runtime",
      aiPrompt: `Fix the reference error. The variable or function is used but never declared or imported.\n\nError: ${error.originalError}\n\nCurrent code:\n${sourceCode}`,
      targetFile: error.file,
    };
  }

  return {
    success: true,
    description: `Fix runtime error: ${error.message}`,
    strategy: "runtime",
    aiPrompt: `Fix this runtime error:\n${error.originalError}\n\nCurrent code:\n${sourceCode}`,
    targetFile: error.file,
  };
}

// ---------------------------------------------------------------------------
// Syntax error fix strategy
// ---------------------------------------------------------------------------

export function fixSyntax(
  error: ClassifiedError,
  sourceCode: string
): FixResult {
  const unexpectedToken = error.originalError.match(
    /Unexpected token\s*['"]?(\S+?)['"]?(?:\s|$)/
  );
  const unterminatedString = /Unterminated string/.test(
    error.originalError
  );
  const unexpectedEnd = /Unexpected end of input/.test(
    error.originalError
  );

  const locationHint = error.line
    ? ` near line ${error.line}${error.column ? `, column ${error.column}` : ""}`
    : "";

  if (unterminatedString) {
    return {
      success: true,
      description: `Fix unterminated string literal${locationHint}`,
      strategy: "syntax",
      aiPrompt: `Fix the unterminated string literal${locationHint}. Find the unclosed quote and close it properly. Be careful with template literals and JSX string props.\n\nError: ${error.originalError}\n\nCurrent code:\n${sourceCode}`,
      targetFile: error.file,
    };
  }

  if (unexpectedEnd) {
    return {
      success: true,
      description: `Fix unexpected end of input — missing closing bracket/brace`,
      strategy: "syntax",
      aiPrompt: `Fix the "unexpected end of input" error. The code is missing a closing bracket, brace, or parenthesis. Check the nesting of {}, (), [], and JSX tags.\n\nError: ${error.originalError}\n\nCurrent code:\n${sourceCode}`,
      targetFile: error.file,
    };
  }

  if (unexpectedToken) {
    return {
      success: true,
      description: `Fix unexpected token "${unexpectedToken[1]}"${locationHint}`,
      strategy: "syntax",
      aiPrompt: `Fix the syntax error caused by unexpected token "${unexpectedToken[1]}"${locationHint}. Common causes: missing comma, extra/missing bracket, wrong operator, JSX expression without curly braces.\n\nError: ${error.originalError}\n\nCurrent code:\n${sourceCode}`,
      targetFile: error.file,
    };
  }

  return {
    success: true,
    description: `Fix syntax error${locationHint}: ${error.message}`,
    strategy: "syntax",
    aiPrompt: `Fix this syntax error${locationHint}:\n${error.originalError}\n\nCurrent code:\n${sourceCode}`,
    targetFile: error.file,
  };
}

// ---------------------------------------------------------------------------
// React hook violation fix strategy
// ---------------------------------------------------------------------------

export function fixHookViolation(
  error: ClassifiedError,
  sourceCode: string
): FixResult {
  const conditionalHook = error.originalError.match(
    /React Hook "(\w+)" is called conditionally/
  );
  const wrongContext = error.originalError.match(
    /React Hook "(\w+)" is called in a function that is neither/
  );
  const hookOrderMismatch =
    /Rendered (?:more|fewer) hooks than/.test(error.originalError) ||
    /Invalid hook call/.test(error.originalError);

  if (conditionalHook) {
    const hookName = conditionalHook[1];
    return {
      success: true,
      description: `Move "${hookName}" to top level — hooks cannot be called conditionally`,
      strategy: "react-hook-violation",
      aiPrompt: `The React Hook "${hookName}" is called conditionally. React hooks must be called in the exact same order every render.\n\nFix this by:\n1. Move the hook call to the top level of the component\n2. Use the hook's value conditionally instead of calling the hook conditionally\n3. If the hook is in a loop, refactor to use a single hook call\n\nError: ${error.originalError}\n\nCurrent code:\n${sourceCode}`,
      targetFile: error.file,
    };
  }

  if (wrongContext) {
    const hookName = wrongContext[1];
    return {
      success: true,
      description: `"${hookName}" called outside a component — move it into a component or custom hook`,
      strategy: "react-hook-violation",
      aiPrompt: `The React Hook "${hookName}" is called in a regular function, not a React component or custom hook.\n\nFix this by:\n1. Move the hook call into a React component (function starting with uppercase)\n2. Or rename the function to start with "use" to make it a custom hook\n3. Or restructure the code so hooks are only in components\n\nError: ${error.originalError}\n\nCurrent code:\n${sourceCode}`,
      targetFile: error.file,
    };
  }

  if (hookOrderMismatch) {
    return {
      success: true,
      description:
        "Hook order mismatch between renders — ensure consistent hook calls",
      strategy: "react-hook-violation",
      aiPrompt: `The number of hooks called changed between renders. This means hooks are being called conditionally or in a loop.\n\nFix this by:\n1. Move ALL hook calls to the top of the component, before any returns or conditions\n2. Never call hooks inside if/else blocks\n3. Never call hooks inside loops\n4. Never call hooks after early returns\n\nError: ${error.originalError}\n\nCurrent code:\n${sourceCode}`,
      targetFile: error.file,
    };
  }

  return {
    success: true,
    description: `Fix React hook violation: ${error.message}`,
    strategy: "react-hook-violation",
    aiPrompt: `Fix this React hook violation:\n${error.originalError}\n\nEnsure all hooks are called unconditionally at the top level of the component.\n\nCurrent code:\n${sourceCode}`,
    targetFile: error.file,
  };
}

// ---------------------------------------------------------------------------
// Strategy dispatcher
// ---------------------------------------------------------------------------

const STRATEGY_MAP: Record<
  ErrorType,
  (error: ClassifiedError, sourceCode: string) => FixResult
> = {
  "import-missing": fixMissingImport,
  "type-error": fixTypeError,
  runtime: fixRuntime,
  syntax: fixSyntax,
  "react-hook-violation": fixHookViolation,
  style: (_error, sourceCode) => ({
    success: true,
    description: `Fix style error: ${_error.message}`,
    strategy: "style",
    aiPrompt: `Fix this CSS/style error:\n${_error.originalError}\n\nCurrent code:\n${sourceCode}`,
    targetFile: _error.file,
  }),
  unknown: (_error, sourceCode) => ({
    success: true,
    description: `Analyze and fix: ${_error.message}`,
    strategy: "unknown",
    aiPrompt: `Analyze and fix this error:\n${_error.originalError}\n\nCurrent code:\n${sourceCode}`,
    targetFile: _error.file,
  }),
};

/**
 * Apply the appropriate fix strategy for a classified error.
 */
export function applyFixStrategy(
  error: ClassifiedError,
  sourceCode: string
): FixResult {
  const strategy = STRATEGY_MAP[error.type];
  return strategy(error, sourceCode);
}
