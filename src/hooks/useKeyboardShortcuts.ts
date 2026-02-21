"use client";

import { useEffect } from "react";

interface Shortcuts {
  onToggleTerminal?: () => void;
  onToggleSidebar?: () => void;
  onFileSearch?: () => void;
  onSendMessage?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function useKeyboardShortcuts(shortcuts: Shortcuts) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;

      // Cmd+J — Toggle terminal
      if (isMod && e.key === "j") {
        e.preventDefault();
        shortcuts.onToggleTerminal?.();
      }

      // Cmd+B — Toggle sidebar
      if (isMod && e.key === "b") {
        e.preventDefault();
        shortcuts.onToggleSidebar?.();
      }

      // Cmd+P — File search
      if (isMod && e.key === "p") {
        e.preventDefault();
        shortcuts.onFileSearch?.();
      }

      // Cmd+Z — Undo
      if (isMod && e.key === "z" && !e.shiftKey) {
        // Only handle if not focused on a text input/editor
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA" && !(e.target as HTMLElement)?.closest(".cm-editor")) {
          e.preventDefault();
          shortcuts.onUndo?.();
        }
      }

      // Cmd+Shift+Z — Redo
      if (isMod && e.key === "z" && e.shiftKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA" && !(e.target as HTMLElement)?.closest(".cm-editor")) {
          e.preventDefault();
          shortcuts.onRedo?.();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
