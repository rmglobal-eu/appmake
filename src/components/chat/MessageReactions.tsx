"use client";

import { useCallback } from "react";
import { ThumbsUp, ThumbsDown, Copy, Reply } from "lucide-react";
import { toast } from "sonner";

interface MessageReactionsProps {
  content: string;
  onReply?: (quotedText: string) => void;
}

export function MessageReactions({ content, onReply }: MessageReactionsProps) {
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard", { duration: 1500 });
  }, [content]);

  const handleThumbsUp = useCallback(() => {
    toast.success("Thanks for the feedback!", { duration: 1500 });
  }, []);

  const handleThumbsDown = useCallback(() => {
    toast("Feedback noted", { duration: 1500 });
  }, []);

  const handleReply = useCallback(() => {
    const quote = content.slice(0, 100).replace(/\n/g, " ");
    onReply?.(`> ${quote}${content.length > 100 ? "..." : ""}\n\n`);
  }, [content, onReply]);

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-[#0f0f14]/90 shadow-lg backdrop-blur-xl p-0.5">
      <button
        onClick={handleThumbsUp}
        className="rounded p-1 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        title="Helpful"
      >
        <ThumbsUp className="h-3 w-3" />
      </button>
      <button
        onClick={handleThumbsDown}
        className="rounded p-1 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        title="Not helpful"
      >
        <ThumbsDown className="h-3 w-3" />
      </button>
      <button
        onClick={handleCopy}
        className="rounded p-1 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        title="Copy"
      >
        <Copy className="h-3 w-3" />
      </button>
      <button
        onClick={handleReply}
        className="rounded p-1 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        title="Reply"
      >
        <Reply className="h-3 w-3" />
      </button>
    </div>
  );
}
