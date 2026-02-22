"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { SessionProgress } from "./SessionProgress";
import { SessionComplete } from "./SessionComplete";
import { SuggestionChips } from "./SuggestionChips";
import { useUpdateCardStore } from "@/lib/stores/update-card-store";
import {
  FileCode,
  Loader2,
  Globe,
  LayoutDashboard,
  ShoppingCart,
  User,
  BookOpen,
  Smartphone,
} from "lucide-react";
import type { ChatMessage } from "@/types/chat";
import type { UpdateCard } from "@/types/update-card";

const STARTER_CARDS = [
  {
    icon: Globe,
    label: "Landing Page",
    prompt:
      "Build a modern landing page with a hero section, features grid, pricing table, testimonials, and footer. Use a clean design with gradients and smooth animations.",
  },
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    prompt:
      "Create an analytics dashboard with stat cards, line/bar charts using recharts, a data table with sorting, and a sidebar navigation. Use a professional dark theme.",
  },
  {
    icon: ShoppingCart,
    label: "E-commerce",
    prompt:
      "Build a product listing page with product cards showing images, prices, and ratings. Include a cart icon with item count, add-to-cart buttons, and category filters.",
  },
  {
    icon: User,
    label: "Portfolio",
    prompt:
      "Create a personal portfolio with a hero section, project gallery with hover effects, about section, skills grid, and a contact form. Use elegant typography and spacing.",
  },
  {
    icon: BookOpen,
    label: "Blog",
    prompt:
      "Build a blog with article cards showing thumbnails, titles, excerpts, and dates. Include category filters, a featured post section, and a reading view for articles.",
  },
  {
    icon: Smartphone,
    label: "Mobile App",
    prompt:
      "Create a mobile-first app interface with bottom tab navigation, content cards, a floating action button, pull-to-refresh style header, and smooth transitions between views.",
  },
];

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
          <div className="flex h-full min-h-[400px] items-center justify-center px-4">
            <div className="w-full max-w-lg text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-pink-600">
                <span className="text-lg font-bold text-white">A</span>
              </div>
              <h2 className="text-lg font-semibold text-white/90">
                What do you want to build?
              </h2>
              <p className="mt-1 text-sm text-white/40">
                Pick a template or describe your app
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {STARTER_CARDS.map((card) => (
                  <button
                    key={card.label}
                    onClick={() => onSendMessage?.(card.prompt)}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-center transition-all hover:border-violet-500/30 hover:bg-violet-500/10"
                  >
                    <card.icon className="h-5 w-5 text-white/40 group-hover:text-violet-400 transition-colors" />
                    <span className="text-xs font-medium text-white/60 group-hover:text-white/90 transition-colors">
                      {card.label}
                    </span>
                  </button>
                ))}
              </div>
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
              onInterviewSubmit={onSendMessage}
            />
          )
        )}

        {/* Session progress bar */}
        {isStreaming && <SessionProgress />}

        {/* Thinking indicator: show when streaming but no content yet */}
        {isStreaming && !activeCardId && !streamingContent && (
          <ThinkingIndicator />
        )}

        {/* Streaming file indicator - prominent banner */}
        {isStreaming && currentStreamingFile && (
          <div className="px-4 py-2">
            <div className="relative flex items-center gap-2.5 overflow-hidden rounded-lg border border-violet-500/20 bg-violet-500/5 px-3.5 py-2.5 backdrop-blur-sm">
              {/* Animated shimmer */}
              <div
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-violet-500/5 to-transparent"
                style={{ animation: "shimmer 2s infinite" }}
              />
              <Loader2 className="relative h-3.5 w-3.5 animate-spin text-violet-400 shrink-0" />
              <FileCode className="relative h-3.5 w-3.5 text-violet-300 shrink-0" />
              <span className="relative text-xs font-medium text-violet-300">
                Writing
              </span>
              <span className="relative truncate font-mono text-xs text-violet-400/80">
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
            onInterviewSubmit={onSendMessage}
          />
        )}

        {/* Session complete badge */}
        {!isStreaming && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
          <SessionComplete />
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
