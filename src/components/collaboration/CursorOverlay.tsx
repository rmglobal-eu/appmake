"use client";

import { useEffect, useState } from "react";

interface CursorData {
  userId: string;
  name: string;
  color: string;
  line: number;
  column: number;
}

interface CursorOverlayProps {
  cursors: CursorData[];
}

/**
 * Overlay component that renders other collaborators' cursor positions
 * in the code editor area. Must be placed inside a positioned parent
 * (relative/absolute) that matches the editor dimensions.
 *
 * Each cursor shows a colored caret line and a floating name label.
 * Labels auto-fade after a brief period to reduce visual clutter.
 */
export default function CursorOverlay({ cursors }: CursorOverlayProps) {
  // Track which cursors recently moved (to show labels temporarily)
  const [recentlyMoved, setRecentlyMoved] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Mark all current cursors as recently moved
    const ids = new Set(cursors.map((c) => c.userId));
    setRecentlyMoved(ids);

    // Fade out labels after 3 seconds of inactivity
    const timer = setTimeout(() => {
      setRecentlyMoved(new Set());
    }, 3000);

    return () => clearTimeout(timer);
  }, [cursors]);

  if (cursors.length === 0) return null;

  // Approximate character dimensions (monospace font).
  // These should match the editor's font-size and line-height.
  const LINE_HEIGHT = 20; // px
  const CHAR_WIDTH = 7.8; // px (approximate for 13px monospace)
  const TOP_OFFSET = 0; // px from top of editor content area

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
      aria-hidden="true"
    >
      {cursors.map((cursor) => {
        const top = TOP_OFFSET + (cursor.line - 1) * LINE_HEIGHT;
        const left = cursor.column * CHAR_WIDTH;
        const showLabel = recentlyMoved.has(cursor.userId);

        return (
          <div
            key={cursor.userId}
            className="absolute transition-all duration-150 ease-out"
            style={{
              top: `${top}px`,
              left: `${left}px`,
            }}
          >
            {/* Cursor caret line */}
            <div
              className="w-0.5 rounded-full"
              style={{
                backgroundColor: cursor.color,
                height: `${LINE_HEIGHT}px`,
                boxShadow: `0 0 4px ${cursor.color}40`,
              }}
            />

            {/* Name label */}
            <div
              className={`absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight text-white shadow-md transition-opacity duration-300 ${
                showLabel ? "opacity-100" : "opacity-0"
              }`}
              style={{
                backgroundColor: cursor.color,
              }}
            >
              {cursor.name}
              {/* Arrow pointing down to cursor */}
              <div
                className="absolute -bottom-1 left-0 h-0 w-0"
                style={{
                  borderLeft: "4px solid transparent",
                  borderRight: "4px solid transparent",
                  borderTop: `4px solid ${cursor.color}`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
