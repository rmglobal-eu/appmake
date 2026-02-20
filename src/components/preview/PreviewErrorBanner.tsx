"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Wrench, X } from "lucide-react";
import { usePreviewErrorStore, type PreviewError } from "@/lib/stores/preview-error-store";

export function PreviewErrorBanner() {
  const { errors, autoFixEnabled, autoFixInProgress, clearErrors, setAutoFixEnabled, requestManualFix } =
    usePreviewErrorStore();
  const [expanded, setExpanded] = useState(false);

  if (errors.length === 0) return null;

  const latestError = errors[errors.length - 1];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
        <button
          className="flex items-center gap-1 text-xs text-red-700 dark:text-red-400 font-medium flex-1 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {errors.length} error{errors.length > 1 ? "s" : ""} detected
        </button>
        <div className="flex items-center gap-1">
          {autoFixInProgress ? (
            <span className="text-[10px] text-muted-foreground animate-pulse">Auto-fixing...</span>
          ) : (
            <button
              className="flex items-center gap-1 rounded-md bg-red-100 dark:bg-red-900/30 px-2 py-1 text-[11px] text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              onClick={() => requestManualFix(latestError.message)}
            >
              <Wrench className="h-3 w-3" />
              Fix with AI
            </button>
          )}
          <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={autoFixEnabled}
              onChange={(e) => setAutoFixEnabled(e.target.checked)}
              className="h-3 w-3 rounded"
            />
            Auto-fix
          </label>
          <button
            className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            onClick={clearErrors}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Expanded error list */}
      {expanded && (
        <div className="max-h-[150px] overflow-auto border-t border-red-200 dark:border-red-800 px-3 py-2 space-y-1">
          {errors.map((err: PreviewError) => (
            <div key={err.id} className="text-[11px] font-mono text-red-600 dark:text-red-400">
              {err.source && (
                <span className="text-red-400 dark:text-red-500">
                  {err.source}
                  {err.line ? `:${err.line}` : ""}
                  {err.col ? `:${err.col}` : ""}
                  {" \u2014 "}
                </span>
              )}
              {err.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
