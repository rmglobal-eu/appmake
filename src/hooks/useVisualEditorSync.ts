/**
 * Hook that binds the visual editor sidebar to source code sync.
 *
 * When "Apply" is clicked in the sidebar:
 * 1. Sends payload to iframe for instant DOM update (existing behavior)
 * 2. Finds the element in source code
 * 3. Generates a source edit (text or style change)
 * 4. Pushes an undo snapshot
 * 5. Applies the edit to the file content
 * 6. Sets visualEditPending flag to skip redundant preview rebuild
 */

import { useCallback } from "react";
import { useBuilderStore } from "@/lib/stores/builder-store";
import { useEditorStore } from "@/lib/stores/editor-store";
import { useLivePreviewBridge } from "@/components/preview/LivePreview";
import { findElementInSource } from "@/lib/visual-editor/source-matcher";
import {
  generateTextEdit,
  generateStyleEdit,
} from "@/lib/visual-editor/edit-generator";

export function useVisualEditorSync() {
  const sendToPreview = useLivePreviewBridge();

  const syncAndApply = useCallback(
    (payload: { text?: string; styles?: Record<string, string> }) => {
      // 1. Instant DOM update in iframe
      sendToPreview(payload);

      // 2. Try to sync back to source code
      const selectedElement = useBuilderStore.getState().selectedElement;
      const generatedFiles = useEditorStore.getState().generatedFiles;

      if (!selectedElement || Object.keys(generatedFiles).length === 0) return;

      const match = findElementInSource(selectedElement, generatedFiles);
      if (!match) {
        // Can't find element in source — DOM update still applied, just no persistence
        console.warn("[visual-editor-sync] Could not find element in source");
        return;
      }

      let edit = null;

      if (payload.text !== undefined) {
        edit = generateTextEdit(
          match,
          selectedElement.text,
          payload.text
        );
      }

      if (payload.styles) {
        edit = generateStyleEdit(match, payload.styles);
      }

      if (!edit) return;

      // 3. Apply edit to source
      const fileContent = generatedFiles[edit.filePath];
      if (!fileContent) return;

      const newContent = fileContent.replace(edit.oldText, edit.newText);
      if (newContent === fileContent) {
        // Replace didn't match — old text not found in file
        console.warn("[visual-editor-sync] Edit old text not found in file");
        return;
      }

      // 4. Push undo snapshot before modifying
      useEditorStore.getState().pushUndoSnapshot();

      // 5. Set pending flag to skip rebuild (DOM already updated)
      useBuilderStore.getState().setVisualEditPending(true);

      // 6. Update file content
      useEditorStore.getState().updateFileContent(edit.filePath, newContent);

      // 7. Clear pending flag after a short delay (allow file update to propagate)
      setTimeout(() => {
        useBuilderStore.getState().setVisualEditPending(false);
      }, 500);
    },
    [sendToPreview]
  );

  return syncAndApply;
}
