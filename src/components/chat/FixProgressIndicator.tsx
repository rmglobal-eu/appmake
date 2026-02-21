"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Wrench,
  Sparkles,
  Zap,
} from "lucide-react";
import { usePreviewErrorStore } from "@/lib/stores/preview-error-store";

type FixPhase = "analyzing" | "applying" | "verifying" | "done" | "failed";

const PHASE_MESSAGES: Record<FixPhase, string[]> = {
  analyzing: [
    "Analyzing error patterns...",
    "Classifying error type...",
    "Identifying root cause...",
    "Searching for fix strategy...",
  ],
  applying: [
    "Applying code fix...",
    "Transforming source code...",
    "Patching affected files...",
    "Updating imports...",
  ],
  verifying: [
    "Rebuilding preview...",
    "Verifying fix worked...",
    "Running error checks...",
    "Validating output...",
  ],
  done: ["Fix applied successfully!"],
  failed: ["Fix attempt failed"],
};

function getPhaseFromStatus(
  fixStatus: string | undefined
): FixPhase {
  switch (fixStatus) {
    case "fixing":
      return "applying";
    case "verifying":
      return "verifying";
    case "success":
      return "done";
    case "failed":
      return "failed";
    default:
      return "analyzing";
  }
}

function getPhaseProgress(phase: FixPhase): number {
  switch (phase) {
    case "analyzing":
      return 25;
    case "applying":
      return 55;
    case "verifying":
      return 80;
    case "done":
      return 100;
    case "failed":
      return 100;
  }
}

function getPhaseColor(phase: FixPhase): string {
  switch (phase) {
    case "analyzing":
      return "text-violet-400";
    case "applying":
      return "text-blue-400";
    case "verifying":
      return "text-amber-400";
    case "done":
      return "text-emerald-400";
    case "failed":
      return "text-red-400";
  }
}

function getProgressBarColor(phase: FixPhase): string {
  switch (phase) {
    case "analyzing":
      return "bg-violet-500";
    case "applying":
      return "bg-blue-500";
    case "verifying":
      return "bg-amber-500";
    case "done":
      return "bg-emerald-500";
    case "failed":
      return "bg-red-500";
  }
}

function PhaseIcon({
  phase,
  className,
}: {
  phase: FixPhase;
  className?: string;
}) {
  const baseClass = className || "h-4 w-4";
  switch (phase) {
    case "analyzing":
      return <Sparkles className={`${baseClass} text-violet-400`} />;
    case "applying":
      return (
        <Wrench
          className={`${baseClass} text-blue-400 animate-pulse`}
        />
      );
    case "verifying":
      return (
        <Loader2
          className={`${baseClass} text-amber-400 animate-spin`}
        />
      );
    case "done":
      return (
        <CheckCircle2 className={`${baseClass} text-emerald-400`} />
      );
    case "failed":
      return <XCircle className={`${baseClass} text-red-400`} />;
  }
}

export default function FixProgressIndicator() {
  const { ghostFixStatus, ghostFixMessage, ghostFixAttempts, errors } =
    usePreviewErrorStore();

  const [messageIndex, setMessageIndex] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const isActive =
    ghostFixStatus === "fixing" || ghostFixStatus === "verifying";

  const phase: FixPhase | null = isActive
    ? getPhaseFromStatus(ghostFixStatus)
    : ghostFixStatus === "success"
      ? "done"
      : ghostFixStatus === "failed"
        ? "failed"
        : null;

  const targetProgress = phase ? getPhaseProgress(phase) : 0;

  // Rotate through phase messages
  useEffect(() => {
    if (!phase || phase === "done" || phase === "failed") return;

    const messages = PHASE_MESSAGES[phase];
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [phase]);

  // Animate progress bar smoothly
  useEffect(() => {
    const step = () => {
      setAnimatedProgress((prev) => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 0.5) return targetProgress;
        return prev + diff * 0.08;
      });
    };

    const frame = setInterval(step, 16);
    return () => clearInterval(frame);
  }, [targetProgress]);

  // Reset message index when phase changes
  useEffect(() => {
    setMessageIndex(0);
  }, [phase]);

  // Don't render if no active fix
  if (!phase) return null;

  const messages = PHASE_MESSAGES[phase];
  const currentMessage =
    ghostFixMessage || messages[messageIndex % messages.length];
  const phaseColor = getPhaseColor(phase);
  const barColor = getProgressBarColor(phase);

  const firstError = errors[0];

  return (
    <div className="bg-[#1a1a22] border border-white/[0.06] rounded-xl overflow-hidden shadow-2xl">
      {/* Main content */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          {/* Phase indicator */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <PhaseIcon phase={phase} className="h-4.5 w-4.5" />
              {(phase === "analyzing" || phase === "applying") && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-400 animate-ping opacity-75" />
              )}
            </div>
            <div className="flex flex-col">
              <span
                className={`text-sm font-semibold ${phaseColor} leading-tight`}
              >
                Ghost-Fix Active
              </span>
              {ghostFixAttempts > 0 && (
                <span className="text-[10px] text-white/25">
                  Attempt {ghostFixAttempts}
                </span>
              )}
            </div>
          </div>

          {/* Zap icon for flair */}
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-yellow-500/40" />
            <span className="text-[10px] text-white/20 font-medium uppercase tracking-wider">
              Auto-Fix
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-2.5">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out ${barColor}`}
            style={{ width: `${animatedProgress}%` }}
          />
          {/* Shimmer effect */}
          {phase !== "done" && phase !== "failed" && (
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            </div>
          )}
        </div>

        {/* Status message with fade animation */}
        <div className="flex items-center justify-between">
          <p
            key={`${phase}-${messageIndex}`}
            className="text-xs text-white/40 animate-fade-in"
          >
            {currentMessage}
          </p>
          <span className="text-[10px] text-white/20 tabular-nums">
            {Math.round(animatedProgress)}%
          </span>
        </div>

        {/* Error context */}
        {firstError && (
          <div className="mt-2.5 flex items-center gap-2 px-2.5 py-1.5 bg-white/[0.02] rounded-lg border border-white/[0.04]">
            <span className="text-[10px] text-white/20 uppercase tracking-wider flex-shrink-0">
              Fixing
            </span>
            <span className="text-[11px] text-white/40 font-mono truncate">
              {firstError.message.slice(0, 80)}
              {firstError.source ? ` in ${firstError.source}` : ""}
            </span>
          </div>
        )}
      </div>

      {/* Phase step indicators */}
      <div className="flex items-center gap-0 border-t border-white/[0.04]">
        {(
          ["analyzing", "applying", "verifying", "done"] as FixPhase[]
        ).map((step, i) => {
          const isActiveStep = step === phase;
          const isComplete =
            phase === "done" ||
            getPhaseProgress(phase) > getPhaseProgress(step);
          const isFailed = phase === "failed" && step !== "done";

          return (
            <div
              key={step}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-medium transition-colors
                ${
                  isActiveStep
                    ? `${getPhaseColor(step)} bg-white/[0.03]`
                    : isComplete
                      ? "text-emerald-500/50"
                      : isFailed
                        ? "text-red-400/30"
                        : "text-white/15"
                }
                ${i < 3 ? "border-r border-white/[0.04]" : ""}
              `}
            >
              {isComplete && !isActiveStep ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : isActiveStep ? (
                <PhaseIcon phase={step} className="h-3 w-3" />
              ) : null}
              <span className="capitalize">{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
