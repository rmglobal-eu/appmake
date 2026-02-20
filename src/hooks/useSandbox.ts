"use client";

import { useCallback } from "react";
import { useSandboxStore } from "@/lib/stores/sandbox-store";
import type { SandboxTemplate } from "@/types/sandbox";

export function useSandbox(projectId: string) {
  const {
    sandboxId,
    containerId,
    status,
    previewUrl,
    fileTree,
    setSandbox,
    setStatus,
    setPreviewUrl,
    setFileTree,
    clearSandbox,
  } = useSandboxStore();

  const createSandbox = useCallback(
    async (template: SandboxTemplate = "node") => {
      setStatus("creating");
      try {
        const res = await fetch("/api/sandbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, template }),
        });
        const data = await res.json();
        setSandbox(data.id, data.containerId);

        // Load file tree
        const filesRes = await fetch(
          `/api/sandbox/files?containerId=${data.containerId}&list=/workspace`
        );
        const files = await filesRes.json();
        setFileTree(files ?? []);

        return data;
      } catch (error) {
        setStatus("destroyed");
        throw error;
      }
    },
    [projectId, setSandbox, setStatus, setFileTree]
  );

  const destroySandbox = useCallback(async () => {
    if (!sandboxId) return;
    await fetch("/api/sandbox", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sandboxId }),
    });
    clearSandbox();
  }, [sandboxId, clearSandbox]);

  const refreshFileTree = useCallback(async () => {
    if (!containerId) return;
    const res = await fetch(
      `/api/sandbox/files?containerId=${containerId}&list=/workspace`
    );
    const files = await res.json();
    setFileTree(files ?? []);
  }, [containerId, setFileTree]);

  const execCommand = useCallback(
    async (command: string) => {
      if (!sandboxId || !containerId) return null;
      const res = await fetch("/api/sandbox/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId, containerId, command }),
      });
      return res.json();
    },
    [sandboxId, containerId]
  );

  const writeFile = useCallback(
    async (filePath: string, content: string) => {
      if (!sandboxId || !containerId) return;
      await fetch("/api/sandbox/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId, containerId, filePath, content }),
      });
    },
    [sandboxId, containerId]
  );

  const readFile = useCallback(
    async (filePath: string) => {
      if (!containerId) return "";
      const res = await fetch(
        `/api/sandbox/files?containerId=${containerId}&filePath=${encodeURIComponent(filePath)}`
      );
      const data = await res.json();
      return data.content || "";
    },
    [containerId]
  );

  return {
    sandboxId,
    containerId,
    status,
    previewUrl,
    fileTree,
    createSandbox,
    destroySandbox,
    refreshFileTree,
    execCommand,
    writeFile,
    readFile,
    setPreviewUrl,
  };
}
