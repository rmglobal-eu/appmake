"use client";

import { useState, useEffect } from "react";
import { useUpdateCardStore } from "@/lib/stores/update-card-store";
import { Sparkles } from "lucide-react";

const STATUS_MESSAGES = [
  "Analyzing your request",
  "Planning the approach",
  "Thinking through the details",
  "Preparing the implementation",
];

export function ThinkingIndicator() {
  const { thinkingStartedAt } = useUpdateCardStore();
  const [elapsed, setElapsed] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!thinkingStartedAt) {
      setElapsed(0);
      setMsgIndex(0);
      return;
    }

    setElapsed(Math.floor((Date.now() - thinkingStartedAt) / 1000));
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - thinkingStartedAt) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [thinkingStartedAt]);

  // Cycle through status messages every 4 seconds
  useEffect(() => {
    if (!thinkingStartedAt) return;
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [thinkingStartedAt]);

  if (!thinkingStartedAt) return null;

  return (
    <div className="px-4 py-3">
      <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/5 via-pink-500/10 to-violet-500/5 p-4 backdrop-blur-sm">
        {/* Animated shimmer overlay */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-violet-500/10 to-transparent" />

        <div className="relative flex items-center gap-3">
          {/* Animated icon */}
          <div className="relative flex h-8 w-8 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/20" />
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10">
              <Sparkles className="h-4 w-4 text-violet-400 animate-pulse" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Status message */}
            <p className="text-sm font-medium text-white">
              {STATUS_MESSAGES[msgIndex]}
              <span className="inline-flex ml-0.5">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
              </span>
            </p>
            <p className="text-xs text-white/40 mt-0.5">
              {elapsed > 0 ? `Working for ${elapsed}s` : "Starting up"}
            </p>
          </div>

          {/* Animated dots */}
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block h-1.5 w-1.5 rounded-full bg-violet-400"
                style={{
                  animation: "pulse 1.5s ease-in-out infinite",
                  animationDelay: `${i * 200}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
