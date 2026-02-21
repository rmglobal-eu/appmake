/**
 * Cursor synchronization utilities for collaborative editing.
 * Handles encoding/decoding cursor positions and deterministic color assignment.
 */

import type { CursorPosition } from "./presence";

// Re-export CursorPosition for convenience
export type { CursorPosition } from "./presence";

/**
 * Predefined set of distinguishable cursor colors for collaborators.
 * These are chosen for high contrast on both light and dark backgrounds.
 */
const CURSOR_COLORS = [
  "#F87171", // red-400
  "#60A5FA", // blue-400
  "#34D399", // emerald-400
  "#FBBF24", // amber-400
  "#A78BFA", // violet-400
  "#F472B6", // pink-400
  "#2DD4BF", // teal-400
  "#FB923C", // orange-400
  "#818CF8", // indigo-400
  "#4ADE80", // green-400
  "#E879F9", // fuchsia-400
  "#38BDF8", // sky-400
  "#C084FC", // purple-400
  "#FCD34D", // yellow-300
  "#FDA4AF", // rose-300
  "#67E8F9", // cyan-300
] as const;

/**
 * Separator used for encoding cursor positions.
 * Using pipe character since it's unlikely in file paths.
 */
const SEPARATOR = "|";

/**
 * Encode a CursorPosition into a compact string representation.
 * Format: "filePath|line|column"
 *
 * @example
 * encodeCursor({ filePath: "src/App.tsx", line: 42, column: 10 })
 * // => "src/App.tsx|42|10"
 */
export function encodeCursor(cursor: CursorPosition): string {
  return `${cursor.filePath}${SEPARATOR}${cursor.line}${SEPARATOR}${cursor.column}`;
}

/**
 * Decode a compact string representation back into a CursorPosition.
 * Throws if the format is invalid.
 *
 * @example
 * decodeCursor("src/App.tsx|42|10")
 * // => { filePath: "src/App.tsx", line: 42, column: 10 }
 */
export function decodeCursor(data: string): CursorPosition {
  const lastSep = data.lastIndexOf(SEPARATOR);
  if (lastSep === -1) {
    throw new Error(`Invalid cursor data: missing separator in "${data}"`);
  }

  const beforeLast = data.substring(0, lastSep);
  const column = data.substring(lastSep + 1);

  const firstSep = beforeLast.lastIndexOf(SEPARATOR);
  if (firstSep === -1) {
    throw new Error(`Invalid cursor data: missing second separator in "${data}"`);
  }

  const filePath = beforeLast.substring(0, firstSep);
  const line = beforeLast.substring(firstSep + 1);

  const lineNum = parseInt(line, 10);
  const colNum = parseInt(column, 10);

  if (isNaN(lineNum) || isNaN(colNum)) {
    throw new Error(`Invalid cursor data: non-numeric line/column in "${data}"`);
  }

  if (lineNum < 0 || colNum < 0) {
    throw new Error(`Invalid cursor data: negative line/column in "${data}"`);
  }

  return {
    filePath,
    line: lineNum,
    column: colNum,
  };
}

/**
 * Calculate a deterministic color for a user based on their userId.
 * The same userId always produces the same color, ensuring consistency
 * across sessions and components.
 *
 * Uses a simple hash function (djb2) for fast, well-distributed mapping.
 */
export function calculateCursorColor(userId: string): string {
  let hash = 5381;
  for (let i = 0; i < userId.length; i++) {
    // hash * 33 + char
    hash = ((hash << 5) + hash + userId.charCodeAt(i)) >>> 0;
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

/**
 * Get all available cursor colors (useful for legend/display purposes).
 */
export function getAvailableCursorColors(): readonly string[] {
  return CURSOR_COLORS;
}

/**
 * Batch encode multiple cursor positions.
 */
export function encodeCursors(cursors: CursorPosition[]): string[] {
  return cursors.map(encodeCursor);
}

/**
 * Batch decode multiple cursor strings.
 * Returns null for any that fail to decode.
 */
export function decodeCursors(data: string[]): (CursorPosition | null)[] {
  return data.map((d) => {
    try {
      return decodeCursor(d);
    } catch {
      return null;
    }
  });
}

/**
 * Check if two cursor positions are at the same location.
 */
export function cursorsEqual(a: CursorPosition, b: CursorPosition): boolean {
  return a.filePath === b.filePath && a.line === b.line && a.column === b.column;
}

/**
 * Check if two cursors are in the same file.
 */
export function cursorsInSameFile(a: CursorPosition, b: CursorPosition): boolean {
  return a.filePath === b.filePath;
}
