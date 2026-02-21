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
import {
  Globe,
  ExternalLink,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface AssistantMessageProps {
  content: string;
  isStreaming?: boolean;
  onPlanApprove?: (planTitle: string) => void;
  onPlanReject?: (planTitle: string) => void;
  resolvedPlans?: Record<string, "approved" | "rejected">;
  liveCard?: UpdateCardType;
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

function getToolIcon(name: string) {
  switch (name) {
    case "webSearch":
      return <Globe className="h-3.5 w-3.5" />;
    case "fetchUrl":
      return <ExternalLink className="h-3.5 w-3.5" />;
    default:
      return <Globe className="h-3.5 w-3.5" />;
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

  useEffect(() => {
    if (parsed.suggestions.length > 0 && onSuggestionsFound) {
      onSuggestionsFound(parsed.suggestions);
    }
  }, [parsed.suggestions, onSuggestionsFound]);

  return (
    <div className="group relative px-4 py-3 text-white/90">
      <div className="space-y-3">
        {parsed.blocks.map((block, i) => {
          if (block.type === "text") {
            return (
              <div
                key={`text-${i}`}
                className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-[1.7] prose-p:my-1.5 prose-headings:my-2.5 prose-headings:font-semibold prose-headings:tracking-[-0.02em] prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-code:rounded-md prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[12.5px] prose-code:font-medium prose-code:before:content-none prose-code:after:content-none prose-pre:my-2 prose-pre:rounded-xl prose-pre:bg-muted/80 text-[14px] leading-[1.7] tracking-[-0.01em]"
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
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs transition-all ${
                  isError
                    ? "border border-red-500/20 bg-red-500/5 text-red-500"
                    : isCalling
                    ? "border border-violet-500/20 bg-violet-500/5 text-violet-400"
                    : "border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {isCalling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                ) : isError ? (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                )}
                {getToolIcon(activity.name)}
                <span className="font-medium">{getToolLabel(activity.name)}</span>
                {query && (
                  <span className="truncate opacity-60 font-normal">{query}</span>
                )}
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

        {/* Historical artifact cards */}
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

        {/* Streaming cursor */}
        {isStreaming && parsed.plans.length === 0 && !liveCard && parsed.artifacts.length === 0 && parsed.blocks.length === 0 && (
          <span className="inline-block h-4 w-1 animate-pulse rounded-full bg-violet-500" />
        )}
      </div>

      {/* Reaction buttons */}
      {!isStreaming && (
        <div className="absolute -top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <MessageReactions content={content} />
        </div>
      )}
    </div>
  );
}
