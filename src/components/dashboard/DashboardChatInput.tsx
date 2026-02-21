"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp } from "lucide-react";

const PLACEHOLDERS = [
  "Build a todo app with drag-and-drop...",
  "Create a SaaS dashboard with charts...",
  "Make a landing page for my startup...",
  "Design a chat application with real-time...",
  "Build an e-commerce store with payments...",
];

export function DashboardChatInput() {
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

  const handleSubmit = useCallback(async () => {
    const prompt = value.trim();
    if (!prompt || loading) return;

    setLoading(true);
    try {
      const name = prompt.length > 40 ? prompt.slice(0, 40) + "..." : prompt;
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
  }, [value, loading, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md transition-colors focus-within:border-white/30">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading}
          className="w-full resize-none bg-transparent px-5 py-4 pr-14 text-white placeholder-transparent outline-none disabled:opacity-50"
        />
        {/* Animated placeholder */}
        {!value && (
          <span
            className={`pointer-events-none absolute left-5 top-4 text-white/40 transition-opacity duration-300 ${
              placeholderVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {PLACEHOLDERS[placeholderIdx]}
          </span>
        )}
        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || loading}
          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black transition-opacity hover:opacity-80 disabled:opacity-30"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
