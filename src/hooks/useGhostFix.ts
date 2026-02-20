"use client";

import { useEffect, useRef } from "react";
import { GhostFixEngine } from "@/lib/ghost-fix/ghost-fix-engine";
import { usePreviewErrorStore } from "@/lib/stores/preview-error-store";
import { useEditorStore } from "@/lib/stores/editor-store";

/**
 * Wires the GhostFixEngine to the preview error store.
 * Listens for new errors and manual fix requests, triggers silent auto-fix.
 * Only activates when there are generated files (i.e. not on a blank new project).
 */
export function useGhostFix() {
  const engineRef = useRef<GhostFixEngine | null>(null);

  useEffect(() => {
    const engine = new GhostFixEngine();
    engineRef.current = engine;

    // Subscribe to errors — trigger ghost fix on new errors
    // Guard: only if there are actually generated files to fix
    const unsubErrors = usePreviewErrorStore.subscribe((state, prev) => {
      const hasFiles = Object.keys(useEditorStore.getState().generatedFiles).length > 0;
      if (
        state.errors.length > prev.errors.length &&
        state.ghostFixStatus === "idle" &&
        hasFiles
      ) {
        engine.handleError();
      }
    });

    // Subscribe to manual fix requests
    const unsubManual = usePreviewErrorStore.subscribe((state, prev) => {
      if (state.pendingManualGhostFix && !prev.pendingManualGhostFix) {
        usePreviewErrorStore.getState().consumeManualGhostFix();
        engine.handleManualFix();
      }
    });

    return () => {
      unsubErrors();
      unsubManual();
      engine.dispose();
      engineRef.current = null;
    };
  }, []);
}
