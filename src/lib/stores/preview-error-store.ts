import { create } from "zustand";

export interface PreviewError {
  id: string;
  message: string;
  source?: string;
  line?: number;
  col?: number;
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
  autoFixEnabled: boolean;
  autoFixInProgress: boolean;
  autoFixAttempts: number;
  /** Set by "Fix with AI" button, consumed by ChatPanel */
  pendingManualFix: string | null;

  addError: (error: Omit<PreviewError, "id" | "timestamp">) => void;
  addConsoleLog: (log: Omit<ConsoleLog, "id" | "timestamp">) => void;
  clearErrors: () => void;
  clearConsoleLogs: () => void;
  setAutoFixEnabled: (enabled: boolean) => void;
  setAutoFixInProgress: (inProgress: boolean) => void;
  incrementAutoFixAttempts: () => void;
  resetAutoFixAttempts: () => void;
  requestManualFix: (errorMessage: string) => void;
  consumeManualFix: () => string | null;
}

let errorCounter = 0;
let logCounter = 0;

export const usePreviewErrorStore = create<PreviewErrorStore>((set, get) => ({
  errors: [],
  consoleLogs: [],
  autoFixEnabled: true,
  autoFixInProgress: false,
  autoFixAttempts: 0,
  pendingManualFix: null,

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
  setAutoFixEnabled: (autoFixEnabled) => set({ autoFixEnabled }),
  setAutoFixInProgress: (autoFixInProgress) => set({ autoFixInProgress }),
  incrementAutoFixAttempts: () =>
    set((state) => ({ autoFixAttempts: state.autoFixAttempts + 1 })),
  resetAutoFixAttempts: () => set({ autoFixAttempts: 0 }),
  requestManualFix: (errorMessage) => set({ pendingManualFix: errorMessage }),
  consumeManualFix: (): string | null => {
    const msg = get().pendingManualFix;
    if (msg) set({ pendingManualFix: null });
    return msg;
  },
}));
