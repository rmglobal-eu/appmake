"use client";

import { useEffect, useRef, useCallback, useState } from "react";
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
  const messageCount = useChatStore((s) => s.messages.length);
  const fileCount = useEditorStore((s) => Object.keys(s.generatedFiles).length);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Track whether we've ever had a successful build (never reset — keep old preview visible)
  const [hadFirstBuild, setHadFirstBuild] = useState(false);
  // Track runtime errors from iframe (separate from build errors)
  const [hasRuntimeError, setHasRuntimeError] = useState(false);
  // Auto-fix: only attempt once per streaming session to avoid infinite loops
  const autoFixAttemptedRef = useRef(false);

  // Reset auto-fix flag when new streaming session starts
  useEffect(() => {
    if (isStreaming) {
      autoFixAttemptedRef.current = false;
    }
  }, [isStreaming]);

  // Clear runtime errors when a new build starts
  useEffect(() => {
    if (esbuild.status === "bundling") {
      setHasRuntimeError(false);
    }
  }, [esbuild.status]);

  // Determine which mode we're using
  const useEsbuild = forceEsbuild || !wc.supported;
  const effectiveStatus = useEsbuild ? esbuild.status : status;

  // Update iframe for esbuild mode (blob URL)
  useEffect(() => {
    if (!useEsbuild) return;
    if (!esbuild.html || esbuild.status !== "ready") return;

    // Mark first build done
    setHadFirstBuild(true);

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

    // Mark first build done
    setHadFirstBuild(true);

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
            const errorMsg = data.error.message || "Unknown error";
            setHasRuntimeError(true);
            setStoreErrors([
              {
                text: errorMsg,
                location: data.error.line
                  ? {
                      file: data.error.source || "unknown",
                      line: data.error.line,
                      column: data.error.column || 0,
                    }
                  : undefined,
              },
            ]);

            // Auto-fix: send error to AI if not streaming and haven't attempted yet
            const streaming = useChatStore.getState().isStreaming;
            if (!streaming && !autoFixAttemptedRef.current) {
              autoFixAttemptedRef.current = true;
              // Small delay so user can see the error briefly
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent("appmake:auto-fix", {
                    detail: {
                      prompt: `The preview has a runtime error that needs to be fixed:\n\n\`${errorMsg}\`\n\nPlease fix this error in the code.`,
                    },
                  })
                );
              }, 1500);
            }
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

  // Show loading screen when we don't have a completed build yet
  const wcLoading = !useEsbuild && ["booting", "mounting", "installing", "starting"].includes(status);
  const showLoadingScreen = !hadFirstBuild;

  // Map to a status for the loading screen animation
  const loadingStatus: Parameters<typeof PreviewLoadingScreen>[0]["status"] =
    wcLoading ? status
    : isStreaming ? "generating"
    : fileCount > 0 ? "bundling"
    : "idle";

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

      {/* Branded loader when runtime error detected (AI is auto-fixing) */}
      {hasRuntimeError && !showLoadingScreen && (
        <PreviewLoadingScreen status="fixing" />
      )}

      {/* Error overlay — only for build errors when AI is NOT auto-fixing */}
      {!isStreaming &&
        !hasRuntimeError &&
        effectiveStatus === "error" &&
        errors.length > 0 && (
          <PreviewErrorOverlay errors={errors} onRetry={rebuild} />
        )}
    </div>
  );
}
