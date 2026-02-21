"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import {
  Check,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Rocket,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

interface PlanCardProps {
  title: string;
  content: string;
  onApprove?: () => void;
  onReject?: () => void;
  isStreaming?: boolean;
  resolved?: "approved" | "rejected";
}

export function PlanCard({
  title,
  content,
  onApprove,
  onReject,
  isStreaming,
  resolved,
}: PlanCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className={`relative rounded-xl border overflow-hidden transition-all duration-300 backdrop-blur-sm ${
        isStreaming
          ? "border-violet-500/30 bg-gradient-to-b from-violet-500/[0.08] to-transparent shadow-lg shadow-violet-500/5"
          : resolved === "approved"
          ? "border-emerald-500/25 bg-gradient-to-b from-emerald-500/[0.06] to-transparent"
          : resolved === "rejected"
          ? "border-red-500/20 bg-gradient-to-b from-red-500/[0.04] to-transparent"
          : "border-white/[0.12] bg-white/[0.03]"
      }`}
    >
      {/* Animated top accent during streaming */}
      {isStreaming && (
        <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden">
          <div
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-violet-500 to-transparent"
            style={{
              animation: "progress-indeterminate 1.5s ease-in-out infinite",
            }}
          />
        </div>
      )}

      {/* Header */}
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
        onClick={() => setExpanded(!expanded)}
      >
        {isStreaming ? (
          <div className="relative flex h-7 w-7 items-center justify-center shrink-0">
            <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/15" />
            <Sparkles className="relative h-4 w-4 text-violet-400 animate-pulse" />
          </div>
        ) : resolved === "approved" ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 shrink-0">
            <Check className="h-4 w-4 text-emerald-400" />
          </div>
        ) : resolved === "rejected" ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/10 shrink-0">
            <X className="h-4 w-4 text-red-400" />
          </div>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/10 shrink-0">
            <Rocket className="h-4 w-4 text-violet-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-white">{title}</span>
          {isStreaming && (
            <p className="text-[11px] text-violet-300/60 mt-0.5">
              Planning your changes...
            </p>
          )}
          {resolved === "approved" && (
            <p className="text-[11px] text-emerald-400/60 mt-0.5">
              Plan approved — building now
            </p>
          )}
          {resolved === "rejected" && (
            <p className="text-[11px] text-red-400/60 mt-0.5">
              Plan rejected
            </p>
          )}
        </div>

        {expanded ? (
          <ChevronUp className="h-4 w-4 text-white/30 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white/30 shrink-0" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-white/[0.06]">
          <div className="px-4 py-3">
            <div
              className={[
                "prose prose-sm dark:prose-invert max-w-none",
                // Overall text
                "text-[13px] leading-relaxed text-white/70",
                // Headings — styled as section labels
                "prose-h2:text-[11px] prose-h2:font-semibold prose-h2:uppercase prose-h2:tracking-wider prose-h2:text-violet-300/80 prose-h2:mt-4 prose-h2:mb-2 prose-h2:first:mt-0",
                "prose-h3:text-xs prose-h3:font-semibold prose-h3:text-white/80 prose-h3:mt-3 prose-h3:mb-1.5",
                // Paragraphs
                "prose-p:my-1.5 prose-p:text-white/60 prose-p:leading-relaxed",
                // Lists
                "prose-ul:my-1.5 prose-ul:pl-0 prose-ul:list-none",
                "prose-ol:my-1.5 prose-ol:pl-4",
                "prose-li:my-0.5 prose-li:text-white/60 prose-li:pl-0",
                // Code (file names)
                "prose-code:text-violet-300 prose-code:bg-violet-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px] prose-code:font-medium prose-code:before:content-none prose-code:after:content-none",
                // Bold
                "prose-strong:text-white/80 prose-strong:font-semibold",
                // Links
                "prose-a:text-violet-400 prose-a:no-underline hover:prose-a:text-violet-300",
                // HR
                "prose-hr:border-white/[0.06] prose-hr:my-3",
              ].join(" ")}
            >
              <Markdown>{content.trim()}</Markdown>
            </div>

            {isStreaming && (
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-block h-4 w-0.5 animate-pulse rounded-full bg-violet-500" />
                <span className="text-[11px] text-violet-300/40">
                  Writing plan...
                </span>
              </div>
            )}
          </div>

          {/* Approve/Reject buttons */}
          {!resolved && !isStreaming && content.trim() && (
            <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]">
              <button
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                onClick={onApprove}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                Approve & Build
              </button>
              <button
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                onClick={onReject}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
