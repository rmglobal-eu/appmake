"use client";

import {
  Layout,
  BarChart3,
  ShoppingCart,
  User,
  FileText,
  Rocket,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface TemplateSuggestionsProps {
  onSelect: (templatePrompt: string) => void;
}

interface Template {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  prompt: string;
  color: string;
}

const templates: Template[] = [
  {
    id: "landing-page",
    title: "Landing Page",
    description: "A modern landing page with hero section, features, pricing, and CTA",
    icon: Layout,
    prompt:
      "Create a modern landing page with a hero section featuring a headline, subheadline, and CTA button. Include sections for features (3-4 cards with icons), pricing tiers, testimonials, and a footer with links. Use a clean, professional design with smooth scroll animations.",
    color: "violet",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "An analytics dashboard with charts, stats, and data tables",
    icon: BarChart3,
    prompt:
      "Create an analytics dashboard with a sidebar navigation, top header with user info and notifications. Include stat cards (revenue, users, orders, growth), line/bar charts for trends, a recent activity feed, and a data table with sorting and pagination. Use a dark theme.",
    color: "blue",
  },
  {
    id: "ecommerce",
    title: "E-commerce",
    description: "A product catalog with cart, filters, and product detail views",
    icon: ShoppingCart,
    prompt:
      "Create an e-commerce storefront with a product grid, category filters sidebar, search bar, and shopping cart. Include a product detail modal with image gallery, size/color selectors, add-to-cart button, and reviews. Show cart with item count in the header.",
    color: "emerald",
  },
  {
    id: "portfolio",
    title: "Portfolio",
    description: "A personal portfolio with project showcase and contact form",
    icon: User,
    prompt:
      "Create a personal portfolio website with an about section, skills showcase, project gallery with filtering by category, timeline/experience section, and a contact form. Include smooth transitions, a dark/light mode toggle, and responsive design.",
    color: "amber",
  },
  {
    id: "blog",
    title: "Blog",
    description: "A blog with article cards, categories, and reading experience",
    icon: FileText,
    prompt:
      "Create a blog platform with a homepage showing article cards (thumbnail, title, excerpt, date, author, read time), category navigation, featured post hero, and an article reading view with table of contents, share buttons, and related posts.",
    color: "rose",
  },
  {
    id: "saas",
    title: "SaaS App",
    description: "A SaaS application with auth, settings, and team management",
    icon: Rocket,
    prompt:
      "Create a SaaS application interface with login/signup pages, a main app view with sidebar navigation, settings page (profile, billing, team members), notification center, and an onboarding flow. Include a command palette (Cmd+K) and responsive design.",
    color: "cyan",
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; icon: string; hover: string }> = {
  violet: {
    bg: "bg-violet-500/[0.08]",
    border: "border-violet-500/20",
    text: "text-violet-400",
    icon: "text-violet-400",
    hover: "hover:border-violet-500/40 hover:bg-violet-500/[0.12]",
  },
  blue: {
    bg: "bg-blue-500/[0.08]",
    border: "border-blue-500/20",
    text: "text-blue-400",
    icon: "text-blue-400",
    hover: "hover:border-blue-500/40 hover:bg-blue-500/[0.12]",
  },
  emerald: {
    bg: "bg-emerald-500/[0.08]",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    icon: "text-emerald-400",
    hover: "hover:border-emerald-500/40 hover:bg-emerald-500/[0.12]",
  },
  amber: {
    bg: "bg-amber-500/[0.08]",
    border: "border-amber-500/20",
    text: "text-amber-400",
    icon: "text-amber-400",
    hover: "hover:border-amber-500/40 hover:bg-amber-500/[0.12]",
  },
  rose: {
    bg: "bg-rose-500/[0.08]",
    border: "border-rose-500/20",
    text: "text-rose-400",
    icon: "text-rose-400",
    hover: "hover:border-rose-500/40 hover:bg-rose-500/[0.12]",
  },
  cyan: {
    bg: "bg-cyan-500/[0.08]",
    border: "border-cyan-500/20",
    text: "text-cyan-400",
    icon: "text-cyan-400",
    hover: "hover:border-cyan-500/40 hover:bg-cyan-500/[0.12]",
  },
};

export default function TemplateSuggestions({
  onSelect,
}: TemplateSuggestionsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-white/90 mb-1">
          Start with a template
        </h2>
        <p className="text-sm text-white/40">
          Choose a template to get started quickly, or type your own prompt
          below
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {templates.map((template) => {
          const colors = colorMap[template.color];
          const Icon = template.icon;

          return (
            <button
              key={template.id}
              onClick={() => onSelect(template.prompt)}
              className={`group/card text-left p-4 rounded-xl border ${colors.border} ${colors.bg} ${colors.hover} transition-all duration-200`}
            >
              <div
                className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center mb-3 group-hover/card:scale-110 transition-transform duration-200`}
              >
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>
              <h3 className="text-sm font-medium text-white/90 mb-1">
                {template.title}
              </h3>
              <p className="text-xs text-white/40 leading-relaxed line-clamp-2">
                {template.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
