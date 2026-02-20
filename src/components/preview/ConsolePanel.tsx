"use client";

import { useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { usePreviewErrorStore, type ConsoleLog } from "@/lib/stores/preview-error-store";

function LogIcon({ level }: { level: ConsoleLog["level"] }) {
  switch (level) {
    case "error":
      return <span className="text-red-500 text-[10px]">ERR</span>;
    case "warn":
      return <span className="text-yellow-500 text-[10px]">WRN</span>;
    case "info":
      return <span className="text-blue-500 text-[10px]">INF</span>;
    default:
      return <span className="text-muted-foreground text-[10px]">LOG</span>;
  }
}

function logColor(level: ConsoleLog["level"]): string {
  switch (level) {
    case "error":
      return "text-red-500";
    case "warn":
      return "text-yellow-600 dark:text-yellow-400";
    case "info":
      return "text-blue-500";
    default:
      return "text-muted-foreground";
  }
}

export function ConsolePanel() {
  const { consoleLogs, errors, clearConsoleLogs } = usePreviewErrorStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLogs, errors]);

  const allEntries = [
    ...errors.map((e: { id: string; message: string; timestamp: number }) => ({
      id: e.id,
      level: "error" as const,
      text: e.message,
      timestamp: e.timestamp,
    })),
    ...consoleLogs.map((l: ConsoleLog) => ({
      id: l.id,
      level: l.level,
      text: l.args.join(" "),
      timestamp: l.timestamp,
    })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="flex flex-col h-full border-t bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-1.5 shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Console
        </span>
        {errors.length > 0 && (
          <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] font-medium text-red-500">
            {errors.length}
          </span>
        )}
        <div className="flex-1" />
        <button
          className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
          onClick={clearConsoleLogs}
          title="Clear console"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-auto px-3 py-1 font-mono text-[11px]">
        {allEntries.length === 0 && (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
            No console output
          </div>
        )}
        {allEntries.map((entry) => (
          <div key={entry.id} className={`flex items-start gap-2 py-0.5 ${logColor(entry.level)}`}>
            <LogIcon level={entry.level} />
            <span className="whitespace-pre-wrap break-all">{entry.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
