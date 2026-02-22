"use client";

import { useState, useMemo } from "react";
import {
  Check,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Rocket,
  FileCode2,
  Pencil,
  Lightbulb,
  Zap,
  Package,
} from "lucide-react";

interface PlanCardProps {
  title: string;
  content: string;
  onApprove?: () => void;
  onReject?: () => void;
  isStreaming?: boolean;
  resolved?: "approved" | "rejected";
}

// ---------------------------------------------------------------------------
// Parse plan markdown into structured sections
// ---------------------------------------------------------------------------

interface PlanSection {
  type: "build" | "approach" | "changes" | "details" | "other";
  heading: string;
  items: string[];
  raw: string;
}

function parsePlanContent(content: string): {
  summary: string;
  sections: PlanSection[];
  newFiles: string[];
  modifiedFiles: string[];
  keyFeatures: string[];
} {
  const lines = content.split("\n");
  const sections: PlanSection[] = [];
  let currentSection: PlanSection | null = null;
  let summary = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headings
    const h2Match = trimmed.match(/^#{1,3}\s+(.+)/);
    if (h2Match) {
      if (currentSection) sections.push(currentSection);

      const heading = h2Match[1].trim();
      const lower = heading.toLowerCase();
      const type: PlanSection["type"] = lower.includes("build") || lower.includes("byg")
        ? "build"
        : lower.includes("approach") || lower.includes("tilgang") || lower.includes("strategi")
          ? "approach"
          : lower.includes("change") || lower.includes("ændr") || lower.includes("fil")
            ? "changes"
            : lower.includes("detail") || lower.includes("key")
              ? "details"
              : "other";

      currentSection = { type, heading, items: [], raw: "" };
      continue;
    }

    // Collect items
    if (currentSection) {
      currentSection.raw += line + "\n";
      const bullet = trimmed.match(/^[-*•]\s+(.+)/);
      if (bullet) {
        currentSection.items.push(bullet[1]);
      } else if (trimmed && !trimmed.startsWith("```")) {
        // Non-empty, non-code line — could be a paragraph
        if (currentSection.items.length === 0 && !summary) {
          summary = trimmed;
        }
      }
    } else if (trimmed && !trimmed.startsWith("```") && !trimmed.startsWith("---")) {
      // Text before any heading — use as summary
      if (!summary) summary = trimmed;
    }
  }
  if (currentSection) sections.push(currentSection);

  // Extract file info from changes section
  const newFiles: string[] = [];
  const modifiedFiles: string[] = [];
  const keyFeatures: string[] = [];

  for (const section of sections) {
    if (section.type === "changes") {
      for (const item of section.items) {
        const clean = item.replace(/`/g, "").trim();
        if (/\b(new|ny|opret|create|add|tilføj)\b/i.test(item)) {
          newFiles.push(clean);
        } else if (/\b(modif|ændr|updat|opdater|edit|redig)\b/i.test(item)) {
          modifiedFiles.push(clean);
        } else {
          modifiedFiles.push(clean);
        }
      }
    }
    if (section.type === "build") {
      keyFeatures.push(...section.items.slice(0, 4));
    }
  }

  // If no summary found, use first section text
  if (!summary && sections.length > 0) {
    summary = sections[0].items[0] || "";
  }

  return { summary, sections, newFiles, modifiedFiles, keyFeatures };
}

// ---------------------------------------------------------------------------
// Section icon helper
// ---------------------------------------------------------------------------

function SectionIcon({ type }: { type: PlanSection["type"] }) {
  switch (type) {
    case "build":
      return <Lightbulb className="h-3.5 w-3.5 text-amber-400" />;
    case "approach":
      return <Zap className="h-3.5 w-3.5 text-blue-400" />;
    case "changes":
      return <FileCode2 className="h-3.5 w-3.5 text-violet-400" />;
    case "details":
      return <Package className="h-3.5 w-3.5 text-emerald-400" />;
    default:
      return <Pencil className="h-3.5 w-3.5 text-white/40" />;
  }
}

// ---------------------------------------------------------------------------
// PlanCard component
// ---------------------------------------------------------------------------

export function PlanCard({
  title,
  content,
  onApprove,
  onReject,
  isStreaming,
  resolved,
}: PlanCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const parsed = useMemo(
    () => parsePlanContent(content),
    [content]
  );

  const totalFiles =
    parsed.newFiles.length + parsed.modifiedFiles.length;

  return (
    <div
      className={`relative rounded-xl border overflow-hidden transition-all duration-300 ${
        isStreaming
          ? "border-violet-500/30 bg-gradient-to-b from-violet-500/[0.08] to-transparent shadow-lg shadow-violet-500/5"
          : resolved === "approved"
            ? "border-emerald-500/25 bg-gradient-to-b from-emerald-500/[0.06] to-transparent"
            : resolved === "rejected"
              ? "border-red-500/20 bg-gradient-to-b from-red-500/[0.04] to-transparent"
              : "border-white/[0.12] bg-white/[0.03]"
      }`}
    >
      {/* Animated top accent during streaming */}
      {isStreaming && (
        <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden">
          <div
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-violet-500 to-transparent"
            style={{
              animation: "progress-indeterminate 1.5s ease-in-out infinite",
            }}
          />
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          {isStreaming ? (
            <div className="relative flex h-8 w-8 items-center justify-center shrink-0">
              <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/15" />
              <Sparkles className="relative h-4 w-4 text-violet-400 animate-pulse" />
            </div>
          ) : resolved === "approved" ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 shrink-0">
              <Check className="h-4 w-4 text-emerald-400" />
            </div>
          ) : resolved === "rejected" ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 shrink-0">
              <X className="h-4 w-4 text-red-400" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15 shrink-0">
              <Rocket className="h-4 w-4 text-violet-400" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white leading-tight">
              {title}
            </h3>
            <p className="text-[11px] text-white/40 mt-0.5">
              {isStreaming
                ? "Analyserer din forespørgsel..."
                : resolved === "approved"
                  ? "Godkendt — bygger nu"
                  : resolved === "rejected"
                    ? "Afvist"
                    : parsed.summary
                      ? parsed.summary.slice(0, 80) + (parsed.summary.length > 80 ? "..." : "")
                      : "Klar til godkendelse"}
            </p>
          </div>
        </div>
      </div>

      {/* Quick stats bar */}
      {!isStreaming && parsed.sections.length > 0 && (
        <div className="flex items-center gap-3 px-4 pb-3">
          {parsed.keyFeatures.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1">
              <Lightbulb className="h-3 w-3 text-amber-400" />
              <span className="text-[11px] text-amber-300/80">
                {parsed.keyFeatures.length} {parsed.keyFeatures.length === 1 ? "feature" : "features"}
              </span>
            </div>
          )}
          {totalFiles > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1">
              <FileCode2 className="h-3 w-3 text-violet-400" />
              <span className="text-[11px] text-violet-300/80">
                {totalFiles} {totalFiles === 1 ? "fil" : "filer"}
              </span>
            </div>
          )}
          {parsed.sections.find((s) => s.type === "approach") && (
            <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1">
              <Zap className="h-3 w-3 text-blue-400" />
              <span className="text-[11px] text-blue-300/80">Plan klar</span>
            </div>
          )}
        </div>
      )}

      {/* Key features preview */}
      {!isStreaming && parsed.keyFeatures.length > 0 && !resolved && (
        <div className="px-4 pb-3">
          <div className="space-y-1.5">
            {parsed.keyFeatures.map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-[12px] text-white/55 leading-relaxed"
              >
                <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                <span>{feature.replace(/\*\*/g, "").replace(/`/g, "")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expandable technical details */}
      {!isStreaming && parsed.sections.length > 0 && (
        <div className="border-t border-white/[0.06]">
          <button
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-[11px] text-white/30 hover:text-white/50 transition-colors"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {showDetails ? "Skjul detaljer" : "Vis tekniske detaljer"}
          </button>

          {showDetails && (
            <div className="px-4 pb-3 space-y-3">
              {parsed.sections.map((section, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <SectionIcon type={section.type} />
                    <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
                      {section.heading}
                    </span>
                  </div>
                  <div className="space-y-1 pl-5">
                    {section.items.map((item, j) => (
                      <p
                        key={j}
                        className="text-[12px] text-white/40 leading-relaxed"
                      >
                        {item.replace(/`([^`]+)`/g, "→ $1")}
                      </p>
                    ))}
                    {section.items.length === 0 && (
                      <p className="text-[12px] text-white/30 italic">
                        {section.raw.trim().slice(0, 150)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="flex items-center gap-2 px-4 pb-3">
          <span className="inline-block h-4 w-0.5 animate-pulse rounded-full bg-violet-500" />
          <span className="text-[11px] text-violet-300/40">
            Skriver plan...
          </span>
        </div>
      )}

      {/* Approve/Reject buttons */}
      {!resolved && !isStreaming && content.trim() && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]">
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99]"
            onClick={onApprove}
          >
            <Rocket className="h-4 w-4" />
            Godkend & Byg
          </button>
          <button
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            onClick={onReject}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
