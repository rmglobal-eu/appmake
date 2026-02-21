/**
 * Maps a selected DOM element back to its JSX source in the generated files.
 * Uses multiple strategies in priority order.
 */

import type { SelectedElement } from "@/lib/stores/builder-store";

export interface SourceMatch {
  filePath: string;
  /** The full matched source text (line or region) */
  fullMatch: string;
  /** The opening JSX tag (e.g., `<h1 className="text-xl font-bold">`) */
  jsxOpenTag: string;
  /** Text content if any */
  textContent: string | null;
  confidence: "high" | "medium" | "low";
}

/**
 * Attempt to find the JSX source for a selected element.
 * Searches across all .tsx/.jsx files in generatedFiles.
 */
export function findElementInSource(
  element: SelectedElement,
  files: Record<string, string>
): SourceMatch | null {
  const jsxFiles = Object.entries(files).filter(([p]) =>
    /\.(tsx|jsx)$/.test(p)
  );

  // Strategy 1: className match (highest confidence)
  if (element.className) {
    const elementClasses = new Set(
      element.className.split(/\s+/).filter((c) => c.length > 0)
    );
    if (elementClasses.size > 0) {
      for (const [filePath, content] of jsxFiles) {
        const match = matchByClassName(
          content,
          element.tagName,
          elementClasses
        );
        if (match) {
          return { filePath, ...match, confidence: "high" };
        }
      }
    }
  }

  // Strategy 2: Text + tag match
  if (element.text && element.text.length > 2 && element.text.length < 200) {
    for (const [filePath, content] of jsxFiles) {
      const match = matchByTextAndTag(content, element.tagName, element.text);
      if (match) {
        return { filePath, ...match, confidence: "high" };
      }
    }
  }

  // Strategy 3: Attribute match (id, href, src, placeholder)
  if (element.attributes) {
    for (const [filePath, content] of jsxFiles) {
      const match = matchByAttributes(
        content,
        element.tagName,
        element.attributes
      );
      if (match) {
        return { filePath, ...match, confidence: "medium" };
      }
    }
  }

  // Strategy 4: outerHTML snippet match (low confidence)
  if (element.outerHtmlSnippet) {
    for (const [filePath, content] of jsxFiles) {
      const match = matchByOuterHtml(content, element.outerHtmlSnippet);
      if (match) {
        return { filePath, ...match, confidence: "low" };
      }
    }
  }

  return null;
}

function matchByClassName(
  source: string,
  tagName: string,
  elementClasses: Set<string>
): Omit<SourceMatch, "filePath" | "confidence"> | null {
  // Match JSX tags with className
  const tagRegex = new RegExp(
    `<${tagName}[^>]*className=["'{]([^"'}]+)["'}][^>]*>([^<]{0,200})?`,
    "g"
  );
  let best: { match: RegExpExecArray; overlap: number } | null = null;

  let m;
  while ((m = tagRegex.exec(source)) !== null) {
    const sourceClasses = new Set(
      m[1].split(/\s+/).filter((c) => c.length > 0)
    );
    // Count overlap
    let overlap = 0;
    for (const cls of elementClasses) {
      if (sourceClasses.has(cls)) overlap++;
    }
    // Require at least 50% match of element's classes
    if (overlap >= Math.ceil(elementClasses.size * 0.5)) {
      if (!best || overlap > best.overlap) {
        best = { match: m, overlap };
      }
    }
  }

  if (!best) return null;

  // Extract full opening tag
  const fullMatch = best.match[0];
  const openTagEnd = fullMatch.indexOf(">") + 1;
  const jsxOpenTag = fullMatch.slice(0, openTagEnd);
  const textContent = best.match[2]?.trim() || null;

  return { fullMatch, jsxOpenTag, textContent };
}

function matchByTextAndTag(
  source: string,
  tagName: string,
  text: string
): Omit<SourceMatch, "filePath" | "confidence"> | null {
  // Escape regex special chars in text
  const escapedText = text
    .slice(0, 60)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Match: <tagName ...>text (allowing JSX expressions)
  const regex = new RegExp(
    `(<${tagName}[^>]*>)\\s*${escapedText}`,
    "i"
  );
  const m = regex.exec(source);
  if (!m) return null;

  return {
    fullMatch: m[0],
    jsxOpenTag: m[1],
    textContent: text,
  };
}

function matchByAttributes(
  source: string,
  tagName: string,
  attributes: Record<string, string>
): Omit<SourceMatch, "filePath" | "confidence"> | null {
  // Try unique attributes: id first, then href, src, placeholder
  for (const attr of ["id", "href", "src", "placeholder"]) {
    const val = attributes[attr];
    if (!val) continue;

    const escapedVal = val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `(<${tagName}[^>]*${attr}=["']${escapedVal}["'][^>]*>)`,
      "i"
    );
    const m = regex.exec(source);
    if (m) {
      return { fullMatch: m[0], jsxOpenTag: m[1], textContent: null };
    }
  }

  return null;
}

function matchByOuterHtml(
  source: string,
  snippet: string
): Omit<SourceMatch, "filePath" | "confidence"> | null {
  // Extract tag name and a distinctive substring from the snippet
  const tagMatch = snippet.match(/^<(\w+)/);
  if (!tagMatch) return null;
  const tagName = tagMatch[1].toLowerCase();

  // Find any className in the snippet
  const classMatch = snippet.match(/class(?:Name)?=["']([^"']+)["']/);
  if (classMatch) {
    // Try to find this class combo in source
    const firstFewClasses = classMatch[1].split(/\s+/).slice(0, 3).join("\\s+");
    const regex = new RegExp(
      `(<${tagName}[^>]*className=["'][^"']*${firstFewClasses}[^"']*["'][^>]*>)`,
      "i"
    );
    const m = regex.exec(source);
    if (m) {
      return { fullMatch: m[0], jsxOpenTag: m[1], textContent: null };
    }
  }

  return null;
}
