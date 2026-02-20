"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { SuggestionChips } from "./SuggestionChips";
import { useUpdateCardStore } from "@/lib/stores/update-card-store";
import type { ChatMessage } from "@/types/chat";
import type { UpdateCard } from "@/types/update-card";

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent?: string;
  userName?: string;
  userImage?: string;
  onPlanApprove?: (planTitle: string) => void;
  onPlanReject?: (planTitle: string) => void;
  resolvedPlans?: Record<string, "approved" | "rejected">;
  onSendMessage?: (content: string) => void;
  liveCard?: UpdateCard;
}

export function MessageList({
  messages,
  isStreaming,
  streamingContent,
  userName,
  userImage,
  onPlanApprove,
  onPlanReject,
  resolvedPlans,
  onSendMessage,
  liveCard,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { currentStreamingFile, activeCardId } = useUpdateCardStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Clear suggestions when streaming starts
  useEffect(() => {
    if (isStreaming) {
      setSuggestions([]);
    }
  }, [isStreaming]);

  const handleSuggestionsFound = useCallback((s: string[]) => {
    setSuggestions(s);
  }, []);

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      setSuggestions([]);
      onSendMessage?.(suggestion);
    },
    [onSendMessage]
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto"
    >
      <div className="pb-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex h-full min-h-[300px] items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">What do you want to build?</p>
              <p className="mt-1 text-sm">Describe your app and I&apos;ll generate the code.</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <UserMessage
              key={msg.id}
              content={msg.content}
              userName={userName}
              userImage={userImage}
            />
          ) : (
            <AssistantMessage
              key={msg.id}
              content={msg.content}
              onPlanApprove={onPlanApprove}
              onPlanReject={onPlanReject}
              resolvedPlans={resolvedPlans}
              onSuggestionsFound={
                i === messages.length - 1 ? handleSuggestionsFound : undefined
              }
            />
          )
        )}

        {/* Thinking indicator: show when streaming but no card yet */}
        {isStreaming && !activeCardId && !streamingContent && (
          <ThinkingIndicator />
        )}

        {/* Streaming file indicator */}
        {isStreaming && currentStreamingFile && (
          <div className="px-4 py-1">
            <div className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] font-mono text-muted-foreground truncate">
                Writing {currentStreamingFile}...
              </span>
            </div>
          </div>
        )}

        {isStreaming && streamingContent !== undefined && (
          <AssistantMessage
            content={streamingContent}
            isStreaming
            onPlanApprove={onPlanApprove}
            onPlanReject={onPlanReject}
            resolvedPlans={resolvedPlans}
            liveCard={liveCard}
          />
        )}

        {/* Suggestion chips: show after last assistant message when not streaming */}
        {!isStreaming && suggestions.length > 0 && (
          <SuggestionChips
            suggestions={suggestions}
            onSelect={handleSuggestionSelect}
          />
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
