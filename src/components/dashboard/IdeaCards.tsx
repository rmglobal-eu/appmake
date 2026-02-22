"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

interface AppIdea {
  title: string;
  prompt: string;
}

const DEFAULT_IDEAS: AppIdea[] = [
  {
    title: "SaaS Landing Page",
    prompt:
      "Build a modern SaaS landing page with a hero section, feature grid, pricing table with monthly/annual toggle, testimonial carousel, and a call-to-action footer. Use a clean, professional design with smooth scroll animations.",
  },
  {
    title: "Analytics Dashboard",
    prompt:
      "Create an analytics dashboard with KPI summary cards at the top, interactive line and bar charts for revenue and user metrics, a filterable data table, and a date range picker. Include a dark sidebar navigation.",
  },
  {
    title: "E-commerce Store",
    prompt:
      "Build an e-commerce storefront with a product grid, category sidebar filters, search bar, product detail modal, and a shopping cart with quantity controls. Include add-to-cart animations and a checkout summary.",
  },
  {
    title: "Portfolio Website",
    prompt:
      "Create a personal portfolio website with a hero section, about me area, project gallery with hover effects and detail modals, a skills section, and a contact form. Use elegant typography and subtle animations.",
  },
  {
    title: "Fitness Tracker",
    prompt:
      "Build a mobile-first fitness tracker app with a workout logger, exercise library, progress charts showing weight and reps over time, a streak counter, and a weekly activity calendar. Use a motivating color scheme.",
  },
  {
    title: "AI Content Tool",
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
        setIdeas(data.ideas.map((i: { title: string; prompt: string }) => ({ title: i.title, prompt: i.prompt })));
      }
    } catch {
      // Keep current ideas on error
    } finally {
      setLoading(false);
      requestAnimationFrame(() => setFadeIn(true));
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-3xl">
      <div className="flex justify-center gap-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-32 animate-pulse rounded-full bg-white/[0.06]"
              />
            ))
          : ideas.map((idea, i) => (
              <button
                key={`${idea.title}-${i}`}
                onClick={() => onSelect(idea.prompt)}
                className={`whitespace-nowrap rounded-full border border-white/10 bg-black/50 px-4 py-2 text-[13px] font-medium text-white/90 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-white ${
                  fadeIn ? "opacity-100" : "opacity-0"
                }`}
                style={{ transitionDuration: `${150 + i * 40}ms` }}
              >
                {idea.title}
              </button>
            ))}
      </div>
      <button
        onClick={fetchMoreIdeas}
        disabled={loading}
        className="flex items-center gap-1.5 text-[12px] font-medium text-white/80 transition-colors hover:text-white disabled:opacity-50"
      >
        <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        More ideas
      </button>
    </div>
  );
}
