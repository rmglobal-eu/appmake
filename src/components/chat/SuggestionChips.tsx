"use client";

import { ArrowUpRight, Palette, Zap, Database } from "lucide-react";

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

/** Categorize a suggestion based on keywords */
function categorize(
  suggestion: string
): { color: string; icon: typeof Palette } {
  const lower = suggestion.toLowerCase();

  // Design suggestions
  if (
    /\b(animation|style|color|theme|dark mode|responsive|layout|gradient|font|design|hover|shadow|transition)\b/.test(
      lower
    )
  ) {
    return { color: "violet", icon: Palette };
  }

  // Data/backend suggestions
  if (
    /\b(supabase|database|api|data|backend|auth|storage|fetch|connect)\b/.test(
      lower
    )
  ) {
    return { color: "emerald", icon: Database };
  }

  // Feature suggestions (default)
  return { color: "blue", icon: Zap };
}

const COLOR_CLASSES: Record<string, string> = {
  violet:
    "border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-500/10 text-violet-300/80 hover:text-violet-200",
  blue: "border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/10 text-blue-300/80 hover:text-blue-200",
  emerald:
    "border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300/80 hover:text-emerald-200",
};

const DOT_CLASSES: Record<string, string> = {
  violet: "bg-violet-400",
  blue: "bg-blue-400",
  emerald: "bg-emerald-400",
};

export function SuggestionChips({
  suggestions,
  onSelect,
}: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
        Next steps
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, i) => {
          const { color } = categorize(suggestion);
          return (
            <button
              key={i}
              onClick={() => onSelect(suggestion)}
              className={`group flex items-center gap-2 rounded-full border bg-white/[0.02] px-3 py-1.5 text-xs backdrop-blur-sm transition-all duration-200 ${COLOR_CLASSES[color]}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[color]} opacity-60 group-hover:opacity-100 transition-opacity`}
              />
              {suggestion}
              <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
