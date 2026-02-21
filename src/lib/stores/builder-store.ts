import { create } from "zustand";

export type ViewMode = "preview" | "code" | "visual-editor";
export type DeviceViewport = "desktop" | "tablet" | "mobile";
export type PreviewMode = "quick" | "sandbox";

export interface SelectedElement {
  tagName: string;
  xpath: string;
  text: string;
  styles: Record<string, string>;
  rect: { x: number; y: number; width: number; height: number };
  className: string;
  parentTagName: string;
  siblingIndex: number;
  attributes: Record<string, string>;
  outerHtmlSnippet: string;
  inlineStyle: string;
}

interface BuilderStore {
  viewMode: ViewMode;
  deviceViewport: DeviceViewport;
  planMode: boolean;
  visualEditorActive: boolean;
  selectedElement: SelectedElement | null;
  projectName: string;
  urlPath: string;
  versionHistoryOpen: boolean;
  consoleVisible: boolean;
  terminalVisible: boolean;
  previewMode: PreviewMode;
  visualEditPending: boolean;

  setViewMode: (mode: ViewMode) => void;
  setDeviceViewport: (viewport: DeviceViewport) => void;
  setPlanMode: (on: boolean) => void;
  setVisualEditorActive: (on: boolean) => void;
  setSelectedElement: (el: SelectedElement | null) => void;
  setProjectName: (name: string) => void;
  setUrlPath: (path: string) => void;
  setVersionHistoryOpen: (open: boolean) => void;
  setConsoleVisible: (visible: boolean) => void;
  toggleTerminal: () => void;
  setPreviewMode: (mode: PreviewMode) => void;
  setVisualEditPending: (pending: boolean) => void;
}

export const useBuilderStore = create<BuilderStore>((set) => ({
  viewMode: "preview",
  deviceViewport: "desktop",
  planMode: false,
  visualEditorActive: false,
  selectedElement: null,
  projectName: "My Project",
  urlPath: "/",
  versionHistoryOpen: false,
  consoleVisible: false,
  terminalVisible: false,
  previewMode: "quick",
  visualEditPending: false,

  setViewMode: (viewMode) => set({ viewMode }),
  setDeviceViewport: (deviceViewport) => set({ deviceViewport }),
  setPlanMode: (planMode) => set({ planMode }),
  setVisualEditorActive: (on) =>
    set({
      visualEditorActive: on,
      viewMode: on ? "visual-editor" : "preview",
      selectedElement: on ? null : null,
    }),
  setSelectedElement: (selectedElement) => set({ selectedElement }),
  setProjectName: (projectName) => set({ projectName }),
  setUrlPath: (urlPath) => set({ urlPath }),
  setVersionHistoryOpen: (versionHistoryOpen) => set({ versionHistoryOpen }),
  setConsoleVisible: (consoleVisible) => set({ consoleVisible }),
  toggleTerminal: () => set((state) => ({ terminalVisible: !state.terminalVisible })),
  setPreviewMode: (previewMode) => set({ previewMode }),
  setVisualEditPending: (visualEditPending) => set({ visualEditPending }),
}));
