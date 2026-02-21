"use client";

import { useCallback } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Wrench,
  FileCode,
} from "lucide-react";
import { useState } from "react";
import {
  usePreviewErrorStore,
  type PreviewError,
  type GhostFixStatus,
} from "@/lib/stores/preview-error-store";

type FixStatus = GhostFixStatus;

function getStatusIcon(status: FixStatus) {
  switch (status) {
    case "fixing":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
    case "verifying":
      return <Loader2 className="h-4 w-4 animate-spin text-amber-400" />;
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-red-400" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-orange-400" />;
  }
}

function getStatusLabel(status: FixStatus): string {
  switch (status) {
    case "fixing":
      return "Fixing...";
    case "verifying":
      return "Verifying...";
    case "success":
      return "Fixed";
    case "failed":
      return "Fix failed";
    default:
      return "Error";
  }
}

function getStatusBadgeClasses(status: FixStatus): string {
  switch (status) {
    case "fixing":
      return "bg-blue-500/15 text-blue-400 border-blue-500/20";
    case "verifying":
      return "bg-amber-500/15 text-amber-400 border-amber-500/20";
    case "success":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
    case "failed":
      return "bg-red-500/15 text-red-400 border-red-500/20";
    default:
      return "bg-orange-500/15 text-orange-400 border-orange-500/20";
  }
}

function ErrorRow({
  error,
  onRetry,
  onDismiss,
  ghostFixStatus,
}: {
  error: PreviewError;
  onRetry: () => void;
  onDismiss: () => void;
  ghostFixStatus: GhostFixStatus;
}) {
  const fixStatus: FixStatus = ghostFixStatus;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group border border-white/5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      {/* Header row */}
      <div
        className="flex items-start gap-3 px-3 py-2.5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="mt-0.5 flex-shrink-0">
          {getStatusIcon(fixStatus)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/80 leading-snug line-clamp-2 font-mono">
            {error.message}
          </p>

          <div className="flex items-center gap-2 mt-1.5">
            {/* Status badge */}
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded border ${getStatusBadgeClasses(fixStatus)}`}
            >
              {getStatusLabel(fixStatus)}
            </span>

            {/* Error type */}
            {error.isBuildError && (
              <span className="text-[10px] text-white/30 uppercase tracking-wider">
                build
              </span>
            )}

            {/* File location */}
            {error.source && (
              <span className="flex items-center gap-1 text-[10px] text-white/30">
                <FileCode className="h-3 w-3" />
                {error.source}
                {error.line ? `:${error.line}` : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Retry button */}
          {(fixStatus === "failed" || fixStatus === "idle") && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
              title="Retry fix"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Dismiss button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Expand toggle */}
          <div className="p-1 text-white/20">
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-white/5">
          <div className="mt-2 space-y-2">
            {/* Full error message */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1">
                Full Error
              </p>
              <pre className="text-xs text-white/50 font-mono bg-black/30 rounded-md p-2 overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                {error.message}
              </pre>
            </div>

            {/* Stack trace */}
            {error.stack && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1">
                  Stack Trace
                </p>
                <pre className="text-xs text-white/40 font-mono bg-black/30 rounded-md p-2 overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {error.stack}
                </pre>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              {(fixStatus === "failed" || fixStatus === "idle") && (
                <button
                  onClick={() => onRetry()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 transition-colors"
                >
                  <Wrench className="h-3 w-3" />
                  Fix with AI
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ErrorPanel() {
  const { errors, clearErrors, requestManualGhostFix, ghostFixStatus } =
    usePreviewErrorStore();

  const [collapsed, setCollapsed] = useState(false);

  const handleRetry = useCallback(() => {
    requestManualGhostFix();
  }, [requestManualGhostFix]);

  const handleDismiss = useCallback(() => {
    clearErrors();
  }, [clearErrors]);

  // Don't render if there are no errors
  if (!errors || errors.length === 0) return null;

  const isFixing = ghostFixStatus === "fixing" || ghostFixStatus === "verifying";

  return (
    <div className="flex flex-col bg-[#1a1a22] border border-white/[0.06] rounded-xl overflow-hidden shadow-2xl">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <AlertCircle className="h-4.5 w-4.5 text-red-400" />
            {isFixing && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-white/80">
            Preview Errors
          </h3>
          <span className="text-xs text-white/30">
            {errors.length} error{errors.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {errors.length > 1 && (
            <button
              onClick={clearErrors}
              className="px-2 py-1 text-[10px] font-medium text-white/30 hover:text-white/60 hover:bg-white/5 rounded transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/5 rounded transition-colors"
          >
            {collapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Error list */}
      {!collapsed && (
        <div className="flex flex-col gap-1.5 p-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {errors.map((error) => (
            <ErrorRow
              key={error.id}
              error={error}
              ghostFixStatus={ghostFixStatus}
              onRetry={handleRetry}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}

      {/* Ghost-fix status bar */}
      {isFixing && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-white/[0.06] bg-blue-500/[0.04]">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
          <span className="text-xs text-blue-400/80">
            Ghost-fix is analyzing and applying fixes...
          </span>
        </div>
      )}
    </div>
  );
}
