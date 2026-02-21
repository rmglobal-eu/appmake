"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Search, X, ArrowUp, ArrowDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  content: string;
  role: string;
}

interface ConversationSearchProps {
  messages: Message[];
  onSelect: (messageId: string) => void;
}

function highlightMatch(text: string, query: string): React.ReactNode[] {
  if (!query.trim()) return [text];

  const parts: React.ReactNode[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let lastIndex = 0;

  let index = lowerText.indexOf(lowerQuery, lastIndex);
  while (index !== -1) {
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }
    parts.push(
      <mark
        key={`match-${index}`}
        className="bg-violet-500/30 text-white rounded-sm px-0.5"
      >
        {text.slice(index, index + query.length)}
      </mark>
    );
    lastIndex = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function getExcerpt(content: string, query: string, maxLength = 150): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerContent.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return content.slice(0, maxLength);
  }

  const start = Math.max(0, matchIndex - 40);
  const end = Math.min(content.length, matchIndex + query.length + 80);
  let excerpt = content.slice(start, end);

  if (start > 0) excerpt = "..." + excerpt;
  if (end < content.length) excerpt = excerpt + "...";

  return excerpt;
}

export default function ConversationSearch({
  messages,
  onSelect,
}: ConversationSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return messages.filter((msg) =>
      msg.content.toLowerCase().includes(lowerQuery)
    );
  }, [query, messages]);

  // Keyboard shortcut: Ctrl+F / Cmd+F
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  // Scroll active result into view
  useEffect(() => {
    if (resultsRef.current) {
      const activeEl = resultsRef.current.querySelector(
        '[data-active="true"]'
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter" && results.length > 0) {
        e.preventDefault();
        onSelect(results[selectedIndex].id);
        setOpen(false);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [results, selectedIndex, onSelect]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#1a1a22] border-[#2a2a35] text-white max-w-lg p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Conversation</DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a35]">
          <Search className="w-4 h-4 text-white/40 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search messages..."
            className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30 focus:outline-none"
          />
          {query && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/30">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => setQuery("")}
                className="p-1 rounded text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        <div
          ref={resultsRef}
          className="max-h-[400px] overflow-y-auto"
        >
          {query.trim() && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-white/30">
              No messages found matching &quot;{query}&quot;
            </div>
          )}

          {results.map((msg, index) => (
            <button
              key={msg.id}
              data-active={index === selectedIndex}
              onClick={() => {
                onSelect(msg.id);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-3 border-b border-[#2a2a35] last:border-b-0 transition-colors ${
                index === selectedIndex
                  ? "bg-violet-500/10"
                  : "hover:bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    msg.role === "user"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-violet-500/20 text-violet-400"
                  }`}
                >
                  {msg.role}
                </span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed line-clamp-2">
                {highlightMatch(getExcerpt(msg.content, query), query)}
              </p>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-[#2a2a35] text-[10px] text-white/20">
          <span className="flex items-center gap-1">
            <ArrowUp className="w-3 h-3" />
            <ArrowDown className="w-3 h-3" />
            Navigate
          </span>
          <span>Enter to select</span>
          <span>Esc to close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
