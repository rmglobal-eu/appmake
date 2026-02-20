"use client";

import { useCallback, useMemo } from "react";
import { FileTree } from "@/components/editor/FileTree";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { LivePreview } from "@/components/preview/LivePreview";
import { PreviewLoadingOverlay } from "@/components/preview/PreviewLoadingOverlay";
import { VisualEditorOverlay } from "@/components/visual-editor/VisualEditorOverlay";
import { useEditorStore, buildFileTree } from "@/lib/stores/editor-store";
import { useBuilderStore } from "@/lib/stores/builder-store";
import { ConsolePanel } from "@/components/preview/ConsolePanel";
import { TerminalSquare } from "lucide-react";

interface WorkbenchProps {
  refreshKey?: number;
}

const VIEWPORT_SIZES: Record<string, { width: string; maxWidth: string }> = {
  desktop: { width: "100%", maxWidth: "100%" },
  tablet: { width: "768px", maxWidth: "768px" },
  mobile: { width: "375px", maxWidth: "375px" },
};

export function Workbench({ refreshKey = 0 }: WorkbenchProps) {
  const { generatedFiles, activeFilePath, openFile } = useEditorStore();
  const { viewMode, deviceViewport, consoleVisible, setConsoleVisible } = useBuilderStore();

  const fileTree = useMemo(
    () => buildFileTree(generatedFiles),
    [generatedFiles]
  );

  const fileCount = Object.keys(generatedFiles).length;

  const handleFileSelect = useCallback(
    (path: string) => {
      const content = generatedFiles[path];
      if (content !== undefined) openFile(path, content);
    },
    [generatedFiles, openFile]
  );

  if (fileCount === 0) {
    return (
      <div className="relative flex h-full items-center justify-center">
        <PreviewLoadingOverlay />
      </div>
    );
  }

  // Visual editor view
  if (viewMode === "visual-editor") {
    return (
      <div className="h-full">
        <VisualEditorOverlay refreshKey={refreshKey} />
      </div>
    );
  }

  // Code view
  if (viewMode === "code") {
    return (
      <div className="flex h-full">
        <div className="flex w-48 shrink-0 flex-col border-r bg-muted/20">
          <div className="shrink-0 border-b px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Files
          </div>
          <div className="flex-1 overflow-y-auto">
            <FileTree
              files={fileTree}
              onFileSelect={handleFileSelect}
              selectedPath={activeFilePath ?? undefined}
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <CodeEditor />
        </div>
      </div>
    );
  }

  // Preview view (default)
  const viewport = VIEWPORT_SIZES[deviceViewport] ?? VIEWPORT_SIZES.desktop;
  const isConstrained = deviceViewport !== "desktop";

  if (!isConstrained) {
    return (
      <div className="flex h-full flex-col">
        <div className="relative flex-1">
          <div className="absolute inset-0">
            <LivePreview refreshKey={refreshKey} />
          </div>
          {/* Loading overlay on top of preview */}
          <PreviewLoadingOverlay />
        </div>
        {/* Console toggle */}
        <div className="flex items-center border-t px-2 py-0.5 shrink-0">
          <button
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-colors ${
              consoleVisible ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setConsoleVisible(!consoleVisible)}
          >
            <TerminalSquare className="h-3 w-3" />
            Console
          </button>
        </div>
        {consoleVisible && (
          <div className="h-[180px] shrink-0">
            <ConsolePanel />
          </div>
        )}
      </div>
    );
  }

  // Tablet/Mobile constrained viewport
  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1">
        <div className="absolute inset-0 flex items-start justify-center overflow-auto bg-muted/30 p-4">
          <div
            className="h-full border shadow-lg rounded-lg overflow-hidden bg-white"
            style={{ width: viewport.width, maxWidth: viewport.maxWidth }}
          >
            <LivePreview refreshKey={refreshKey} />
          </div>
        </div>
        {/* Loading overlay on top of preview */}
        <PreviewLoadingOverlay />
      </div>
      <div className="flex items-center border-t px-2 py-0.5 shrink-0">
        <button
          className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-colors ${
            consoleVisible ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setConsoleVisible(!consoleVisible)}
        >
          <TerminalSquare className="h-3 w-3" />
          Console
        </button>
      </div>
      {consoleVisible && (
        <div className="h-[180px] shrink-0">
          <ConsolePanel />
        </div>
      )}
    </div>
  );
}
