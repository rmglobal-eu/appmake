import { useEffect, useRef } from "react";
import { useSandpack } from "@codesandbox/sandpack-react";
import { useBuilderStore, type SelectedElement } from "@/lib/stores/builder-store";
import { usePreviewErrorStore } from "@/lib/stores/preview-error-store";

interface SandpackEventBridgeProps {
  visualEditorMode: boolean;
}

/**
 * Renderless component that bridges Sandpack events to our existing stores:
 * - Sandpack status "running" → setPreviewHealthy(true)
 * - Sandpack errors → addError() in preview-error-store
 * - Console messages → addConsoleLog() in preview-error-store
 * - PostMessage from iframe (visual editor) → setSelectedElement() in builder-store
 * - Safety timeout (15s) → force setPreviewHealthy(true)
 */
export function SandpackEventBridge({
  visualEditorMode,
}: SandpackEventBridgeProps) {
  const { sandpack, listen } = useSandpack();
  const { setSelectedElement } = useBuilderStore();
  const { addError, addConsoleLog, clearErrors } = usePreviewErrorStore();
  const hasSignaledReady = useRef(false);

  // Clear errors when Sandpack status changes (new build starting)
  useEffect(() => {
    if (sandpack.status === "running") {
      clearErrors();
      usePreviewErrorStore.getState().setPreviewHealthy(false);
      hasSignaledReady.current = false;
    }
  }, [sandpack.status, clearErrors]);

  // Listen to Sandpack events
  useEffect(() => {
    const unsub = listen((msg) => {
      if (msg.type === "success") {
        if (!hasSignaledReady.current) {
          hasSignaledReady.current = true;
          usePreviewErrorStore.getState().setPreviewHealthy(true);
        }
      }

      if (msg.type === "action" && msg.action === "show-error") {
        // Mark healthy so loading overlay hides and error banner shows
        if (!usePreviewErrorStore.getState().previewHealthy) {
          usePreviewErrorStore.getState().setPreviewHealthy(true);
        }
        addError({
          message: (msg as any).title || (msg as any).message || "Unknown error",
          isBuildError: true,
          stack: (msg as any).line ? `Line ${(msg as any).line}` : undefined,
        });
      }

      if (msg.type === "console" && (msg as any).log) {
        const log = (msg as any).log;
        if (Array.isArray(log)) {
          for (const entry of log) {
            addConsoleLog({
              level: entry.method === "warn" ? "warn" : entry.method === "error" ? "error" : entry.method === "info" ? "info" : "log",
              args: Array.isArray(entry.data) ? entry.data.map(String) : [String(entry.data)],
            });
          }
        }
      }
    });

    return unsub;
  }, [listen, addError, addConsoleLog]);

  // Safety timeout: if no success event within 15s, force healthy
  useEffect(() => {
    if (sandpack.status !== "running") return;

    const timer = setTimeout(() => {
      if (!usePreviewErrorStore.getState().previewHealthy) {
        usePreviewErrorStore.getState().setPreviewHealthy(true);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [sandpack.status]);

  // Listen for postMessages from iframe (visual editor + ghost-fix-request)
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data) return;
      if (
        visualEditorMode &&
        (e.data.type === "visual-editor-select" ||
          e.data.type === "visual-editor-updated")
      ) {
        setSelectedElement(e.data.payload as SelectedElement);
      }
      if (e.data.type === "ghost-fix-request") {
        usePreviewErrorStore.getState().requestManualGhostFix();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [visualEditorMode, setSelectedElement]);

  // When ghost fix succeeds, notify iframe to remove error overlay
  useEffect(() => {
    const unsub = usePreviewErrorStore.subscribe((state, prev) => {
      if (state.ghostFixStatus === "success" && prev.ghostFixStatus !== "success") {
        // Find Sandpack preview iframe and send success message
        const iframe =
          (document.querySelector(".sp-preview-iframe") as HTMLIFrameElement) ||
          document.querySelector<HTMLIFrameElement>('iframe[title="Sandpack Preview"]');
        iframe?.contentWindow?.postMessage({ type: "ghost-fix-success" }, "*");
      }
    });
    return unsub;
  }, []);

  return null;
}
