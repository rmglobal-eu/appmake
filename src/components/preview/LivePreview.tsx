"use client";

import { useMemo, useCallback, useRef } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
} from "@codesandbox/sandpack-react";
import { useEditorStore } from "@/lib/stores/editor-store";
import {
  toSandpackFiles,
  extractDependencies,
  depsHash,
} from "@/lib/preview/sandpack-utils";
import { SandpackFileSyncer } from "./SandpackFileSyncer";
import { SandpackEventBridge } from "./SandpackEventBridge";
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
  const fileCount = Object.keys(generatedFiles).length;

  const deps = useMemo(
    () => extractDependencies(generatedFiles),
    [generatedFiles]
  );
  const depKey = useMemo(() => depsHash(deps), [deps]);

  const sandpackFiles = useMemo(
    () => toSandpackFiles(generatedFiles, visualEditorMode),
    [generatedFiles, visualEditorMode]
  );

  if (fileCount === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">No preview available</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <SandpackProvider
        key={`sp-${refreshKey}-${depKey}`}
        files={sandpackFiles}
        customSetup={{
          dependencies: deps,
          environment: "create-react-app",
        }}
        options={{
          externalResources: [
            "https://cdn.tailwindcss.com",
          ],
          autorun: true,
          autoReload: true,
        }}
        style={{ height: "100%", width: "100%" }}
      >
        <SandpackFileSyncer
          generatedFiles={generatedFiles}
          visualEditorMode={visualEditorMode}
        />
        <SandpackEventBridge visualEditorMode={visualEditorMode} />
        <SandpackLayout style={{ height: "100%", width: "100%", border: "none", borderRadius: 0 }}>
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            style={{ height: "100%", width: "100%" }}
          />
        </SandpackLayout>
      </SandpackProvider>
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
      // Sandpack renders inside a nested iframe — find it
      const sandpackWrapper = document.querySelector(".sp-preview-iframe") as HTMLIFrameElement | null;
      const iframe = sandpackWrapper || document.querySelector<HTMLIFrameElement>(
        'iframe[title="Sandpack Preview"]'
      );
      iframe?.contentWindow?.postMessage(
        { type: "visual-editor-apply", payload },
        "*"
      );
    },
    []
  );
}
