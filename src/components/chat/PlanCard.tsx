"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Check, X, ListChecks, ChevronDown, ChevronUp } from "lucide-react";

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
    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 overflow-hidden">
      {/* Header */}
      <button
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-blue-100/50 dark:hover:bg-blue-900/20"
        onClick={() => setExpanded(!expanded)}
      >
        <ListChecks className="h-4 w-4 text-blue-500 shrink-0" />
        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex-1 truncate">
          Plan: {title}
        </span>
        {resolved === "approved" && (
          <span className="text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-full px-2 py-0.5">
            Approved
          </span>
        )}
        {resolved === "rejected" && (
          <span className="text-[10px] font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-full px-2 py-0.5">
            Rejected
          </span>
        )}
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-blue-200/50 dark:border-blue-800/50 px-3 py-2">
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1 prose-headings:my-1.5 prose-headings:text-sm prose-ul:my-1 prose-ol:my-1 prose-li:my-0 text-xs">
            <Markdown>{content.trim()}</Markdown>
          </div>

          {isStreaming && (
            <span className="inline-block h-3 w-0.5 animate-pulse rounded-full bg-blue-500 mt-1" />
          )}

          {/* Approve/Reject buttons */}
          {!resolved && !isStreaming && content.trim() && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-blue-200/50 dark:border-blue-800/50">
              <Button
                size="sm"
                className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                onClick={onApprove}
              >
                <Check className="h-3 w-3" />
                Approve Plan
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={onReject}
              >
                <X className="h-3 w-3" />
                Reject
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
