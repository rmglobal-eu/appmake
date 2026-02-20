"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useEditorStore } from "@/lib/stores/editor-store";
import { useBuilderStore, type SelectedElement } from "@/lib/stores/builder-store";
import { usePreviewErrorStore } from "@/lib/stores/preview-error-store";
import { buildPreviewHtml } from "@/lib/preview/build-preview";
import { PreviewErrorBanner } from "./PreviewErrorBanner";

interface LivePreviewProps {
  refreshKey?: number;
  visualEditorMode?: boolean;
}

export function LivePreview({
  refreshKey = 0,
  visualEditorMode = false,
}: LivePreviewProps) {
  const { generatedFiles } = useEditorStore();
  const { setSelectedElement } = useBuilderStore();
  const { addError, addConsoleLog, clearErrors } = usePreviewErrorStore();
  const [iframeSrc, setIframeSrc] = useState<string>("about:blank");
  // Keep track of current and previous blob URLs
  // Only revoke the old-old URL when a new one is created, so the iframe
  // always has a valid URL to display during transitions
  const currentBlobRef = useRef<string | null>(null);
  const previousBlobRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileCount = Object.keys(generatedFiles).length;

  // Build preview HTML -> blob URL with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const html = buildPreviewHtml(generatedFiles, visualEditorMode);

      if (!html) {
        // Don't blank out if we previously had content
        if (fileCount === 0 && currentBlobRef.current) {
          // Cleanup both URLs
          if (previousBlobRef.current) URL.revokeObjectURL(previousBlobRef.current);
          if (currentBlobRef.current) URL.revokeObjectURL(currentBlobRef.current);
          previousBlobRef.current = null;
          currentBlobRef.current = null;
          setIframeSrc("about:blank");
        }
        return;
      }

      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      // Revoke the old-old URL (two generations back)
      // This ensures the current iframe URL stays valid during the transition
      if (previousBlobRef.current) {
        URL.revokeObjectURL(previousBlobRef.current);
      }

      // Shift: current becomes previous, new becomes current
      previousBlobRef.current = currentBlobRef.current;
      currentBlobRef.current = url;
      setIframeSrc(url);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [generatedFiles, refreshKey, visualEditorMode, fileCount]);

  // Cleanup all blob URLs on unmount
  useEffect(() => {
    return () => {
      if (previousBlobRef.current) URL.revokeObjectURL(previousBlobRef.current);
      if (currentBlobRef.current) URL.revokeObjectURL(currentBlobRef.current);
    };
  }, []);

  // Listen for visual editor messages from iframe
  useEffect(() => {
    if (!visualEditorMode) return;

    function handleMessage(e: MessageEvent) {
      if (!e.data) return;
      if (
        e.data.type === "visual-editor-select" ||
        e.data.type === "visual-editor-updated"
      ) {
        setSelectedElement(e.data.payload as SelectedElement);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [visualEditorMode, setSelectedElement]);

  // Listen for error + console + preview-ready messages from iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data) return;
      if (e.data.type === "preview-ready") {
        usePreviewErrorStore.getState().setPreviewHealthy(true);
      }
      if (e.data.type === "preview-error") {
        addError({
          message: e.data.payload.message,
          source: e.data.payload.source,
          line: e.data.payload.line,
          col: e.data.payload.col,
          isBuildError: e.data.payload.isBuildError,
          stack: e.data.payload.stack,
        });
      }
      if (e.data.type === "preview-console") {
        addConsoleLog({
          level: e.data.payload.level,
          args: e.data.payload.args,
        });
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [addError, addConsoleLog]);

  // Clear errors and reset preview health when a new preview loads
  useEffect(() => {
    if (iframeSrc !== "about:blank") {
      clearErrors();
      usePreviewErrorStore.getState().setPreviewHealthy(false);
    }
  }, [iframeSrc, clearErrors]);

  if (fileCount === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">No preview available</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <iframe
        key={`preview-${refreshKey}`}
        src={iframeSrc}
        className="h-full w-full border-none bg-white"
        title="Live Preview"
        allow="cross-origin-isolated"
      />
      <PreviewErrorBanner />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bridge hook for visual editor sidebar
// ---------------------------------------------------------------------------

export function useLivePreviewBridge() {
  return useCallback(
    (payload: { text?: string; styles?: Record<string, string> }) => {
      const iframe = document.querySelector<HTMLIFrameElement>(
        'iframe[title="Live Preview"]'
      );
      iframe?.contentWindow?.postMessage(
        { type: "visual-editor-apply", payload },
        "*"
      );
    },
    []
  );
}
