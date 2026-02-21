"use client";

import { useState } from "react";
import { Pin, X, ChevronDown, ChevronUp } from "lucide-react";

interface PinnedMessage {
  id: string;
  content: string;
  pinnedAt: Date;
}

interface PinnedMessagesProps {
  pinnedMessages: PinnedMessage[];
  onUnpin: (messageId: string) => void;
}

export default function PinnedMessages({
  pinnedMessages,
  onUnpin,
}: PinnedMessagesProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (pinnedMessages.length === 0) return null;

  return (
    <div className="border-b border-[#2a2a35] bg-[#1a1a22]/50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Pin className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-medium text-white/60">
            Pinned Messages
          </span>
          <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full">
            {pinnedMessages.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-white/30" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-white/30" />
        )}
      </button>

      {/* Pinned items */}
      {isExpanded && (
        <div className="px-4 pb-3 space-y-2">
          {pinnedMessages.map((msg) => (
            <div
              key={msg.id}
              className="group/pin flex items-start gap-3 px-3 py-2.5 rounded-lg bg-[#0f0f14] border border-[#2a2a35] hover:border-amber-500/20 transition-colors"
            >
              <Pin className="w-3 h-3 text-amber-400/60 mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/70 leading-relaxed line-clamp-2">
                  {msg.content}
                </p>
                <span className="text-[10px] text-white/20 mt-1 block">
                  Pinned{" "}
                  {msg.pinnedAt.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnpin(msg.id);
                }}
                className="p-1 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover/pin:opacity-100 transition-all shrink-0"
                title="Unpin message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
