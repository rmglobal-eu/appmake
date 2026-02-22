"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePreviewBundler } from "@/hooks/usePreviewBundler";
import { useWebContainerPreview } from "@/hooks/useWebContainerPreview";
import { usePreviewStore } from "@/lib/stores/preview-store";
import { useEditorStore } from "@/lib/stores/editor-store";
import { useChatStore } from "@/lib/stores/chat-store";
import { PreviewErrorOverlay } from "./PreviewErrorOverlay";
import { PreviewLoadingScreen } from "./PreviewLoadingScreen";

interface LivePreviewProps {
  className?: string;
  /** Force esbuild-wasm preview (used on share page) */
  forceEsbuild?: boolean;
}

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

  // Determine rebuild function
  const rebuild = useEsbuild ? esbuild.rebuild : undefined;

  // Do we actually have rendered content in the iframe?
  const hasContent = useEsbuild
    ? !!(esbuild.html && esbuild.status === "ready")
    : !!(previewUrl);

  // Show loading screen when we don't have content but AI is generating or files exist
  const hasFiles = useEditorStore.getState
    ? Object.keys(useEditorStore.getState().generatedFiles).length > 0
    : false;
  const showLoadingScreen = !hasContent && (isStreaming || hasFiles);

  // Map to a status for the loading screen animation
  const loadingStatus: Parameters<typeof PreviewLoadingScreen>[0]["status"] =
    isStreaming ? "generating"
    : !useEsbuild ? status  // WebContainer lifecycle status from store
    : effectiveStatus;

  // No files, not streaming — empty state
  if (!hasContent && !isStreaming && !hasFiles) {
    return (
      <div
        className={`flex h-full items-center justify-center bg-[#0a0a12] ${className}`}
      >
        <p className="text-sm text-white/30">No preview available</p>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* The iframe — always present to avoid flicker */}
      <iframe
        ref={iframeRef}
        title="Preview"
        className="h-full w-full border-0 bg-[#0a0a12]"
        {...(!useEsbuild && previewUrl
          ? { allow: "cross-origin-isolated" }
          : {})}
      />

      {/* Full-screen loading animation */}
      {showLoadingScreen && (
        <PreviewLoadingScreen
          status={loadingStatus}
          progressMessage={progressMessage}
        />
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
