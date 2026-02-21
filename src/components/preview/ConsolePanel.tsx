"use client";

import { useEffect, useRef } from "react";
import { usePreviewStore } from "@/lib/stores/preview-store";
import { Trash2 } from "lucide-react";

const LEVEL_STYLES: Record<string, string> = {
  log: "text-white/80",
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
  debug: "text-purple-400",
};

const LEVEL_LABELS: Record<string, string> = {
  log: "",
  info: "info",
  warn: "warn",
  error: "error",
  debug: "debug",
};

export function ConsolePanel() {
  const consoleLogs = usePreviewStore((s) => s.consoleLogs);
  const clearConsole = usePreviewStore((s) => s.clearConsole);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [consoleLogs.length]);

  return (
    <div className="flex h-full flex-col bg-[#0a0a10] text-white/80">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
          Console
        </span>
        <button
          className="rounded p-0.5 text-white/30 hover:bg-white/10 hover:text-white/60"
          onClick={clearConsole}
          title="Clear console"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Log entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-1">
        {consoleLogs.length === 0 && (
          <p className="py-2 text-[11px] text-white/20">
            Console output will appear here...
          </p>
        )}
        {consoleLogs.map((entry) => (
          <div
            key={entry.id}
            className={`flex gap-2 border-b border-white/5 py-0.5 font-mono text-[11px] leading-relaxed ${
              LEVEL_STYLES[entry.level] || "text-white/80"
            }`}
          >
            {LEVEL_LABELS[entry.level] && (
              <span className="shrink-0 opacity-60">
                [{LEVEL_LABELS[entry.level]}]
              </span>
            )}
            <span className="whitespace-pre-wrap break-all">
              {entry.args.join(" ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
