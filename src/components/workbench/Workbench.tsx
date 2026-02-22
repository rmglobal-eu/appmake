"use client";

import { useCallback, useMemo } from "react";
import { FileTree } from "@/components/editor/FileTree";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { useEditorStore, buildFileTree } from "@/lib/stores/editor-store";
import { useBuilderStore } from "@/lib/stores/builder-store";
import { useSandboxStore } from "@/lib/stores/sandbox-store";
import { useChatStore } from "@/lib/stores/chat-store";
import { Terminal } from "@/components/terminal/Terminal";
import { TerminalTabs } from "@/components/terminal/TerminalTabs";
import { useTerminalStore } from "@/lib/stores/terminal-store";
import { getTerminalWsUrl } from "@/lib/ws/terminal-bridge";
import { LivePreview } from "@/components/preview/LivePreview";
import { ConsolePanel } from "@/components/preview/ConsolePanel";
import { PanelResizer } from "./PanelResizer";
import { TerminalSquare } from "lucide-react";
import { PreviewLoader } from "./PreviewLoader";

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
  const { viewMode, deviceViewport, consoleVisible, setConsoleVisible, terminalVisible, previewMode } = useBuilderStore();
  const { containerId, previewUrl } = useSandboxStore();
  const { sessions, activeSessionId } = useTerminalStore();
  const activeSession = sessions.find((s) => s.id === activeSessionId);

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

  const { isStreaming } = useChatStore();

  if (fileCount === 0) {
    return <PreviewLoader isStreaming={isStreaming} />;
  }

  // Code view
  if (viewMode === "code") {
    return (
      <div className="flex h-full">
        <div className="flex w-48 shrink-0 flex-col border-r border-white/10 bg-[#0f0f14]/60">
          <div className="shrink-0 border-b border-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/30">
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
            <LivePreview />
          </div>
        </div>
        {/* Console toggle */}
        <div className="flex items-center border-t border-white/10 px-2 py-0.5 shrink-0 bg-[#0f0f14]/40">
          <button
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-colors ${
              consoleVisible ? "text-white font-medium" : "text-white/40 hover:text-white/70"
            }`}
            onClick={() => setConsoleVisible(!consoleVisible)}
          >
            <TerminalSquare className="h-3 w-3" />
            Console
          </button>
        </div>
        {/* Console panel */}
        {consoleVisible && previewMode === "quick" && (
          <div className="h-[180px] shrink-0 border-t border-white/10">
            <ConsolePanel />
          </div>
        )}
        {/* Terminal panel */}
        {terminalVisible && (
          <>
            <PanelResizer direction="vertical" onResize={() => {}} />
            <div className="h-[200px] shrink-0 border-t border-white/10 bg-[#0a0a10]">
              {containerId && activeSession ? (
                <div className="flex h-full flex-col">
                  <TerminalTabs onNewTerminal={() => {}} />
                  <div className="flex-1">
                    <Terminal
                      wsUrl={getTerminalWsUrl(containerId, activeSession.id)}
                      sessionId={activeSession.id}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/40">
                  <TerminalSquare className="mr-2 h-4 w-4" />
                  No sandbox connected — switch to Sandbox mode to use the terminal
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Tablet/Mobile constrained viewport
  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1">
        <div className="absolute inset-0 flex items-start justify-center overflow-auto bg-black/30 p-4">
          <div
            className="h-full border shadow-lg rounded-lg overflow-hidden bg-white"
            style={{ width: viewport.width, maxWidth: viewport.maxWidth }}
          >
            <LivePreview />
          </div>
        </div>
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
    </div>
  );
}
