import { create } from "zustand";
import type { BundleError } from "@/lib/preview/bundler";

export interface ConsoleEntry {
  id: string;
  level: "log" | "warn" | "error" | "info" | "debug";
  args: string[];
  timestamp: number;
}

interface PreviewStore {
  status: "idle" | "bundling" | "ready" | "error";
  errors: BundleError[];
  consoleLogs: ConsoleEntry[];
  lastBundleTime: number | null;

  setStatus: (status: PreviewStore["status"]) => void;
  setErrors: (errors: BundleError[]) => void;
  addConsoleEntry: (entry: Omit<ConsoleEntry, "id">) => void;
  clearConsole: () => void;
  setLastBundleTime: (ms: number) => void;
}

let logCounter = 0;

export const usePreviewStore = create<PreviewStore>((set) => ({
  status: "idle",
  errors: [],
  consoleLogs: [],
  lastBundleTime: null,

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
}));
