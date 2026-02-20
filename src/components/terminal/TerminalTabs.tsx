"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTerminalStore } from "@/lib/stores/terminal-store";

interface TerminalTabsProps {
  onNewTerminal: () => void;
}

export function TerminalTabs({ onNewTerminal }: TerminalTabsProps) {
  const { sessions, activeSessionId, setActiveSession, removeSession } =
    useTerminalStore();

  return (
    <div className="flex items-center border-b bg-muted/50">
      <div className="flex flex-1 overflow-x-auto">
        {sessions.map((session) => (
          <button
            key={session.id}
            className={`group flex items-center gap-1 border-r px-3 py-1 text-xs ${
              session.id === activeSessionId
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setActiveSession(session.id)}
          >
            <span>{session.name}</span>
            <span
              className="ml-1 rounded p-0.5 opacity-0 hover:bg-accent group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                removeSession(session.id);
              }}
            >
              <X className="h-2.5 w-2.5" />
            </span>
          </button>
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={onNewTerminal}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
