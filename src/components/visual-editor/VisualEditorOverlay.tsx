"use client";

import { useMemo } from "react";
import { LivePreview } from "@/components/preview/LivePreview";
import { VisualEditorSidebar } from "./VisualEditorSidebar";
import { useBuilderStore } from "@/lib/stores/builder-store";

interface VisualEditorOverlayProps {
  refreshKey?: number;
}

const VIEWPORT_SIZES: Record<string, { width: string; maxWidth: string }> = {
  desktop: { width: "100%", maxWidth: "100%" },
  tablet: { width: "768px", maxWidth: "768px" },
  mobile: { width: "375px", maxWidth: "375px" },
};

export function VisualEditorOverlay({ refreshKey = 0 }: VisualEditorOverlayProps) {
  const { deviceViewport } = useBuilderStore();
  const viewport = VIEWPORT_SIZES[deviceViewport] ?? VIEWPORT_SIZES.desktop;
  const isConstrained = deviceViewport !== "desktop";

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <VisualEditorSidebar />

      {/* Preview area */}
      <div className="flex-1 flex items-start justify-center overflow-auto bg-muted/20">
        <div
          className={`h-full ${isConstrained ? "border-x shadow-lg bg-white" : "w-full"}`}
          style={
            isConstrained
              ? { width: viewport.width, maxWidth: viewport.maxWidth }
              : undefined
          }
        >
          <LivePreview refreshKey={refreshKey} visualEditorMode />
        </div>
      </div>
    </div>
  );
}
