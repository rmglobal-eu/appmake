"use client";

import { useCallback } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface MessageReactionsProps {
  messageId: string;
  currentReaction?: "thumbs_up" | "thumbs_down" | null;
  onReact: (
    messageId: string,
    type: "thumbs_up" | "thumbs_down"
  ) => void;
}

export function MessageReactions({
  messageId,
  currentReaction,
  onReact,
}: MessageReactionsProps) {
  const handleThumbsUp = useCallback(() => {
    onReact(messageId, "thumbs_up");
  }, [messageId, onReact]);

  const handleThumbsDown = useCallback(() => {
    onReact(messageId, "thumbs_down");
  }, [messageId, onReact]);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleThumbsUp}
        className={`p-1.5 rounded-md transition-all duration-150 ${
          currentReaction === "thumbs_up"
            ? "text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/20"
            : "text-white/30 hover:text-white/60 hover:bg-white/5"
        }`}
        title="Helpful"
        aria-label="Mark as helpful"
        aria-pressed={currentReaction === "thumbs_up"}
      >
        <ThumbsUp
          className={`w-3.5 h-3.5 ${
            currentReaction === "thumbs_up" ? "fill-emerald-400" : ""
          }`}
        />
      </button>
      <button
        onClick={handleThumbsDown}
        className={`p-1.5 rounded-md transition-all duration-150 ${
          currentReaction === "thumbs_down"
            ? "text-red-400 bg-red-500/15 hover:bg-red-500/20"
            : "text-white/30 hover:text-white/60 hover:bg-white/5"
        }`}
        title="Not helpful"
        aria-label="Mark as not helpful"
        aria-pressed={currentReaction === "thumbs_down"}
      >
        <ThumbsDown
          className={`w-3.5 h-3.5 ${
            currentReaction === "thumbs_down" ? "fill-red-400" : ""
          }`}
        />
      </button>
    </div>
  );
}
