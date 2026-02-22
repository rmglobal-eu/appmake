"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp, Plus, Mic, ListChecks } from "lucide-react";

const PLACEHOLDERS = [
  "Build a todo app with drag-and-drop...",
  "Create a SaaS dashboard with charts...",
  "Make a landing page for my startup...",
  "Design a chat application with real-time...",
  "Build an e-commerce store with payments...",
];

interface DashboardChatInputProps {
  externalPrompt?: string | null;
  onPromptConsumed?: () => void;
}

export function DashboardChatInput({
  externalPrompt,
  onPromptConsumed,
}: DashboardChatInputProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rotate placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
        setPlaceholderVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleSubmit = useCallback(
    async (overridePrompt?: string) => {
      const prompt = (overridePrompt ?? value).trim();
      if (!prompt || loading) return;

      setLoading(true);
      try {
        const name =
          prompt.length > 40 ? prompt.slice(0, 40) + "..." : prompt;
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, template: "node" }),
        });

        if (!res.ok) throw new Error("Failed to create project");
        const data = await res.json();
        const projectId = data.project.id;

        // Store prompt for auto-send after redirect
        sessionStorage.setItem(`appmake_initial_prompt_${projectId}`, prompt);
        router.push(`/chat/${projectId}`);
      } catch {
        toast.error("Failed to create project");
        setLoading(false);
      }
    },
    [value, loading, router]
  );

  // Handle external prompt from IdeaCards
  useEffect(() => {
    if (externalPrompt) {
      setValue(externalPrompt);
      handleSubmit(externalPrompt);
      onPromptConsumed?.();
    }
  }, [externalPrompt]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="rounded-[20px] border border-white/[0.08] bg-[#1e1e22] shadow-2xl transition-colors focus-within:border-white/15">
        {/* Textarea area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={loading}
            style={{ color: "#ffffff" }}
            className="w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] font-semibold placeholder-transparent outline-none disabled:opacity-50"
          />
          {/* Animated placeholder */}
          {!value && (
            <span
              className={`pointer-events-none absolute left-5 top-4 text-[15px] text-white/40 transition-opacity duration-300 ${
                placeholderVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {PLACEHOLDERS[placeholderIdx]}
            </span>
          )}
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-3">
          {/* Left side — attachment */}
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:text-white/70"
          >
            <Plus className="h-[18px] w-[18px]" />
          </button>

          {/* Right side — Plan, Mic, Send */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-white/50 transition-colors hover:text-white/70"
            >
              <ListChecks className="h-4 w-4" />
              <span className="text-[13px] font-medium">Plan</span>
            </button>

            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:text-white/70"
            >
              <Mic className="h-[18px] w-[18px]" />
            </button>

            <button
              onClick={() => handleSubmit()}
              disabled={!value.trim() || loading}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#555] text-white transition-all hover:bg-[#666] disabled:bg-[#333] disabled:text-white/30"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <ArrowUp className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
