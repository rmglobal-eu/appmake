import { create } from "zustand";
import type { BundleError } from "@/lib/preview/bundler";

export interface ConsoleEntry {
  id: string;
  level: "log" | "warn" | "error" | "info" | "debug";
  args: string[];
  timestamp: number;
}

export type PreviewStatus =
  | "idle"
  | "booting"      // WebContainer.boot()
  | "mounting"     // Files being written to filesystem
  | "installing"   // npm install running
  | "starting"     // Vite dev server starting
  | "ready"        // Preview visible
  | "error"        // Error occurred
  | "bundling";    // Legacy esbuild (share-side)

interface PreviewStore {
  status: PreviewStatus;
  errors: BundleError[];
  consoleLogs: ConsoleEntry[];
  lastBundleTime: number | null;

  // WebContainer-specific state
  previewUrl: string | null;
  progressMessage: string | null;
  installOutput: string;

  setStatus: (status: PreviewStatus) => void;
  setErrors: (errors: BundleError[]) => void;
  addConsoleEntry: (entry: Omit<ConsoleEntry, "id">) => void;
  clearConsole: () => void;
  setLastBundleTime: (ms: number) => void;

  // WebContainer actions
  setPreviewUrl: (url: string | null) => void;
  setProgressMessage: (msg: string | null) => void;
  appendInstallOutput: (line: string) => void;
  clearInstallOutput: () => void;
  resetPreview: () => void;
}

let logCounter = 0;

export const usePreviewStore = create<PreviewStore>((set) => ({
  status: "idle",
  errors: [],
  consoleLogs: [],
  lastBundleTime: null,
  previewUrl: null,
  progressMessage: null,
  installOutput: "",

  setStatus: (status) => set({ status }),
  setErrors: (errors) => set({ errors }),
  addConsoleEntry: (entry) =>
    set((state) => ({
      consoleLogs: [
        ...state.consoleLogs.slice(-199), // Keep last 200 entries
        { ...entry, id: `log-${++logCounter}` },
      ],
    })),
  clearConsole: () => set({ consoleLogs: [] }),
  setLastBundleTime: (ms) => set({ lastBundleTime: ms }),

  setPreviewUrl: (url) => set({ previewUrl: url }),
  setProgressMessage: (msg) => set({ progressMessage: msg }),
  appendInstallOutput: (line) =>
    set((state) => ({
      installOutput: state.installOutput + line,
    })),
  clearInstallOutput: () => set({ installOutput: "" }),
  resetPreview: () =>
    set({
      status: "idle",
      errors: [],
      previewUrl: null,
      progressMessage: null,
      installOutput: "",
    }),
}));
