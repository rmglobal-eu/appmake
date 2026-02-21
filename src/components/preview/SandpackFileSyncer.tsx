import { useEffect, useRef } from "react";
import { useSandpack } from "@codesandbox/sandpack-react";
import { useBuilderStore } from "@/lib/stores/builder-store";
import { toSandpackFiles } from "@/lib/preview/sandpack-utils";

interface SandpackFileSyncerProps {
  generatedFiles: Record<string, string>;
  visualEditorMode: boolean;
}

/**
 * Renderless component that syncs editor store files into Sandpack
 * via updateFile(), enabling HMR instead of full remounts.
 * Skips updates when visualEditPending is true (DOM already updated via postMessage).
 */
export function SandpackFileSyncer({
  generatedFiles,
  visualEditorMode,
}: SandpackFileSyncerProps) {
  const { sandpack } = useSandpack();
  const prevFilesRef = useRef<string>("");
  const visualEditPending = useBuilderStore((s) => s.visualEditPending);

  useEffect(() => {
    // Skip Sandpack update when a visual edit just happened
    // (the DOM was already updated via postMessage, source was synced for persistence)
    if (visualEditPending) return;

    const serialized = JSON.stringify(generatedFiles);
    if (serialized === prevFilesRef.current) return;
    prevFilesRef.current = serialized;

    const sandpackFiles = toSandpackFiles(generatedFiles, visualEditorMode);

    for (const [path, fileOrCode] of Object.entries(sandpackFiles)) {
      const code =
        typeof fileOrCode === "string" ? fileOrCode : fileOrCode.code;
      sandpack.updateFile(path, code);
    }
  }, [generatedFiles, visualEditorMode, sandpack, visualEditPending]);

  return null;
}
