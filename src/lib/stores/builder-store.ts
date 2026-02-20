import { create } from "zustand";

export type ViewMode = "preview" | "code" | "visual-editor";
export type DeviceViewport = "desktop" | "tablet" | "mobile";

export interface SelectedElement {
  tagName: string;
  xpath: string;
  text: string;
  styles: Record<string, string>;
  rect: { x: number; y: number; width: number; height: number };
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

  setViewMode: (mode: ViewMode) => void;
  setDeviceViewport: (viewport: DeviceViewport) => void;
  setPlanMode: (on: boolean) => void;
  setVisualEditorActive: (on: boolean) => void;
  setSelectedElement: (el: SelectedElement | null) => void;
  setProjectName: (name: string) => void;
  setUrlPath: (path: string) => void;
  setVersionHistoryOpen: (open: boolean) => void;
  setConsoleVisible: (visible: boolean) => void;
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
}));
