"use client";

import { useMemo, useEffect, useRef, useCallback, useState } from "react";
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
  const blobUrlRef = useRef<string | null>(null);

  // Build preview HTML → write to blob URL
  useEffect(() => {
    const html = buildPreviewHtml(generatedFiles, visualEditorMode);

    // Cleanup previous blob
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    if (!html) {
      setIframeSrc("about:blank");
      return;
    }

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;
    setIframeSrc(url);

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [generatedFiles, refreshKey, visualEditorMode]);

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

  // Listen for error + console messages from iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data) return;
      if (e.data.type === "preview-error") {
        addError({
          message: e.data.payload.message,
          source: e.data.payload.source,
          line: e.data.payload.line,
          col: e.data.payload.col,
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

  // Clear errors when a new preview iframe loads (blob URL changes)
  useEffect(() => {
    if (iframeSrc !== "about:blank") {
      clearErrors();
    }
  }, [iframeSrc, clearErrors]);

  if (Object.keys(generatedFiles).length === 0) {
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
        className="absolute inset-0 h-full w-full border-none bg-white"
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
