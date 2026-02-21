"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePreviewBundler } from "@/hooks/usePreviewBundler";
import { usePreviewStore } from "@/lib/stores/preview-store";
import { PreviewErrorOverlay } from "./PreviewErrorOverlay";
import { Loader2 } from "lucide-react";

interface LivePreviewProps {
  className?: string;
}

export function LivePreview({ className = "" }: LivePreviewProps) {
  const { html, status, errors, rebuild } = usePreviewBundler();
  const { addConsoleEntry, setErrors: setStoreErrors } = usePreviewStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Update iframe when html changes
  useEffect(() => {
    if (!html || status !== "ready") return;

    // Revoke previous blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;

    if (iframeRef.current) {
      iframeRef.current.src = url;
    }

    return () => {
      // Don't revoke here — we revoke on next update instead,
      // so the iframe keeps showing the old content during rebuilds
    };
  }, [html, status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  // Listen for postMessage from iframe
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object" || !data.type) return;

      switch (data.type) {
        case "preview-error":
          if (data.error) {
            setStoreErrors([
              {
                text: data.error.message || "Unknown error",
                location: data.error.line
                  ? {
                      file: data.error.source || "unknown",
                      line: data.error.line,
                      column: data.error.column || 0,
                    }
                  : undefined,
              },
            ]);
          }
          break;

        case "preview-console":
          addConsoleEntry({
            level: data.level || "log",
            args: data.args || [],
            timestamp: data.timestamp || Date.now(),
          });
          break;

        case "preview-ready":
          // Preview loaded successfully
          break;
      }
    },
    [addConsoleEntry, setStoreErrors]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const fileCount = Object.keys(
    // eslint-disable-next-line react-hooks/rules-of-hooks
    usePreviewStore.getState().consoleLogs
  ).length;

  // No files yet
  if (status === "idle" && !html) {
    return (
      <div
        className={`flex h-full items-center justify-center bg-muted/30 ${className}`}
      >
        <p className="text-sm text-muted-foreground">No preview available</p>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* The iframe — always present to avoid flicker */}
      <iframe
        ref={iframeRef}
        title="Preview"
        className="h-full w-full border-0 bg-white"
      />

      {/* Loading indicator (shown during bundling, overlaid on previous preview) */}
      {status === "bundling" && (
        <div className="absolute inset-x-0 top-0 flex items-center justify-center">
          <div className="mt-2 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur-sm">
            <Loader2 className="h-3 w-3 animate-spin" />
            Bundling...
          </div>
        </div>
      )}

      {/* Error overlay */}
      {status === "error" && errors.length > 0 && (
        <PreviewErrorOverlay errors={errors} onRetry={rebuild} />
      )}
    </div>
  );
}
