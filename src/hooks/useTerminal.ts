"use client";

import { useCallback } from "react";
import { useTerminalStore } from "@/lib/stores/terminal-store";
import { v4 as uuid } from "uuid";

export function useTerminal() {
  const {
    sessions,
    activeSessionId,
    isVisible,
    addSession,
    removeSession,
    setActiveSession,
    toggleVisible,
  } = useTerminalStore();

  const createTerminal = useCallback(
    (name?: string) => {
      const id = uuid();
      addSession({ id, name: name || `Terminal ${sessions.length + 1}` });
      return id;
    },
    [sessions.length, addSession]
  );

  return {
    sessions,
    activeSessionId,
    isVisible,
    createTerminal,
    removeSession,
    setActiveSession,
    toggleVisible,
  };
}
