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
 * Skips the first run (files already provided via SandpackProvider props).
 */
export function SandpackFileSyncer({
  generatedFiles,
  visualEditorMode,
}: SandpackFileSyncerProps) {
  const { sandpack } = useSandpack();
  const prevFilesRef = useRef<string>("");
  const isFirstRun = useRef(true);
  const visualEditPending = useBuilderStore((s) => s.visualEditPending);

  useEffect(() => {
    // Skip Sandpack update when a visual edit just happened
    if (visualEditPending) return;

    const serialized = JSON.stringify(generatedFiles);
    if (serialized === prevFilesRef.current) return;
    prevFilesRef.current = serialized;

    // Skip the first run — files are already provided via SandpackProvider props.
    // Only sync subsequent changes for HMR.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const sandpackFiles = toSandpackFiles(generatedFiles, visualEditorMode);

    for (const [path, fileOrCode] of Object.entries(sandpackFiles)) {
      const code =
        typeof fileOrCode === "string" ? fileOrCode : fileOrCode.code;
      sandpack.updateFile(path, code);
    }
  }, [generatedFiles, visualEditorMode, sandpack, visualEditPending]);

  return null;
}
