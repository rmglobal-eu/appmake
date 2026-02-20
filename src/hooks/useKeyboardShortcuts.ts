"use client";

import { useEffect } from "react";

interface Shortcuts {
  onToggleTerminal?: () => void;
  onToggleSidebar?: () => void;
  onFileSearch?: () => void;
  onSendMessage?: () => void;
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
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
