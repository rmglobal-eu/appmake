"use client";

import { useCallback } from "react";
import { useSandboxStore } from "@/lib/stores/sandbox-store";
import { useEditorStore } from "@/lib/stores/editor-store";

export function useFileTree(containerId: string | null) {
  const { fileTree, setFileTree } = useSandboxStore();
  const { openFile } = useEditorStore();

  const refresh = useCallback(async () => {
    if (!containerId) return;
    const res = await fetch(
      `/api/sandbox/files?containerId=${containerId}&list=/workspace`
    );
    const files = await res.json();
    setFileTree(files ?? []);
  }, [containerId, setFileTree]);

  const selectFile = useCallback(
    async (path: string) => {
      if (!containerId) return;
      const res = await fetch(
        `/api/sandbox/files?containerId=${containerId}&filePath=${encodeURIComponent(path)}`
      );
      const data = await res.json();
      openFile(path, data.content || "");
    },
    [containerId, openFile]
  );

  return { fileTree, refresh, selectFile };
}
