"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import type { BundleError } from "@/lib/preview/bundler";

interface PreviewErrorOverlayProps {
  errors: BundleError[];
  onRetry?: () => void;
}

export function PreviewErrorOverlay({
  errors,
  onRetry,
}: PreviewErrorOverlayProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || errors.length === 0) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 max-h-[80%] w-full max-w-lg overflow-auto rounded-xl border border-red-500/30 bg-[#1a1a24] p-5 shadow-2xl">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {errors.length === 1
                ? "Build Error"
                : `${errors.length} Build Errors`}
            </span>
          </div>
          <button
            className="rounded-md p-1 text-white/40 hover:bg-white/10 hover:text-white/80"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error list */}
        <div className="space-y-2">
          {errors.map((error, i) => (
            <div
              key={i}
              className="rounded-lg border border-white/10 bg-white/5 p-3"
            >
              {error.location && (
                <div className="mb-1 text-[11px] font-mono text-white/40">
                  {error.location.file}:{error.location.line}:
                  {error.location.column}
                </div>
              )}
              <pre className="whitespace-pre-wrap text-xs text-red-300 font-mono leading-relaxed">
                {error.text}
              </pre>
            </div>
          ))}
        </div>

        {/* Retry button */}
        {onRetry && (
          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/20 transition-colors"
            onClick={() => {
              setDismissed(false);
              onRetry();
            }}
          >
            <RefreshCw className="h-3 w-3" />
            Retry Build
          </button>
        )}
      </div>
    </div>
  );
}
