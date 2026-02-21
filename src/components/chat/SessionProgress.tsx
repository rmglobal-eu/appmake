"use client";

import { useUpdateCardStore } from "@/lib/stores/update-card-store";
import { Brain, Search, Hammer, CheckCircle2 } from "lucide-react";

const PHASES = [
  { key: "thinking", label: "Thinking", icon: Brain },
  { key: "researching", label: "Researching", icon: Search },
  { key: "building", label: "Building", icon: Hammer },
  { key: "complete", label: "Done", icon: CheckCircle2 },
] as const;

const PHASE_ORDER = { idle: -1, thinking: 0, researching: 1, building: 2, complete: 3 };

export function SessionProgress() {
  const { sessionPhase, toolCallCount } = useUpdateCardStore();

  if (sessionPhase === "idle") return null;

  const currentIndex = PHASE_ORDER[sessionPhase];

  return (
    <div className="@container px-4 py-2">
      <div className="flex w-full items-center gap-0 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
        {PHASES.map((phase, i) => {
          const isActive = phase.key === sessionPhase;
          const isCompleted = PHASE_ORDER[phase.key] < currentIndex;
          const isPending = PHASE_ORDER[phase.key] > currentIndex;
          const Icon = phase.icon;

          const label =
            phase.key === "researching" && toolCallCount > 0
              ? `${phase.label} (${toolCallCount})`
              : phase.label;

          return (
            <>
              {/* Connecting line (flex-1 so lines stretch, not steps) */}
              {i > 0 && (
                <div
                  key={`line-${phase.key}`}
                  className={`mx-1 h-px flex-1 transition-colors duration-300 ${
                    isCompleted || isActive
                      ? "bg-emerald-500/40"
                      : "bg-white/[0.08]"
                  }`}
                />
              )}

              {/* Step pill (shrink-0 so it keeps its size) */}
              <div
                key={phase.key}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? "bg-violet-500/15 text-violet-300"
                    : isCompleted
                    ? "text-emerald-400/90"
                    : "text-white/25"
                }`}
                title={label}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isActive ? "animate-pulse" : ""
                    } ${isPending ? "text-white/25" : ""}`}
                  />
                )}
                {isActive ? (
                  <span>{label}</span>
                ) : (
                  <span className="hidden @[360px]:inline">{label}</span>
                )}
              </div>
            </>
          );
        })}
      </div>
    </div>
  );
}
