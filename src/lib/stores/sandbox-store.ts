import { create } from "zustand";
import type { SandboxStatus, FileEntry } from "@/types/sandbox";

interface SandboxStore {
  sandboxId: string | null;
  containerId: string | null;
  status: SandboxStatus | null;
  previewUrl: string | null;
  fileTree: FileEntry[];
  setSandbox: (id: string, containerId: string) => void;
  setStatus: (status: SandboxStatus) => void;
  setPreviewUrl: (url: string | null) => void;
  setFileTree: (tree: FileEntry[]) => void;
  clearSandbox: () => void;
}

export const useSandboxStore = create<SandboxStore>((set) => ({
  sandboxId: null,
  containerId: null,
  status: null,
  previewUrl: null,
  fileTree: [],
  setSandbox: (sandboxId, containerId) =>
    set({ sandboxId, containerId, status: "running" }),
  setStatus: (status) => set({ status }),
  setPreviewUrl: (previewUrl) => set({ previewUrl }),
  setFileTree: (fileTree) => set({ fileTree }),
  clearSandbox: () =>
    set({
      sandboxId: null,
      containerId: null,
      status: null,
      previewUrl: null,
      fileTree: [],
    }),
}));
