"use client";

import { useEffect, useRef } from "react";

interface TerminalProps {
  wsUrl: string;
  sessionId: string;
}

export function Terminal({ wsUrl, sessionId }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<import("@xterm/xterm").Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup = false;

    async function init() {
      const { Terminal: XTerm } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      const { WebLinksAddon } = await import("@xterm/addon-web-links");

      if (cleanup || !containerRef.current) return;

      const term = new XTerm({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: "var(--font-geist-mono), monospace",
        theme: {
          background: "#1a1a1a",
          foreground: "#e0e0e0",
        },
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());

      term.open(containerRef.current);
      fitAddon.fit();

      termRef.current = term;

      // Connect WebSocket
      const ws = new WebSocket(`${wsUrl}?session=${sessionId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        term.writeln("Connected to sandbox terminal.\r\n");
      };

      ws.onmessage = (event) => {
        term.write(event.data);
      };

      ws.onclose = () => {
        term.writeln("\r\n\x1b[31mConnection closed.\x1b[0m");
      };

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      // Resize handling
      const resizeObserver = new ResizeObserver(() => {
        fitAddon.fit();
      });
      resizeObserver.observe(containerRef.current!);

      return () => {
        resizeObserver.disconnect();
      };
    }

    init();

    return () => {
      cleanup = true;
      wsRef.current?.close();
      termRef.current?.dispose();
    };
  }, [wsUrl, sessionId]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-[#1a1a1a]"
    />
  );
}
