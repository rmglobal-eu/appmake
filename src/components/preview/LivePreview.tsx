"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePreviewBundler } from "@/hooks/usePreviewBundler";
import { useWebContainerPreview } from "@/hooks/useWebContainerPreview";
import { usePreviewStore } from "@/lib/stores/preview-store";
import { useChatStore } from "@/lib/stores/chat-store";
import { PreviewErrorOverlay } from "./PreviewErrorOverlay";
import { Loader2 } from "lucide-react";

interface LivePreviewProps {
  className?: string;
  /** Force esbuild-wasm preview (used on share page) */
  forceEsbuild?: boolean;
}

const STATUS_MESSAGES: Record<string, string> = {
  booting: "Starting environment...",
  mounting: "Preparing files...",
  installing: "Installing packages...",
  starting: "Starting dev server...",
  bundling: "Bundling...",
};

export function LivePreview({
  className = "",
  forceEsbuild = false,
}: LivePreviewProps) {
  // esbuild path (always active for share page or fallback)
  const esbuild = usePreviewBundler();

  // WebContainer path (only active when not forced to esbuild)
  const wc = useWebContainerPreview();

  const {
    status,
    errors,
    previewUrl,
    progressMessage,
    addConsoleEntry,
    setErrors: setStoreErrors,
  } = usePreviewStore();
  const isStreaming = useChatStore((s) => s.isStreaming);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Determine which mode we're using
  const useEsbuild = forceEsbuild || !wc.supported;
  const effectiveStatus = useEsbuild ? esbuild.status : status;

  // Update iframe for esbuild mode (blob URL)
  useEffect(() => {
    if (!useEsbuild) return;
    if (!esbuild.html || esbuild.status !== "ready") return;

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    const blob = new Blob([esbuild.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;

    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  }, [useEsbuild, esbuild.html, esbuild.status]);

  // Update iframe for WebContainer mode (server URL)
  useEffect(() => {
    if (useEsbuild) return;
    if (!previewUrl || status !== "ready") return;

    if (iframeRef.current) {
      // Clear any previous blob URL
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      iframeRef.current.src = previewUrl;
    }
  }, [useEsbuild, previewUrl, status]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  // Listen for postMessage from iframe (works for both modes)
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
          break;
      }
    },
    [addConsoleEntry, setStoreErrors]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // No files yet
  if (effectiveStatus === "idle" && !esbuild.html && !previewUrl) {
    return (
      <div
        className={`flex h-full items-center justify-center bg-muted/30 ${className}`}
      >
        <p className="text-sm text-muted-foreground">No preview available</p>
      </div>
    );
  }

  // Determine rebuild function
  const rebuild = useEsbuild ? esbuild.rebuild : undefined;

  // Status message
  const statusMsg =
    progressMessage ||
    STATUS_MESSAGES[effectiveStatus] ||
    (isStreaming ? "Generating..." : null);

  const showLoading =
    statusMsg &&
    effectiveStatus !== "ready" &&
    effectiveStatus !== "error" &&
    effectiveStatus !== "idle";

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* The iframe — always present to avoid flicker */}
      <iframe
        ref={iframeRef}
        title="Preview"
        className="h-full w-full border-0 bg-white"
        // WebContainer iframes need to allow same-origin for cross-origin isolation
        {...(!useEsbuild && previewUrl
          ? { allow: "cross-origin-isolated" }
          : {})}
      />

      {/* Loading indicator */}
      {showLoading && (
        <div className="absolute inset-x-0 top-0 flex items-center justify-center">
          <div className="mt-2 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur-sm">
            <Loader2 className="h-3 w-3 animate-spin" />
            {statusMsg}
          </div>
        </div>
      )}

      {/* Also show loading when streaming in esbuild mode */}
      {useEsbuild &&
        (isStreaming || esbuild.status === "bundling") &&
        !showLoading && (
          <div className="absolute inset-x-0 top-0 flex items-center justify-center">
            <div className="mt-2 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur-sm">
              <Loader2 className="h-3 w-3 animate-spin" />
              {isStreaming ? "Generating..." : "Bundling..."}
            </div>
          </div>
        )}

      {/* Error overlay — only show when NOT streaming */}
      {!isStreaming &&
        effectiveStatus === "error" &&
        errors.length > 0 && (
          <PreviewErrorOverlay errors={errors} onRetry={rebuild} />
        )}
    </div>
  );
}
