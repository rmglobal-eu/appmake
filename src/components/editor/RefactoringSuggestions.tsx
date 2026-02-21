"use client";

import { useState, useCallback } from "react";
import type { RefactoringSuggestion } from "@/lib/llm/refactoring-engine";

interface RefactoringSuggestionsProps {
  suggestions: RefactoringSuggestion[];
  onAccept: (suggestion: RefactoringSuggestion) => void;
  onDismiss: (index: number) => void;
}

const typeBadgeColors: Record<RefactoringSuggestion["type"], string> = {
  "extract-component": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "simplify-logic": "bg-green-500/20 text-green-300 border-green-500/30",
  "improve-naming": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "remove-duplication": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "add-types": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "optimize-performance": "bg-red-500/20 text-red-300 border-red-500/30",
};

const typeLabels: Record<RefactoringSuggestion["type"], string> = {
  "extract-component": "Extract",
  "simplify-logic": "Simplify",
  "improve-naming": "Naming",
  "remove-duplication": "Duplication",
  "add-types": "Types",
  "optimize-performance": "Performance",
};

const impactColors: Record<string, string> = {
  low: "text-zinc-500",
  medium: "text-yellow-400",
  high: "text-red-400",
};

export default function RefactoringSuggestions({
  suggestions,
  onAccept,
  onDismiss,
}: RefactoringSuggestionsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = useCallback(
    (index: number) => {
      setExpandedIndex((prev) => (prev === index ? null : index));
    },
    []
  );

  if (suggestions.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-zinc-500">
          No refactoring suggestions found. The code looks clean.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="px-2 py-1">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">
          {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {suggestions.map((suggestion, index) => {
        const isExpanded = expandedIndex === index;

        return (
          <div
            key={index}
            className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
          >
            {/* Header */}
            <button
              onClick={() => toggleExpand(index)}
              className="w-full flex items-start gap-3 p-3 text-left hover:bg-zinc-800/50 transition-colors"
            >
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 mt-0.5 ${
                  typeBadgeColors[suggestion.type]
                }`}
              >
                {typeLabels[suggestion.type]}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 leading-snug">
                  {suggestion.description}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-zinc-600">
                    Impact:{" "}
                    <span className={impactColors[suggestion.impact]}>
                      {suggestion.impact}
                    </span>
                  </span>
                  <span className="text-xs text-zinc-600">
                    Effort:{" "}
                    <span className="text-zinc-400">{suggestion.effort}</span>
                  </span>
                </div>
              </div>

              <svg
                className={`w-4 h-4 text-zinc-500 flex-shrink-0 mt-1 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Expanded Diff View */}
            {isExpanded && (
              <div className="border-t border-zinc-800">
                {/* Before */}
                <div className="px-3 pt-3 pb-1">
                  <div className="text-xs text-red-400 font-medium mb-1">
                    Before
                  </div>
                  <pre className="text-xs text-zinc-400 bg-red-500/5 border border-red-500/10 rounded p-2 overflow-x-auto font-mono whitespace-pre-wrap">
                    {suggestion.before}
                  </pre>
                </div>

                {/* After */}
                <div className="px-3 pt-2 pb-3">
                  <div className="text-xs text-green-400 font-medium mb-1">
                    After
                  </div>
                  <pre className="text-xs text-zinc-300 bg-green-500/5 border border-green-500/10 rounded p-2 overflow-x-auto font-mono whitespace-pre-wrap">
                    {suggestion.after}
                  </pre>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-3 pb-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAccept(suggestion);
                    }}
                    className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss(index);
                    }}
                    className="flex-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded border border-zinc-700 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
