"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

interface AppIdea {
  emoji: string;
  title: string;
  description: string;
  prompt: string;
}

const DEFAULT_IDEAS: AppIdea[] = [
  {
    emoji: "🚀",
    title: "SaaS Landing Page",
    description: "Modern pricing page with feature comparison and testimonials",
    prompt:
      "Build a modern SaaS landing page with a hero section, feature grid, pricing table with monthly/annual toggle, testimonial carousel, and a call-to-action footer. Use a clean, professional design with smooth scroll animations.",
  },
  {
    emoji: "📊",
    title: "Analytics Dashboard",
    description: "Real-time charts, KPI cards, and data tables with filters",
    prompt:
      "Create an analytics dashboard with KPI summary cards at the top, interactive line and bar charts for revenue and user metrics, a filterable data table, and a date range picker. Include a dark sidebar navigation.",
  },
  {
    emoji: "🛍️",
    title: "E-commerce Store",
    description: "Product catalog with cart, search, and category filters",
    prompt:
      "Build an e-commerce storefront with a product grid, category sidebar filters, search bar, product detail modal, and a shopping cart with quantity controls. Include add-to-cart animations and a checkout summary.",
  },
  {
    emoji: "🎨",
    title: "Portfolio Website",
    description: "Elegant personal site with project gallery and contact form",
    prompt:
      "Create a personal portfolio website with a hero section, about me area, project gallery with hover effects and detail modals, a skills section, and a contact form. Use elegant typography and subtle animations.",
  },
  {
    emoji: "💪",
    title: "Fitness Tracker",
    description: "Mobile-first workout logger with progress charts and streaks",
    prompt:
      "Build a mobile-first fitness tracker app with a workout logger, exercise library, progress charts showing weight and reps over time, a streak counter, and a weekly activity calendar. Use a motivating color scheme.",
  },
  {
    emoji: "✍️",
    title: "AI Content Tool",
    description: "Text generator with templates, history, and export options",
    prompt:
      "Create an AI content generation tool with a template selector, text input area, generated output panel, history sidebar, and export buttons for copy/download. Include a clean, minimal writing-focused interface.",
  },
];

export function IdeaCards({ onSelect }: { onSelect: (prompt: string) => void }) {
  const [ideas, setIdeas] = useState<AppIdea[]>(DEFAULT_IDEAS);
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);

  const fetchMoreIdeas = async () => {
    if (loading) return;
    setLoading(true);
    setFadeIn(false);

    try {
      const res = await fetch("/api/ideas");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data.ideas?.length) {
        setIdeas(data.ideas);
      }
    } catch {
      // Keep current ideas on error
    } finally {
      setLoading(false);
      // Trigger fade-in after a brief delay
      requestAnimationFrame(() => setFadeIn(true));
    }
  };

  return (
    <div className="w-full max-w-2xl mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-sm font-medium text-white/50">Ideas to get started:</p>
        <button
          onClick={fetchMoreIdeas}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white/70 disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          More ideas
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[88px] animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.03]"
              />
            ))
          : ideas.map((idea, i) => (
              <button
                key={`${idea.title}-${i}`}
                onClick={() => onSelect(idea.prompt)}
                className={`group flex flex-col gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.06] ${
                  fadeIn
                    ? "translate-y-0 opacity-100"
                    : "translate-y-1 opacity-0"
                }`}
                style={{
                  transitionDuration: `${200 + i * 50}ms`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{idea.emoji}</span>
                  <span className="text-sm font-medium text-white/80 group-hover:text-white/90">
                    {idea.title}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-white/40 group-hover:text-white/50">
                  {idea.description}
                </p>
              </button>
            ))}
      </div>
    </div>
  );
}
