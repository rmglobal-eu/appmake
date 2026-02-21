"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface StreamingIndicatorProps {
  isStreaming: boolean;
  modelName?: string;
}

export default function StreamingIndicator({
  isStreaming,
  modelName = "Claude",
}: StreamingIndicatorProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    if (!isStreaming) {
      setElapsedSeconds(0);
      setDotCount(1);
      return;
    }

    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const dotInterval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);

    return () => {
      clearInterval(timerInterval);
      clearInterval(dotInterval);
    };
  }, [isStreaming]);

  if (!isStreaming) return null;

  const dots = ".".repeat(dotCount);
  const formattedTime =
    elapsedSeconds < 60
      ? `${elapsedSeconds}s`
      : `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1a1a22] border border-[#2a2a35] animate-pulse">
      <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-white/90">
          AI is thinking{dots}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">
            Using {modelName}
          </span>
          <span className="text-xs text-white/30">|</span>
          <span className="text-xs text-white/40">{formattedTime}</span>
        </div>
      </div>
    </div>
  );
}
