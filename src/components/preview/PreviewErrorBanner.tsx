"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Wrench, X, Check, Loader2, MessageSquare, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { usePreviewErrorStore, type PreviewError, type GhostFixStatus } from "@/lib/stores/preview-error-store";

export function PreviewErrorBanner() {
  const { errors, ghostFixStatus, ghostFixMessage, clearErrors, requestManualGhostFix } =
    usePreviewErrorStore();
  const [expanded, setExpanded] = useState(false);

  // Toast on successful fix
  useEffect(() => {
    if (ghostFixStatus === "success") {
      toast.success("Preview fixed");
    }
  }, [ghostFixStatus]);

  // Ghost fix in progress — show subtle indicator
  if (ghostFixStatus === "fixing" || ghostFixStatus === "verifying") {
    return (
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1.5 shadow-sm">
        <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />
        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
          {ghostFixMessage || (ghostFixStatus === "fixing" ? "Fixing preview..." : "Verifying fix...")}
        </span>
      </div>
    );
  }

  // Success state — brief green pill (auto-hides via store reset to idle)
  if (ghostFixStatus === "success") {
    return (
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-3 py-1.5 shadow-sm animate-in fade-in duration-300">
        <Check className="h-3 w-3 text-green-500" />
        <span className="text-[11px] text-green-700 dark:text-green-400 font-medium">
          Preview fixed
        </span>
      </div>
    );
  }

  // Failed state — auto-fix exhausted all attempts
  if (ghostFixStatus === "failed" && errors.length > 0) {
    return (
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
        <div className="flex flex-col gap-2 px-3 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <span className="text-xs text-red-700 dark:text-red-400 font-medium flex-1">
              Auto-fix could not solve the error
            </span>
            <button
              className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
              onClick={clearErrors}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1 rounded-md bg-red-100 dark:bg-red-900/30 px-2.5 py-1.5 text-[11px] text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium"
              onClick={() => requestManualGhostFix()}
            >
              <RotateCcw className="h-3 w-3" />
              Try again
            </button>
            <span className="text-[10px] text-red-400 dark:text-red-500 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Tip: describe the error in chat for help
            </span>
          </div>
        </div>
      </div>
    );
  }

  // No errors — nothing to show
  if (errors.length === 0) return null;

  // Errors with no active fix — show error banner
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
          <button
            className="flex items-center gap-1 rounded-md bg-red-100 dark:bg-red-900/30 px-2 py-1 text-[11px] text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            onClick={() => requestManualGhostFix()}
          >
            <Wrench className="h-3 w-3" />
            Fix with AI
          </button>
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
