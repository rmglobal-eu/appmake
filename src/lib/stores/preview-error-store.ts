import { create } from "zustand";

export type GhostFixStatus = "idle" | "fixing" | "verifying" | "success" | "failed";

export interface PreviewError {
  id: string;
  message: string;
  source?: string;
  line?: number;
  col?: number;
  isBuildError?: boolean;
  stack?: string;
  timestamp: number;
}

export interface ConsoleLog {
  id: string;
  level: "log" | "warn" | "error" | "info";
  args: string[];
  timestamp: number;
}

interface PreviewErrorStore {
  errors: PreviewError[];
  consoleLogs: ConsoleLog[];
  ghostFixStatus: GhostFixStatus;
  previewHealthy: boolean;
  ghostFixAttempts: number;

  addError: (error: Omit<PreviewError, "id" | "timestamp">) => void;
  addConsoleLog: (log: Omit<ConsoleLog, "id" | "timestamp">) => void;
  clearErrors: () => void;
  clearConsoleLogs: () => void;
  setGhostFixStatus: (status: GhostFixStatus) => void;
  setPreviewHealthy: (healthy: boolean) => void;
  incrementGhostFixAttempts: () => void;
  resetGhostFixAttempts: () => void;
  /** Trigger a ghost fix from the "Fix with AI" button */
  requestManualGhostFix: () => void;
  /** Consumed by ghost-fix engine */
  pendingManualGhostFix: boolean;
  consumeManualGhostFix: () => boolean;
}

let errorCounter = 0;
let logCounter = 0;

export const usePreviewErrorStore = create<PreviewErrorStore>((set, get) => ({
  errors: [],
  consoleLogs: [],
  ghostFixStatus: "idle",
  previewHealthy: false,
  ghostFixAttempts: 0,
  pendingManualGhostFix: false,

  addError: (error) =>
    set((state) => ({
      errors: [
        ...state.errors,
        { ...error, id: `err-${++errorCounter}`, timestamp: Date.now() },
      ],
    })),

  addConsoleLog: (log) =>
    set((state) => ({
      consoleLogs: [
        ...state.consoleLogs,
        { ...log, id: `log-${++logCounter}`, timestamp: Date.now() },
      ],
    })),

  clearErrors: () => set({ errors: [] }),
  clearConsoleLogs: () => set({ consoleLogs: [] }),
  setGhostFixStatus: (ghostFixStatus) => set({ ghostFixStatus }),
  setPreviewHealthy: (previewHealthy) => set({ previewHealthy }),
  incrementGhostFixAttempts: () =>
    set((state) => ({ ghostFixAttempts: state.ghostFixAttempts + 1 })),
  resetGhostFixAttempts: () => set({ ghostFixAttempts: 0 }),
  requestManualGhostFix: () => set({ pendingManualGhostFix: true }),
  consumeManualGhostFix: () => {
    const pending = get().pendingManualGhostFix;
    if (pending) set({ pendingManualGhostFix: false });
    return pending;
  },
}));
