import { create } from "zustand";

export type ViewMode = "preview" | "code";
export type DeviceViewport = "desktop" | "tablet" | "mobile";
export type PreviewMode = "quick" | "sandbox";

export type GlobalErrorState = {
  hasError: boolean;
  message: string;
  recoverable: boolean;
} | null;

interface BuilderStore {
  viewMode: ViewMode;
  deviceViewport: DeviceViewport;
  planMode: boolean;
  projectName: string;
  urlPath: string;
  versionHistoryOpen: boolean;
  consoleVisible: boolean;
  terminalVisible: boolean;
  previewMode: PreviewMode;

  // Loading & error states
  isProjectLoading: boolean;
  isSaving: boolean;
  globalError: GlobalErrorState;
  validationErrors: string[];

  setViewMode: (mode: ViewMode) => void;
  setDeviceViewport: (viewport: DeviceViewport) => void;
  setPlanMode: (on: boolean) => void;
  setProjectName: (name: string) => void;
  setUrlPath: (path: string) => void;
  setVersionHistoryOpen: (open: boolean) => void;
  setConsoleVisible: (visible: boolean) => void;
  toggleTerminal: () => void;
  setPreviewMode: (mode: PreviewMode) => void;

  // Loading & error actions
  setProjectLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setGlobalError: (error: GlobalErrorState) => void;
  clearGlobalError: () => void;
  setValidationErrors: (errors: string[]) => void;
}

export const useBuilderStore = create<BuilderStore>((set) => ({
  viewMode: "preview",
  deviceViewport: "desktop",
  planMode: false,
  projectName: "My Project",
  urlPath: "/",
  versionHistoryOpen: false,
  consoleVisible: false,
  terminalVisible: false,
  previewMode: "quick",

  // Loading & error states
  isProjectLoading: false,
  isSaving: false,
  globalError: null,
  validationErrors: [],

  setViewMode: (viewMode) => set({ viewMode }),
  setDeviceViewport: (deviceViewport) => set({ deviceViewport }),
  setPlanMode: (planMode) => set({ planMode }),
  setProjectName: (projectName) => set({ projectName }),
  setUrlPath: (urlPath) => set({ urlPath }),
  setVersionHistoryOpen: (versionHistoryOpen) => set({ versionHistoryOpen }),
  setConsoleVisible: (consoleVisible) => set({ consoleVisible }),
  toggleTerminal: () => set((state) => ({ terminalVisible: !state.terminalVisible })),
  setPreviewMode: (previewMode) => set({ previewMode }),

  // Loading & error actions
  setProjectLoading: (isProjectLoading) => set({ isProjectLoading }),
  setSaving: (isSaving) => set({ isSaving }),
  setGlobalError: (globalError) => set({ globalError }),
  clearGlobalError: () => set({ globalError: null }),
  setValidationErrors: (validationErrors) => set({ validationErrors }),
}));
