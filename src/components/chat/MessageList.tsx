"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { SuggestionChips } from "./SuggestionChips";
import { useUpdateCardStore } from "@/lib/stores/update-card-store";
import { FileCode, Loader2 } from "lucide-react";
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
  const isStuckToBottom = useRef(true);
  const prevMessagesLen = useRef(messages.length);
  const { currentStreamingFile, activeCardId } = useUpdateCardStore();

  // Track whether user is scrolled to bottom
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    isStuckToBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  // New message added → smooth scroll
  useEffect(() => {
    if (messages.length > prevMessagesLen.current && isStuckToBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLen.current = messages.length;
  }, [messages.length]);

  // Streaming content updating → instant scroll via rAF
  useEffect(() => {
    if (!streamingContent || !isStuckToBottom.current) return;
    const id = requestAnimationFrame(() => {
      const el = containerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(id);
  }, [streamingContent]);

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
      onScroll={handleScroll}
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

        {/* Thinking indicator: show when streaming but no content yet */}
        {isStreaming && !activeCardId && !streamingContent && (
          <ThinkingIndicator />
        )}

        {/* Streaming file indicator - prominent banner */}
        {isStreaming && currentStreamingFile && (
          <div className="px-4 py-2">
            <div className="relative flex items-center gap-2.5 overflow-hidden rounded-lg border border-blue-500/20 bg-blue-500/5 px-3.5 py-2.5">
              {/* Animated shimmer */}
              <div
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-blue-500/5 to-transparent"
                style={{ animation: "shimmer 2s infinite" }}
              />
              <Loader2 className="relative h-3.5 w-3.5 animate-spin text-blue-500 shrink-0" />
              <FileCode className="relative h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span className="relative text-xs font-medium text-blue-600 dark:text-blue-400">
                Writing
              </span>
              <span className="relative truncate font-mono text-xs text-blue-500/80">
                {currentStreamingFile}
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

        {/* Suggestion chips */}
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
