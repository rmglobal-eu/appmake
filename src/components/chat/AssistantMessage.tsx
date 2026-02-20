"use client";

import { useMemo, useEffect } from "react";
import Markdown from "react-markdown";
import { UpdateCard } from "./UpdateCard";
import { PlanCard } from "./PlanCard";
import { MessageReactions } from "./MessageReactions";
import { MessageParser } from "@/lib/parser/message-parser";
import type { Action } from "@/types/actions";
import type { UpdateCard as UpdateCardType } from "@/types/update-card";
import type { ToolActivity } from "@/lib/parser/types";

interface AssistantMessageProps {
  content: string;
  isStreaming?: boolean;
  onPlanApprove?: (planTitle: string) => void;
  onPlanReject?: (planTitle: string) => void;
  resolvedPlans?: Record<string, "approved" | "rejected">;
  /** Live update card from store (only during streaming) */
  liveCard?: UpdateCardType;
  /** Parsed suggestions from content */
  onSuggestionsFound?: (suggestions: string[]) => void;
}

interface ParsedPlan {
  title: string;
  content: string;
}

type ContentBlock =
  | { type: "text"; content: string }
  | { type: "tool"; activity: ToolActivity };

interface ParsedContent {
  textParts: string[];
  artifacts: {
    id: string;
    title: string;
    actions: Action[];
  }[];
  plans: ParsedPlan[];
  suggestions: string[];
  blocks: ContentBlock[];
}

function getToolLabel(name: string): string {
  switch (name) {
    case "webSearch": return "Searching the web";
    case "fetchUrl": return "Reading webpage";
    default: return name;
  }
}

function getToolQuery(activity: ToolActivity): string | null {
  if (!activity.args) return null;
  try {
    const parsed = JSON.parse(activity.args);
    return parsed.query || parsed.url || null;
  } catch {
    return activity.args;
  }
}

function parseContent(content: string): ParsedContent {
  const textParts: string[] = [];
  const artifacts: { id: string; title: string; actions: Action[] }[] = [];
  const plans: ParsedPlan[] = [];
  const blocks: ContentBlock[] = [];
  let suggestions: string[] = [];
  let currentText = "";
  let currentArtifact: { id: string; title: string; actions: Action[] } | null = null;
  let currentPlan: ParsedPlan | null = null;

  const flushText = () => {
    if (currentText.trim()) {
      textParts.push(currentText);
      blocks.push({ type: "text", content: currentText });
      currentText = "";
    }
  };

  const parser = new MessageParser({
    onText: (text) => {
      if (!currentArtifact && !currentPlan) {
        currentText += text;
      }
    },
    onArtifactOpen: ({ id, title }) => {
      flushText();
      currentArtifact = { id, title, actions: [] };
    },
    onArtifactClose: () => {
      if (currentArtifact) {
        artifacts.push(currentArtifact);
        currentArtifact = null;
      }
    },
    onActionClose: (_artifactId, action) => {
      currentArtifact?.actions.push(action);
    },
    onPlanOpen: ({ title }) => {
      flushText();
      currentPlan = { title, content: "" };
    },
    onPlanContent: (text) => {
      if (currentPlan) {
        currentPlan.content += text;
      }
    },
    onPlanClose: () => {
      if (currentPlan) {
        plans.push(currentPlan);
        currentPlan = null;
      }
    },
    onSuggestionsClose: (s) => {
      suggestions = s;
    },
    onToolActivity: (activity) => {
      flushText();
      blocks.push({ type: "tool", activity });
    },
  });

  parser.push(content);
  parser.end();

  if (currentPlan) {
    plans.push(currentPlan);
  }

  if (currentText.trim()) {
    textParts.push(currentText);
    blocks.push({ type: "text", content: currentText });
  }

  return { textParts, artifacts, plans, suggestions, blocks };
}

export function AssistantMessage({
  content,
  isStreaming,
  onPlanApprove,
  onPlanReject,
  resolvedPlans,
  liveCard,
  onSuggestionsFound,
}: AssistantMessageProps) {
  const parsed = useMemo(() => parseContent(content), [content]);

  // Notify parent of suggestions (separate effect to avoid side-effect in render)
  useEffect(() => {
    if (parsed.suggestions.length > 0 && onSuggestionsFound) {
      onSuggestionsFound(parsed.suggestions);
    }
  }, [parsed.suggestions, onSuggestionsFound]);

  return (
    <div className="group relative px-4 py-3">
      <div className="space-y-2">
        {parsed.blocks.map((block, i) => {
          if (block.type === "text") {
            return (
              <div
                key={`text-${i}`}
                className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1.5 prose-headings:my-2 prose-headings:font-semibold prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0 prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-[12px] prose-code:before:content-none prose-code:after:content-none prose-pre:my-2 prose-pre:rounded-lg prose-pre:bg-muted"
              >
                <Markdown>{block.content.trim()}</Markdown>
              </div>
            );
          }
          if (block.type === "tool") {
            const { activity } = block;
            const query = getToolQuery(activity);
            const isCalling = activity.status === "calling";
            const isError = activity.status === "error";
            return (
              <div
                key={`tool-${i}`}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                  isError
                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                    : isCalling
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                    : "border-green-500/30 bg-green-500/10 text-green-400"
                }`}
              >
                {isCalling ? (
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : isError ? (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                <span className="font-medium">{getToolLabel(activity.name)}</span>
                {query && <span className="truncate opacity-70">&mdash; {query}</span>}
              </div>
            );
          }
          return null;
        })}

        {parsed.plans.map((plan, i) => (
          <PlanCard
            key={`plan-${i}`}
            title={plan.title}
            content={plan.content}
            isStreaming={isStreaming && i === parsed.plans.length - 1 && !plan.content.includes("</plan>")}
            onApprove={() => onPlanApprove?.(plan.title)}
            onReject={() => onPlanReject?.(plan.title)}
            resolved={resolvedPlans?.[plan.title]}
          />
        ))}

        {/* Live streaming card */}
        {isStreaming && liveCard && (
          <UpdateCard card={liveCard} />
        )}

        {/* Historical artifact cards (rendered as UpdateCards) */}
        {!isStreaming && parsed.artifacts.map((artifact) => (
          <UpdateCard
            key={artifact.id}
            title={artifact.title}
            actions={artifact.actions.map((a) => ({
              action: a,
              status: "completed" as const,
            }))}
          />
        ))}

        {isStreaming && parsed.plans.length === 0 && !liveCard && parsed.artifacts.length === 0 && parsed.blocks.length === 0 && (
          <span className="inline-block h-4 w-1 animate-pulse rounded-full bg-primary" />
        )}
      </div>

      {/* Reaction buttons on hover */}
      {!isStreaming && (
        <div className="absolute -top-3 right-4">
          <MessageReactions content={content} />
        </div>
      )}
    </div>
  );
}
