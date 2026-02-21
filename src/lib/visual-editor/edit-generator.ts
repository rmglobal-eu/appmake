/**
 * Generates source code edits from visual editor changes.
 * Takes a SourceMatch and a visual edit payload, produces old/new text for search-replace.
 */

import type { SourceMatch } from "./source-matcher";
import { cssToTailwind, mergeClassNames } from "./tailwind-mapper";

export interface SourceEdit {
  filePath: string;
  oldText: string;
  newText: string;
}

/**
 * Generate a text content edit (replacing inner text of a JSX element).
 */
export function generateTextEdit(
  match: SourceMatch,
  oldText: string,
  newText: string
): SourceEdit | null {
  if (!match.textContent && !oldText) return null;

  // Find the old text in the full match context and replace it
  const textToFind = match.textContent || oldText;
  if (!match.fullMatch.includes(textToFind)) return null;

  return {
    filePath: match.filePath,
    oldText: textToFind,
    newText: newText,
  };
}

/**
 * Generate a style edit by modifying Tailwind classes in the className attribute.
 * Falls back to inline style={{}} when Tailwind mapping fails.
 */
export function generateStyleEdit(
  match: SourceMatch,
  styles: Record<string, string>
): SourceEdit | null {
  const newTailwindClasses: string[] = [];
  const inlineStyles: Record<string, string> = {};

  for (const [prop, value] of Object.entries(styles)) {
    const twClass = cssToTailwind(prop, value);
    if (twClass) {
      newTailwindClasses.push(twClass);
    } else {
      // Can't map to Tailwind — use inline style
      inlineStyles[prop] = value;
    }
  }

  if (newTailwindClasses.length === 0 && Object.keys(inlineStyles).length === 0) {
    return null;
  }

  const openTag = match.jsxOpenTag;

  // Extract existing className
  const classNameMatch = openTag.match(
    /className=["']([^"']*?)["']/
  );
  const existingClassName = classNameMatch?.[1] ?? "";

  let newOpenTag = openTag;

  // Apply Tailwind class changes
  if (newTailwindClasses.length > 0) {
    const mergedClassName = mergeClassNames(
      existingClassName,
      newTailwindClasses
    );

    if (classNameMatch) {
      // Replace existing className
      newOpenTag = newOpenTag.replace(
        classNameMatch[0],
        `className="${mergedClassName}"`
      );
    } else {
      // Add className attribute before the closing >
      newOpenTag = newOpenTag.replace(
        />$/,
        ` className="${mergedClassName}">`
      );
      // Handle self-closing tags
      newOpenTag = newOpenTag.replace(
        /\/>$/,
        ` className="${mergedClassName}" />`
      );
    }
  }

  // Apply inline styles (only if Tailwind couldn't handle some properties)
  if (Object.keys(inlineStyles).length > 0) {
    const styleObj = Object.entries(inlineStyles)
      .map(([k, v]) => `${k}: "${v}"`)
      .join(", ");

    // Check if style={{}} already exists
    const styleMatch = newOpenTag.match(/style=\{\{([^}]*)\}\}/);
    if (styleMatch) {
      // Merge with existing inline styles
      newOpenTag = newOpenTag.replace(
        styleMatch[0],
        `style={{${styleMatch[1]}, ${styleObj}}}`
      );
    } else {
      // Add style attribute
      newOpenTag = newOpenTag.replace(
        />$/,
        ` style={{${styleObj}}}>`
      );
      newOpenTag = newOpenTag.replace(
        /\/>$/,
        ` style={{${styleObj}}} />`
      );
    }
  }

  if (newOpenTag === openTag) return null;

  return {
    filePath: match.filePath,
    oldText: openTag,
    newText: newOpenTag,
  };
}
