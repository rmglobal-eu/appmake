"use client";

import { useState, useEffect } from "react";
import { useUpdateCardStore } from "@/lib/stores/update-card-store";

export function ThinkingIndicator() {
  const { thinkingStartedAt } = useUpdateCardStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!thinkingStartedAt) {
      setElapsed(0);
      return;
    }

    setElapsed(Math.floor((Date.now() - thinkingStartedAt) / 1000));
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - thinkingStartedAt) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [thinkingStartedAt]);

  if (!thinkingStartedAt) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-1">
        <span
          className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span className="text-xs text-muted-foreground">
        Thinking{elapsed > 0 ? ` for ${elapsed}s` : ""}...
      </span>
    </div>
  );
}
